---
title: Maintenance
template: wiki-doc.html
lang: en
translation: data-guide/
---

# Maintenance

Edit `docs/assets/data/inventory.csv`, keep the column headers and save as UTF-8 CSV. JSON is generated during the build; do not edit it directly.

Each row represents identical items with the same model, specifications and location. Use separate rows for different locations or specifications, with a unique `id`. Move quantities between states when updating stock to avoid double counting.

## Basic fields

| Field | Rule |
|---|---|
| `id` | Required; 1–64 ASCII letters, digits, dots, underscores or hyphens; start with a letter or digit |
| `name` | Required; item name |
| `category` | Required; use one of the types below |
| `subtype` | For example Bandpass, ND or Non-polarizing |
| `brand` | Manufacturer |
| `model` | Required; use `Unknown` if not confirmed |
| `location` | Required; room, cabinet and drawer |
| `owner` | Person responsible for the record |
| `datasheet_url` | HTTPS datasheet URL or a relative site path |
| `notes` | Specification conditions and status notes |
| `verified_on` | Required; verification date in `YYYY-MM-DD` format |
| `is_demo` | Required; `true` for fictional examples, `false` for actual stock |

Types: `Beam splitter`, `Filter`, `Mirror`, `Lens`, `Waveplate`, `Polarizer`.

## Optical specifications

Enter numbers without units. Leave unknown or inapplicable values blank; do not use `0` for unknown values.

| Field | Meaning / unit |
|---|---|
| `wavelength_min_nm` | Lower operating wavelength, nm |
| `wavelength_max_nm` | Upper operating wavelength, nm; at least the lower value |
| `diameter_mm` | Diameter, mm; put non-circular dimensions in notes |
| `transmission_pct` | Transmission, 0–100% |
| `reflection_pct` | Reflection, 0–100% |
| `split_ratio` | `R:T`, for example `50:50` |
| `center_wavelength_nm` | Center wavelength, nm |
| `bandwidth_nm` | FWHM bandwidth, nm |
| `cutoff_wavelength_nm` | Cutoff wavelength, nm |
| `optical_density` | Optical density OD, nonnegative |
| `aoi_deg` | Angle of incidence, 0–90 degrees |
| `polarization` | Polarization conditions |

Record nominal or measured conditions in `notes` and attach the relevant datasheet. Wavelength filtering requires both ends of the operating range.

## Stock

All four columns require nonnegative integers. Enter `0` when there is no stock. Total quantity is calculated automatically.

| Field | Meaning |
|---|---|
| `quantity_available` | Available |
| `quantity_in_use` | In use |
| `quantity_loaned` | On loan |
| `quantity_unavailable` | Awaiting inspection or damaged |

## Optional English text

The original 28-column CSV remains supported. Add these optional columns for English display; missing values fall back to the original fields:

| Field | Original field |
|---|---|
| `name_en` | `name` |
| `subtype_en` | `subtype` |
| `location_en` | `location` |
| `owner_en` | `owner` |
| `notes_en` | `notes` |

## Check and publish

```sh
python scripts/inventory.py --check
python -m mkdocs build --strict
```

On Windows, use `.\.venv\Scripts\python.exe` instead of `python`. Rebuild or restart the local preview. After connecting GitHub, commit the CSV to publish through the workflow.
