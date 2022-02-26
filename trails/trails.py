import click
from datetime import datetime
import glob
import loads
import printer
import os

@click.command()
@click.option('--reload', default=False, help='Reload cached results (auto-reloads each hour).')
@click.option('--use_recent', default=False, help='Use the most recently loaded result (no reload).')
@click.option('--year', default=2022, help='Year to get results for.')
@click.option('--print_mode', default="default", help='Print mode for results.')
@click.option('--trailhead', default=None, help='Specific trailhead to load results for.')@click.option('--trailhead', default=None, help='Specific trailhead to load results for.')
@click.option('--date', default=None, help='Specific date to load results for.')
def run(reload: bool, use_recent: bool, year: int, print_mode: str): 

    if not use_recent:
        # directory for results: ./results/{year of results}/{date and hour results were pulled}
        # results are stored as: {directory for results}/{month as int}.json
        now_str = datetime.now().strftime("%Y-%m-%d-%H")
        basepath_for_now = f'results/{year}/{now_str}'
        existing_basepaths = glob.glob(f'results/{year}/*')

        # if basepath doesn't exist (e.g. has not reloaded within the hour), reload
        if basepath_for_now not in existing_basepaths:
            print("no results loaded within the last hour")
            os.makedirs(basepath_for_now)
            reload = True
        elif len(glob.glob(basepath_for_now)) != 12:
            print("not all results were loaded")
            reload = True

        if reload:
            print("reloading results")
            loads.reload_results(year, basepath_for_now)
        
    results = loads.load_recent(basepath_for_now)

    printer_func = getattr(printer, print_mode)
    printer_func(results, trailhead, date)


if __name__ == '__main__':
    run()