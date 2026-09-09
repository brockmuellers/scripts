"""Generate an invoice PDF using Jinja2 + WeasyPrint (HTML/CSS to PDF).

Usage:
    python3 generate_weasyprint.py <invoice.toml> [output.pdf]

If output.pdf is omitted, it defaults to `<invoice-basename>.pdf`.
"""
import re
import sys
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape
from spellchecker import SpellChecker
from weasyprint import HTML

import invoice_config as cfg

_HERE = Path(__file__).parent
_WORD_RE = re.compile(r"[A-Za-z][A-Za-z']*")


def _load_allowlist() -> set[str]:
    path = _HERE / "spell_allowlist.txt"
    if not path.exists():
        return set()
    words = set()
    for line in path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#"):
            words.add(line.lower())
    return words


def warn_spelling(items) -> None:
    spell = SpellChecker()
    allow = _load_allowlist()
    any_flagged = False
    for item in items:
        tokens = [w for w in _WORD_RE.findall(item.description) if w.lower() not in allow]
        bad = spell.unknown(tokens)
        if not bad:
            continue
        if not any_flagged:
            print("spellcheck warnings (add to spell_allowlist.txt to silence):")
            any_flagged = True
        highlighted = _WORD_RE.sub(
            lambda m: f">>{m.group(0)}<<" if m.group(0).lower() in bad else m.group(0),
            item.description,
        )
        print(f"  {item.date_str}: {highlighted}")
        for w in sorted(bad):
            suggestion = spell.correction(w) or ""
            arrow = f" -> {suggestion}" if suggestion and suggestion.lower() != w.lower() else ""
            print(f"      {w}{arrow}")


def warn_punctuation(items) -> None:
    warnings = []
    for item in items:
        for idx, ch in enumerate(item.description):
            if ch == "\n" and (idx == 0 or item.description[idx - 1] != ";"):
                prev = item.description[max(0, idx - 20):idx].replace("\n", " ")
                warnings.append(f"  {item.date_str}: newline not preceded by ';' -> ...{prev!r}")
        if ":" in item.description:
            warnings.append(f"  {item.date_str}: contains ':' — did you mean '-'? -> {item.description!r}")
    if warnings:
        print("punctuation warnings:")
        for w in warnings:
            print(w)


def build(invoice_path: str, out_path: str) -> None:
    inv = cfg.load_invoice(invoice_path)
    for item in inv.items:
        item.description = item.description.replace("—", "-").replace("–", "-")
    warn_spelling(inv.items)
    warn_punctuation(inv.items)

    env = Environment(
        loader=FileSystemLoader(Path(__file__).parent),
        autoescape=select_autoescape(["html"]),
    )
    env.filters["money"] = lambda x: f"{x:,.2f}"
    template = env.get_template("invoice_template.html")

    html = template.render(
        invoice_number=inv.invoice_number,
        issue_date=cfg.long_date(inv.issue_date),
        period_start=cfg.long_date(inv.billing_period_start),
        period_end=cfg.long_date(inv.billing_period_end),
        from_=cfg.FROM,
        bill_to=inv.bill_to,
        project=inv.project,
        items=inv.items,
        rate=inv.hourly_rate,
        subtotal=inv.subtotal,
        tax=inv.tax,
        total_due=inv.total_due,
        total_hours=inv.total_hours,
        currency=inv.currency,
        gst_note=inv.gst_note,
        payment=cfg.PAYMENT,
    )

    HTML(string=html, base_url=str(Path(__file__).parent)).write_pdf(out_path)
    print(f"wrote {out_path}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit("usage: generate_weasyprint.py <invoice.toml> [output.pdf]")
    invoice_path = sys.argv[1]
    out_path = sys.argv[2] if len(sys.argv) > 2 else str(Path(invoice_path).with_suffix(".pdf"))
    build(invoice_path, out_path)
