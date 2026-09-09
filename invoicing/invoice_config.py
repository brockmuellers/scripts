"""Invoice config loading.

Per-invoice values (invoice number, dates, client key, hourly rate, hours
CSV path) live in a TOML file passed to `load_invoice(path)`. Personal info
(FROM, PAYMENT) is loaded from the gitignored personal_info.toml, and client
details from clients.toml.
"""
import csv
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path
from typing import Any

try:
    import tomllib  # Python 3.11+
except ModuleNotFoundError:
    import tomli as tomllib  # fallback for 3.10 and earlier

_here = Path(__file__).parent
_personal = tomllib.loads((_here / "personal_info.toml").read_text())
_clients = tomllib.loads((_here / "clients.toml").read_text())["clients"]

FROM = _personal["from"]
PAYMENT = _personal["payment"]


@dataclass
class LineItem:
    date: date
    hours: float
    description: str
    rate: float

    @property
    def amount(self) -> float:
        return self.hours * self.rate

    @property
    def date_str(self) -> str:
        return self.date.strftime("%B %d, %Y")


@dataclass
class Invoice:
    invoice_number: str
    issue_date: date
    billing_period_start: date
    billing_period_end: date
    client_key: str
    bill_to: dict[str, Any]
    project: str
    hourly_rate: float
    currency: str
    gst_rate: float
    gst_note: str
    hours_csv: Path
    items: list[LineItem]

    @property
    def total_hours(self) -> float:
        return sum(i.hours for i in self.items)

    @property
    def subtotal(self) -> float:
        return sum(i.amount for i in self.items)

    @property
    def tax(self) -> float:
        return self.subtotal * self.gst_rate

    @property
    def total_due(self) -> float:
        return self.subtotal + self.tax


def load_items(csv_path: Path, rate: float) -> list[LineItem]:
    items = []
    with open(csv_path, newline="") as f:
        for row in csv.DictReader(f):
            items.append(LineItem(
                date=datetime.strptime(row["date"], "%Y-%m-%d").date(),
                hours=float(row["hours"]),
                description=row["description"],
                rate=rate,
            ))
    return items


def load_invoice(path: str | Path) -> Invoice:
    path = Path(path)
    data = tomllib.loads(path.read_text())

    client_key = data["client"]
    client = _clients[client_key]

    hours_csv = Path(data["hours_csv"])
    if not hours_csv.is_absolute():
        hours_csv = (path.parent / hours_csv).resolve()

    rate = float(data["hourly_rate"])
    return Invoice(
        invoice_number=str(data["invoice_number"]),
        issue_date=data["issue_date"],
        billing_period_start=data["billing_period"]["start"],
        billing_period_end=data["billing_period"]["end"],
        client_key=client_key,
        bill_to={"name": client["name"], "contacts": client["contacts"]},
        project=data["project"],
        hourly_rate=rate,
        currency=data.get("currency", "USD"),
        gst_rate=float(data["gst"]["rate"]),
        gst_note=data["gst"]["note"],
        hours_csv=hours_csv,
        items=load_items(hours_csv, rate),
    )


def long_date(d: date) -> str:
    return d.strftime("%B %d, %Y")
