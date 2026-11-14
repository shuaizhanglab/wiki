# 在另一台 Windows 电脑本地部署

1. 解压整个压缩包到一个可写文件夹。保留目录结构，不要直接在压缩包内运行脚本。
2. 从 [Python 官网](https://www.python.org/downloads/) 安装 **Python 3.10 或更新版本，推荐 3.12**。安装时勾选将 Python 添加到 PATH；如不设置 PATH，可使用下方方法指定路径。
3. 双击 `install.cmd`。它会在项目内创建 `.venv` 并安装所需依赖。首次安装需要联网，不需要安装 Node.js。
4. 安装成功后，双击 `start.cmd`，在浏览器打开 **http://127.0.0.1:8000/**。保留启动窗口；运行和查询均在本机完成。
5. 停止时，在启动窗口按 **Ctrl+C**，按提示结束。

以后使用时直接运行 `start.cmd`。如果更新了依赖清单，再运行一次 `install.cmd` 即可。

## Python 未加入 PATH 时

在项目文件夹中打开 PowerShell，将下面的示例路径替换为已安装的 `python.exe` 的完整路径，再运行：

```powershell
$env:WIKI_PYTHON = 'C:\Python312\python.exe'
.\install.cmd
```

该设置仅作用于当前窗口，不会修改系统 PATH。安装完成后可直接双击 `start.cmd`。

## 更新元件台账

编辑 `docs/assets/data/inventory.csv`，保留表头并保存为 **UTF-8 CSV**。服务运行时会自动重新构建；刷新网页即可查看。CSV 校验失败时，启动窗口会显示行号和原因，修正保存后重试。

包内有 **21 条演示记录**，请替换为实际盘点数据，并将真实记录的 `is_demo` 填为 `false`。数量分别维护可用、在用、借出和待检/损坏，网页自动计算总量。字段说明见网站的“字段说明”。
