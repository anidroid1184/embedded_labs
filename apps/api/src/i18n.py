from typing import Any

from app.schemas import Locale


def pick_locale(value: Any, locale: Locale) -> str:
    if isinstance(value, dict):
        if locale in value and value[locale]:
            return str(value[locale])
        if "en" in value and value["en"]:
            return str(value["en"])
        if "es" in value and value["es"]:
            return str(value["es"])
        return ""
    return str(value or "")


def normalize_locale(raw: str | None) -> Locale:
    if raw and raw.lower().startswith("es"):
        return "es"
    return "en"
