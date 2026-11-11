"""Offline tests for bigyear.py. Run: pytest test_bigyear.py

Keep this file sparse. Only test high-impact flows that can break silently,
like scraping eBird's undocumented bar-chart page. Each test should be short
and obvious, with no network, no .env, no mocks and no clever fixtures. If a
test would be brittle or complex, leave it out, even if the code it covers
seems important. Live checks against eBird belong in test_live.py.
"""
from click.testing import CliRunner

from bigyear import _mean_window, _parse_barchart, cli


def _row(code: str, cells: list[str]) -> str:
    """One species row, shaped like eBird's: 12 <td>s of 4 cells each."""
    tds = "".join(
        "<td>" + "".join(f'<div class="{c}"></div>' for c in cells[i:i + 4]) + "</td>"
        for i in range(0, len(cells), 4)
    )
    return (f'<tr class="rC"><td><a href="species/{code}" '
            f'data-species-code="{code}"> Name </a></td>{tds}</tr>')


def test_barchart_keeps_all_48_weeks_including_insufficient_data():
    cells = ["sp"] * 48
    cells[1], cells[40], cells[41] = "b3", "bu", "b9"
    parsed = _parse_barchart("<table>" + _row("snogoo", cells) + "</table>")

    bins = parsed["snogoo"]
    assert len(bins) == 48
    assert bins[:3] == [0, 3, 0]
    assert bins[40:42] == [None, 9]


def test_bucket_average_skips_weeks_without_data():
    bins = [0] * 48
    bins[10], bins[11], bins[12] = 4, None, 2
    assert _mean_window(bins, 11, 1) == 3.0
    assert _mean_window([None] * 48, 11, 1) is None


def test_cookie_adds_session_to_env_file(tmp_path):
    env = tmp_path / ".env"
    env.write_text("EBIRD_API_KEY=abc\n")
    result = CliRunner().invoke(cli, ["cookie", "testvalue123", "--env-file", str(env)])
    assert result.exit_code == 0, result.output
    assert "Added EBIRD_SESSION" in result.output
    assert env.read_text() == "EBIRD_API_KEY=abc\nEBIRD_SESSION=testvalue123\n"


def test_cookie_replaces_existing_session(tmp_path):
    env = tmp_path / ".env"
    env.write_text("# EBIRD_SESSION=old\nEBIRD_API_KEY=abc\n")
    result = CliRunner().invoke(cli, ["cookie", "new", "--env-file", str(env)])
    assert result.exit_code == 0, result.output
    assert "Updated EBIRD_SESSION" in result.output
    assert env.read_text() == "EBIRD_SESSION=new\nEBIRD_API_KEY=abc\n"
