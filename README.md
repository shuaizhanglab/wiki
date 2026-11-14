# 光学元件 Wiki

MkDocs + CSV 管理的光学元件目录，支持中文 / English、参数筛选、库存查询和 CSV 导出，可本地运行或发布到 GitHub Pages。附带虚构示例数据。

网站：[ticeflow.github.io/lab-wiki](https://ticeflow.github.io/lab-wiki/)

## 启动

安装依赖后，Windows 可双击 `start.cmd`，打开 `http://127.0.0.1:8000/`。按 Ctrl+C 停止服务。

新环境需要 Python 3.10+：

```sh
python -m venv .venv
```

Windows PowerShell：

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m mkdocs serve
```

macOS / Linux：

```sh
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python -m mkdocs serve
```

## 更新库存

编辑 [`docs/assets/data/inventory.csv`](docs/assets/data/inventory.csv)，保存为 UTF-8 CSV。

- 每行对应同型号、同参数、同位置的元件，编号唯一。
- 可用、在用、借出和不可用数量分别填写，总量自动相加。
- 未知光学数值留空；真实库存将 `is_demo` 设为 `false`。
- 英文字段 `name_en`、`subtype_en`、`location_en`、`owner_en`、`notes_en` 可选；旧版 28 列 CSV 仍可用。
- 修改后重新构建或重启预览。JSON 为生成文件，不直接编辑。

字段规则见[维护指南](docs/data-guide.md)，查询操作见[使用](docs/guide.md) / [Guide](docs/en/guide.md)。网页显示构建时的库存快照。

## 检查与构建

需要 Node.js 24 运行查询逻辑测试。

```sh
python scripts/inventory.py --check
python -m unittest discover -s tests -p 'test_*.py'
node --test tests/*.test.mjs
python -m mkdocs build --strict
```

Windows 未激活虚拟环境时，将 `python` 替换为 `.\.venv\Scripts\python.exe`。构建输出位于 `site/`。

## GitHub Pages

1. 创建公开 GitHub 仓库，将项目推送到 `main` 或 `master` 分支。
2. 打开 **Settings → Pages → Build and deployment → Source**，选择 **GitHub Actions**。
3. 推送更新，或从 **Actions → Validate and publish optical inventory → Run workflow** 运行。
4. 工作流完成后，在部署记录中打开网站地址。

PR 只校验和构建。主分支通过检查后公开发布，网站及 CSV 均可通过公网访问。工作流使用自动提供的 `GITHUB_TOKEN`，无需另存访问令牌。首次启用 Pages 后，可手动运行工作流。

项目子路径由仓库名称自动设置。使用自定义域名时，配置 Pages 域名，并将仓库 Actions 变量 `PAGES_SITE_URL` 设为完整网址。

## 主要文件

| 路径 | 用途 |
|---|---|
| `docs/assets/data/inventory.csv` | 库存数据 |
| `scripts/inventory.py` | CSV 校验与 JSON 转换 |
| `hooks/inventory.py` | 构建时生成数据 |
| `overrides/` | Wiki 页面模板 |
| `docs/assets/javascripts/` | 查询与语言切换 |
| `docs/assets/stylesheets/` | 样式 |
| `docs/en/` | 英文帮助页 |
| `mkdocs.yml` | 网站配置 |
| `.github/workflows/pages.yml` | 校验与发布 |

布局参考 [MediaWiki](https://www.mediawiki.org/wiki/MediaWiki) 和 [Read the Docs](https://docs.readthedocs.com/platform/stable/)。
