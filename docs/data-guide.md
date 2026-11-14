---
title: 维护
template: wiki-doc.html
lang: zh
translation: en/data-guide/
---

# 维护

编辑 `docs/assets/data/inventory.csv`，保存为 UTF-8 CSV，保留表头。JSON 由构建生成，不直接编辑。

每行对应同型号、同参数、同位置的一组元件。位置或参数不同需分行，`id` 唯一。数量变化时调整对应状态，避免重复计数。

## 基本字段

| 字段 | 填写规则 |
|---|---|
| `id` | 必填，1–64 位英文字母、数字、点、下划线或连字符，以字母或数字开头 |
| `name` | 必填，名称 |
| `category` | 必填，使用下方类型值 |
| `subtype` | 子类型，如 Bandpass、ND、Non-polarizing |
| `brand` | 品牌 |
| `model` | 必填，型号；未知填“待确认” |
| `location` | 必填，精确到房间、柜子和抽屉 |
| `owner` | 负责人 |
| `datasheet_url` | HTTPS 规格书链接或站内相对路径 |
| `notes` | 参数条件、状态说明等 |
| `verified_on` | 必填，盘点日期，`YYYY-MM-DD` |
| `is_demo` | 必填，示例填 `true`，实际库存填 `false` |

类型值：`Beam splitter`、`Filter`、`Mirror`、`Lens`、`Waveplate`、`Polarizer`。

## 光学参数

只填数字，不附单位。未知或不适用留空，不能用 `0` 代替未知。

| 字段 | 含义 / 单位 |
|---|---|
| `wavelength_min_nm` | 适用波长下限，nm |
| `wavelength_max_nm` | 适用波长上限，nm，不小于下限 |
| `diameter_mm` | 直径，mm；非圆形尺寸写入备注 |
| `transmission_pct` | 透过率，0–100% |
| `reflection_pct` | 反射率，0–100% |
| `split_ratio` | 分光比 `R:T`，如 `50:50` |
| `center_wavelength_nm` | 中心波长，nm |
| `bandwidth_nm` | 带宽 FWHM，nm |
| `cutoff_wavelength_nm` | 截止波长，nm |
| `optical_density` | 光密度 OD，非负数 |
| `aoi_deg` | 入射角，0–90 度 |
| `polarization` | 偏振条件 |

透过率等指标的标称或实测条件写入 `notes`，并附对应规格书。适用波长筛选需上下限都已填写。

## 库存

四列均填非负整数，无库存填 `0`。总量自动相加。

| 字段 | 含义 |
|---|---|
| `quantity_available` | 可用 |
| `quantity_in_use` | 在用 |
| `quantity_loaned` | 借出 |
| `quantity_unavailable` | 待检 / 损坏 |

## 英文内容（可选）

旧版 28 列 CSV 仍可用。新增以下列可显示英文内容，缺失时回退到原字段：

| 字段 | 对应字段 |
|---|---|
| `name_en` | `name` |
| `subtype_en` | `subtype` |
| `location_en` | `location` |
| `owner_en` | `owner` |
| `notes_en` | `notes` |

## 检查与发布

```sh
python scripts/inventory.py --check
python -m mkdocs build --strict
```

Windows 可使用 `.\.venv\Scripts\python.exe` 替代 `python`。本地重新构建或重启预览；连接 GitHub 后提交 CSV，由工作流发布。
