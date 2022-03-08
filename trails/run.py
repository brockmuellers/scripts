import click
from datetime import datetime
import glob
import loads
import printer
import os

@click.command()
@click.option('--force_reload', default=False, help='Force reload cached results (auto-reloads each hour).')
@click.option('--no_reload', default=False, help='Use the most recently loaded result (no reload).')
@click.option('--year', default=2022, help='Year to get results for.')
@click.option('--print_mode', default="default", help='Print mode for results.')
@click.option('--trailhead', default=None, help='Specific trailhead to load results for.')
@click.option('--date', default=None, help='Specific date to load results for.')
@click.option('--weekends', default=False, help='Only load results for weekend trips (Fri/Sat).')
def run(force_reload: bool, no_reload: bool, year: int, print_mode: str, trailhead: str, date: str, weekends: bool): 

    if not no_reload:
        # directory for results: ./results/{year of results}/{date and hour results were pulled}
        # results are stored as: {directory for results}/{month as int}.json
        now_str = datetime.now().strftime("%Y-%m-%d-%H")
        basepath_for_now = f'results/{year}/{now_str}'
        existing_basepaths = glob.glob(f'results/{year}/*')

        # if basepath doesn't exist (e.g. has not reloaded within the hour), reload
        if basepath_for_now not in existing_basepaths:
            print("no results loaded within the last hour")
            os.makedirs(basepath_for_now)
            force_reload = True
        elif len(glob.glob(f'{basepath_for_now}/*')) != 12:
            print("not all results were loaded")
            force_reload = True

        if force_reload:
            print("reloading results")
            loads.reload_results(year, basepath_for_now)
        
    results = loads.load_recent_results(basepath_for_now)

    printer_func = getattr(printer, print_mode)
    printer_func(results, trailhead, date, weekends)


if __name__ == '__main__':
    run()
