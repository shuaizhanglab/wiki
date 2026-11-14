"""Validate the optical inventory CSV and generate the site's JSON data.

Uses only the Python standard library so CSV checks also work before installing
MkDocs. The CSV is the sole source of inventory records.
"""

from __future__ import annotations

import argparse
import csv
from datetime import date
import io
import json
import math
from pathlib import Path
import re
import sys
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = ROOT / "docs" / "assets" / "data" / "inventory.csv"
DEFAULT_OUTPUT = DEFAULT_SOURCE.with_suffix(".json")
FIELDS = (
    "id", "name", "category", "subtype", "brand", "model",
    "wavelength_min_nm", "wavelength_max_nm", "diameter_mm",
    "transmission_pct", "reflection_pct", "split_ratio",
    "center_wavelength_nm", "bandwidth_nm", "cutoff_wavelength_nm",
    "optical_density", "aoi_deg", "polarization",
    "quantity_available", "quantity_in_use", "quantity_loaned",
    "quantity_unavailable", "location", "owner", "datasheet_url", "notes",
    "verified_on", "is_demo",
)
OPTIONAL_FIELDS = ("name_en", "subtype_en", "location_en", "owner_en", "notes_en")
ALL_FIELDS = FIELDS + OPTIONAL_FIELDS
CATEGORIES = {"Beam splitter", "Filter", "Mirror", "Lens", "Waveplate", "Polarizer"}
QUANTITY_FIELDS = (
    "quantity_available", "quantity_in_use", "quantity_loaned",
    "quantity_unavailable",
)
NUMBER_FIELDS = (
    "wavelength_min_nm", "wavelength_max_nm", "diameter_mm",
    "transmission_pct", "reflection_pct", "center_wavelength_nm",
    "bandwidth_nm", "cutoff_wavelength_nm", "optical_density", "aoi_deg",
)
POSITIVE_FIELDS = {
    "wavelength_min_nm", "wavelength_max_nm", "diameter_mm",
    "center_wavelength_nm", "bandwidth_nm", "cutoff_wavelength_nm",
}
REQUIRED_FIELDS = {"id", "name", "category", "model", "location", "verified_on", "is_demo"}
MAX_FILE_BYTES = 5 * 1024 * 1024
MAX_ROWS = 10000
MAX_TEXT_LENGTH = 4000
MAX_QUANTITY = 1000000


class InventoryError(ValueError):
    """A human-readable CSV validation error, including a line number."""


def _fail(line: int, field: str, message: str) -> None:
    raise InventoryError(f"CSV 第 {line} 行 / {field}: {message}")


def _number(raw: str, field: str, line: int) -> float | int | None:
    if not raw:
        return None
    try:
        number = float(raw)
    except ValueError:
        _fail(line, field, "请输入数字；未知参数请留空")
    if not math.isfinite(number) or number < 0:
        _fail(line, field, "必须是有限的非负数")
    if field in POSITIVE_FIELDS and number == 0:
        _fail(line, field, "必须大于 0；未知参数请留空")
    if field.endswith("_pct") and number > 100:
        _fail(line, field, "百分数范围应为 0–100（不要填写百分号）")
    if field == "aoi_deg" and number > 90:
        _fail(line, field, "入射角范围应为 0–90 度")
    if number > 1e12:
        _fail(line, field, "数值过大，请检查单位")
    return int(number) if number.is_integer() else number


def _validate_url(raw: str, line: int) -> None:
    if not raw:
        return
    if any(ord(character) < 32 for character in raw) or "\\" in raw:
        _fail(line, "datasheet_url", "链接含有不允许的字符")
    try:
        parsed = urlsplit(raw)
        hostname = parsed.hostname
    except ValueError:
        _fail(line, "datasheet_url", "链接格式无效")
    if parsed.scheme:
        if parsed.scheme != "https" or not hostname or parsed.username or parsed.password:
            _fail(line, "datasheet_url", "仅支持 HTTPS 链接或站内相对路径")
    elif raw.startswith("//") or parsed.netloc or ":" in raw:
        _fail(line, "datasheet_url", "仅支持 HTTPS 链接或站内相对路径")


