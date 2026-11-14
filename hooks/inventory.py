"""MkDocs hook: regenerate inventory JSON from the sole CSV source on every build."""

from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path


def on_pre_build(config):
    root = Path(config.config_file_path).resolve().parent
    specification = spec_from_file_location("optics_inventory_builder", root / "scripts" / "inventory.py")
    module = module_from_spec(specification)
    specification.loader.exec_module(module)
    source = Path(config["docs_dir"]) / "assets" / "data" / "inventory.csv"
    try:
        module.write_inventory(source, source.with_suffix(".json"))
    except module.InventoryError as error:
        from mkdocs.exceptions import PluginError
        raise PluginError(f"光学元件库存校验失败：{error}") from error
