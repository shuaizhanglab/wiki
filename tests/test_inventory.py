"""Tests for CSV parsing and the inventory data contract (no MkDocs required)."""

import csv
from importlib.util import module_from_spec, spec_from_file_location
import io
import json
from pathlib import Path
import tempfile
import unittest


specification = spec_from_file_location("inventory", Path(__file__).resolve().parents[1] / "scripts" / "inventory.py")
inventory = module_from_spec(specification)
specification.loader.exec_module(inventory)


def item(**changes):
    result = dict.fromkeys(inventory.FIELDS, "")
    result.update({
        "id": "DEMO-BS-001", "name": "示例分束镜", "category": "Beam splitter",
        "model": "DEMO-BS5050", "wavelength_min_nm": "400", "wavelength_max_nm": "700",
        "transmission_pct": "50", "reflection_pct": "50", "split_ratio": "50:50",
        "quantity_available": "3", "quantity_in_use": "2", "quantity_loaned": "1",
        "quantity_unavailable": "0", "location": "光学室 / A 柜 / 01 抽屉",
        "verified_on": "2026-11-14", "is_demo": "true",
    })
    result.update(changes)
    return result


class InventoryTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.source = Path(self.directory.name) / "inventory.csv"

    def write(self, rows, *, bom=False, headers=None):
        output = io.StringIO(newline="")
        writer = csv.DictWriter(output, fieldnames=headers or inventory.FIELDS)
        writer.writeheader()
        writer.writerows(rows)
        self.source.write_text(output.getvalue(), encoding="utf-8-sig" if bom else "utf-8", newline="")
        return self.source

    def test_bom_commas_quotes_and_newlines_are_preserved(self):
        note = '示例,"请核对"\n不代表真实库存'
        payload = inventory.load_inventory(self.write([item(notes=note)], bom=True))
        self.assertEqual(payload["items"][0]["notes"], note)
        self.assertEqual(payload["items"][0]["quantity_total"], 6)
        self.assertEqual(payload["schema_version"], 1)

    def test_unknown_specs_are_null_and_real_zero_is_retained(self):
        row = inventory.load_inventory(self.write([item(diameter_mm="", aoi_deg="0", transmission_pct="0")]))["items"][0]
        self.assertIsNone(row["diameter_mm"])
        self.assertEqual(row["aoi_deg"], 0)
        self.assertEqual(row["transmission_pct"], 0)

    def test_quantity_must_be_present_nonnegative_integer(self):
        for bad in ("", "-1", "1.5", "NaN", "1e3", "1000001"):
            with self.subTest(bad=bad), self.assertRaises(inventory.InventoryError):
                inventory.load_inventory(self.write([item(quantity_available=bad)]))

    def test_duplicate_id_is_rejected(self):
        with self.assertRaisesRegex(inventory.InventoryError, "编号重复"):
            inventory.load_inventory(self.write([item(), item()]))

    def test_invalid_numeric_specifications_are_rejected(self):
        for field, value in (("wavelength_min_nm", "701"), ("transmission_pct", "101"),
                             ("diameter_mm", "0"), ("aoi_deg", "91"), ("optical_density", "NaN"),
                             ("optical_density", "inf"), ("bandwidth_nm", "-1")):
            with self.subTest(field=field, value=value), self.assertRaises(inventory.InventoryError):
                inventory.load_inventory(self.write([item(**{field: value})]))

    def test_required_fields_category_date_and_ratio_are_validated(self):
        for changes in ({"name": ""}, {"category": "unknown"}, {"verified_on": "2026-02-30"},
                        {"verified_on": "20261114"}, {"split_ratio": "50/50"},
                        {"split_ratio": "0:0"}, {"is_demo": "maybe"}):
            with self.subTest(changes=changes), self.assertRaises(inventory.InventoryError):
                inventory.load_inventory(self.write([item(**changes)]))

    def test_dangerous_link_schemes_are_rejected(self):
        for link in ("javascript:alert(1)", "data:text/html,x", "http://example.com", "//example.com/x",
                     "https://name:secret@example.com/x", "https://", "\\\\host\\file"):
            with self.subTest(link=link), self.assertRaises(inventory.InventoryError):
                inventory.load_inventory(self.write([item(datasheet_url=link)]))

    def test_https_and_relative_links_are_supported(self):
        for link in ("https://example.com/spec.pdf", "../datasheets/example.pdf", "assets/example.pdf"):
            with self.subTest(link=link):
                result = inventory.load_inventory(self.write([item(datasheet_url=link)]))
                self.assertEqual(result["items"][0]["datasheet_url"], link)

    def test_script_like_text_remains_plain_data(self):
        text = '<img src=x onerror="alert(1)"><script>alert(1)</script>'
        output = Path(self.directory.name) / "inventory.json"
        inventory.write_inventory(self.write([item(name=text, notes="=SUM(A1:A2)")]), output)
        record = json.loads(output.read_text(encoding="utf-8"))["items"][0]
        self.assertEqual(record["name"], text)
        self.assertEqual(record["notes"], "=SUM(A1:A2)")

    def test_header_only_csv_is_valid_empty_inventory(self):
        payload = inventory.load_inventory(self.write([]))
        self.assertEqual(payload["items"], [])
        self.assertIsNone(payload["last_updated"])
        self.assertFalse(payload["is_demo"])

    def test_last_updated_and_demo_flag_come_from_records(self):
        payload = inventory.load_inventory(self.write([
            item(id="A", verified_on="2026-11-01", is_demo="false"),
            item(id="B", verified_on="2026-11-13", is_demo="true"),
        ]))
        self.assertEqual(payload["last_updated"], "2026-11-13")
        self.assertTrue(payload["is_demo"])

    def test_duplicate_or_missing_columns_are_rejected(self):
        for headers in (inventory.FIELDS[:-1], inventory.FIELDS + ("id",)):
            with self.subTest(headers=headers), self.assertRaises(inventory.InventoryError):
                inventory.load_inventory(self.write([], headers=headers))

    def test_legacy_csv_without_english_columns_still_loads(self):
        record = inventory.load_inventory(self.write([item()]))["items"][0]
        self.assertEqual(len(inventory.FIELDS), 28)
        for field in inventory.OPTIONAL_FIELDS:
            self.assertIn(field, record)
            self.assertEqual(record[field], "")

    def test_bilingual_csv_preserves_all_english_fields(self):
        english = {
            "name_en": "Visible non-polarizing beamsplitter",
            "subtype_en": "NPBS plate",
            "location_en": "Optics room / Cabinet A / Drawer 01",
            "owner_en": "Inventory manager",
            "notes_en": 'Demo record, "check label" before use.',
        }
        record = inventory.load_inventory(self.write([item(**english)], headers=inventory.ALL_FIELDS))["items"][0]
        self.assertEqual(record["name"], "示例分束镜")
        for field, text in english.items():
            self.assertEqual(record[field], text)

    def test_partial_english_columns_are_optional(self):
        record = inventory.load_inventory(self.write(
            [item(name_en="Demo beamsplitter")], headers=inventory.FIELDS + ("name_en",)
        ))["items"][0]
        self.assertEqual(record["name_en"], "Demo beamsplitter")
        self.assertEqual(record["location_en"], "")

    def test_unknown_column_is_still_rejected(self):
        with self.assertRaisesRegex(inventory.InventoryError, "未知列"):
            inventory.load_inventory(self.write([], headers=inventory.ALL_FIELDS + ("name_fr",)))

    def test_english_fields_are_subject_to_text_validation(self):
        for text in ("x" * (inventory.MAX_TEXT_LENGTH + 1), "bad\x00text"):
            with self.subTest(text_length=len(text)), self.assertRaises(inventory.InventoryError):
                inventory.load_inventory(self.write([item(notes_en=text)], headers=inventory.ALL_FIELDS))

    def test_malformed_rows_are_rejected(self):
        self.write([item()])
        text = self.source.read_text(encoding="utf-8")
        self.source.write_text(text.rstrip("\n") + ",extra\n", encoding="utf-8")
        with self.assertRaisesRegex(inventory.InventoryError, "列数"):
            inventory.load_inventory(self.source)

    def test_failed_validation_does_not_overwrite_json(self):
        output = Path(self.directory.name) / "inventory.json"
        output.write_text("previous", encoding="utf-8")
        with self.assertRaises(inventory.InventoryError):
            inventory.write_inventory(self.write([item(quantity_in_use="-1")]), output)
        self.assertEqual(output.read_text(encoding="utf-8"), "previous")

    def test_check_does_not_create_json(self):
        output = Path(self.directory.name) / "inventory.json"
        result = inventory.main(["--source", str(self.write([item()])), "--output", str(output), "--check"])
        self.assertEqual(result, 0)
        self.assertFalse(output.exists())


if __name__ == "__main__":
    unittest.main()