def _convert_row(row: dict[str, str], line: int) -> dict:
    record = {}
    for field in ALL_FIELDS:
        value = row.get(field, "").strip()
        if len(value) > MAX_TEXT_LENGTH:
            _fail(line, field, f"内容超过 {MAX_TEXT_LENGTH} 字符")
        if "\x00" in value:
            _fail(line, field, "内容不能含有空字符")
        if field in REQUIRED_FIELDS and not value:
            _fail(line, field, "此字段必填")
        record[field] = value

    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{0,63}", record["id"]):
        _fail(line, "id", "请使用 1–64 位字母、数字、点、下划线或连字符")
    if record["category"] not in CATEGORIES:
        _fail(line, "category", "不支持的类型；请使用文档列出的英文类型")

    for field in NUMBER_FIELDS:
        record[field] = _number(record[field], field, line)
    for field in QUANTITY_FIELDS:
        raw = record[field]
        if not re.fullmatch(r"[0-9]+", raw):
            _fail(line, field, "数量必填，且必须是非负整数")
        number = int(raw)
        if number > MAX_QUANTITY:
            _fail(line, field, f"数量不能超过 {MAX_QUANTITY}")
        record[field] = number

    minimum = record["wavelength_min_nm"]
    maximum = record["wavelength_max_nm"]
    if minimum is not None and maximum is not None and minimum > maximum:
        _fail(line, "wavelength_min_nm", "波长下限不能大于上限")

    if record["split_ratio"]:
        match = re.fullmatch(r"([0-9]+(?:\.[0-9]+)?)\s*:\s*([0-9]+(?:\.[0-9]+)?)", record["split_ratio"])
        if not match or float(match[1]) + float(match[2]) <= 0:
            _fail(line, "split_ratio", "请按 R:T 填写，如 50:50")
        record["split_ratio"] = f"{match[1]}:{match[2]}"

    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", record["verified_on"]):
        _fail(line, "verified_on", "日期格式应为 YYYY-MM-DD")
    try:
        date.fromisoformat(record["verified_on"])
    except ValueError:
        _fail(line, "verified_on", "日期不存在")
    demo = record["is_demo"].lower()
    if demo not in {"true", "false"}:
        _fail(line, "is_demo", "请填写 true 或 false")
    record["is_demo"] = demo == "true"
    _validate_url(record["datasheet_url"], line)
    record["quantity_total"] = sum(record[field] for field in QUANTITY_FIELDS)
    return record


def load_inventory(source: Path | str = DEFAULT_SOURCE) -> dict:
    """Read and validate CSV, returning normalized JSON-compatible data.

    Columns may be reordered. All original FIELDS are required in the header;
    OPTIONAL_FIELDS may be omitted and normalize to empty strings in JSON.
    Empty numeric specifications become None, never an invented zero.
    """
    source = Path(source)
    try:
        if source.stat().st_size > MAX_FILE_BYTES:
            raise InventoryError("CSV 超过 5 MiB，请拆分或减少内容")
        content = source.read_text(encoding="utf-8-sig")
    except (OSError, UnicodeError) as error:
        raise InventoryError(f"无法读取 UTF-8 CSV：{source.name}（{error}）") from error

    reader = csv.DictReader(io.StringIO(content, newline=""), strict=True)
    records = []
    identifiers = set()
    try:
        headers = reader.fieldnames
        if headers is None:
            raise InventoryError("CSV 为空，缺少表头")
        if len(headers) != len(set(headers)):
            raise InventoryError("CSV 表头存在重复列名")
        missing = sorted(set(FIELDS) - set(headers))
        extra = sorted(set(headers) - set(ALL_FIELDS))
        if missing or extra:
            details = []
            if missing:
                details.append("缺少列：" + ", ".join(missing))
            if extra:
                details.append("未知列：" + ", ".join(extra))
            raise InventoryError("CSV 表头不匹配；" + "；".join(details))
        for row in reader:
            if None in row or any(value is None for value in row.values()):
                _fail(reader.line_num, "CSV", "数据列数与表头不一致；含逗号的内容需要双引号包围")
            if len(records) >= MAX_ROWS:
                raise InventoryError(f"CSV 不能超过 {MAX_ROWS} 条记录")
            record = _convert_row(row, reader.line_num)
            if record["id"] in identifiers:
                _fail(reader.line_num, "id", f"编号重复：{record['id']}")
            identifiers.add(record["id"])
            records.append(record)
    except csv.Error as error:
        raise InventoryError(f"CSV 第 {reader.line_num} 行：格式无效（{error}）") from error

    return {
        "schema_version": 1,
        "is_demo": any(record["is_demo"] for record in records),
        "last_updated": max((record["verified_on"] for record in records), default=None),
        "items": records,
    }


def write_inventory(source: Path | str = DEFAULT_SOURCE, output: Path | str = DEFAULT_OUTPUT) -> dict:
    """Validate before writing, preserving any prior JSON when validation fails."""
    payload = load_inventory(source)
    output = Path(output)
    output.parent.mkdir(parents=True, exist_ok=True)
    content = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
    # Avoid triggering another MkDocs live-reload build when data is unchanged.
    if not output.exists() or output.read_text(encoding="utf-8") != content:
        output.write_text(content, encoding="utf-8")
    return payload


def main(argv: list[str] | None = None) -> int:
    # Windows redirected shells may otherwise default to a Western code page.
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description="校验光学元件 CSV，并生成网站查询数据")
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE, help="CSV 路径")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="生成的 JSON 路径")
    parser.add_argument("--check", action="store_true", help="只校验，不写文件")
    arguments = parser.parse_args(argv)
    try:
        payload = load_inventory(arguments.source) if arguments.check else write_inventory(arguments.source, arguments.output)
    except InventoryError as error:
        print(f"库存校验失败：{error}", file=sys.stderr)
        return 1
    action = "校验通过" if arguments.check else "已生成查询数据"
    print(f"{action}：{len(payload['items'])} 条记录，最近核对 {payload['last_updated'] or '尚无记录'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
