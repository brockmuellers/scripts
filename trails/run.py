import click
from datetime import datetime
import divisions
import glob
import loads
import printer
import os

YEAR = 2023
PARKS = ["inyo", "humboldt_toiyabe", "yosemite", "sierra", "seki"]

@click.command()
@click.option('--force_reload', default=False, help='Force reload cached results (auto-reloads each hour).')
@click.option('--print_mode', default="default", help='Print mode for results.')
@click.option('--trailhead', default=None, help='Specific trailhead to load results for.')
@click.option('--date', default=None, help='Specific date to load results for.')
@click.option('--weekends', default=False, help='Only load results for weekend trips (Fri/Sat).')
@click.option('--summer', default=False, help='Only load results for summer trips (june-sep).')
@click.option('--park', default=None, help='Load results for this park (inyo, ht==humboldt_toiyabe, yosemite, sierra, seki).')
def run(force_reload: bool, print_mode: str, trailhead: str, date: str, weekends: bool, summer: bool, park: str): 

    # clean up params
    if park == "ht":
      park = "humboldt_toiyabe" # overwrite the easy-to-type ht
    parks = PARKS
    if park != None:
        parks = [park]
    dates = [date]
    trailheads = [trailhead]
    	
    if force_reload:
    	# this operates on all parks
        divisions.reload_divisions()

    for park in parks:
        
        # directory for results: ./results/{year of results}/{park name}/{date and hour results were pulled}
        # results are stored as: {directory for results}/{month as int}.json
        now_str = datetime.now().strftime("%Y-%m-%d-%H")
        basepath_for_now = f'results/{YEAR}/{park}/{now_str}'

        # if basepath doesn't exist (e.g. has not reloaded within the hour), reload
        reload_park = force_reload
        if basepath_for_now not in glob.glob(f'results/{YEAR}/{park}/*'):
            print("no results loaded within the last hour")
            os.makedirs(basepath_for_now)
            reload_park = True

        if reload_park:
            print("reloading results for park", park)
            loads.reload_results(YEAR, park_url(park), basepath_for_now)

        results = loads.load_recent_results(basepath_for_now)

        print("\nRESULTS FOR PARK", park)
        printer_func = getattr(printer, print_mode)
        summer_months = [7, 8, 9] # exclude june because this is a snowy year
        params = printer.FilterParams(results, park, trailheads, dates, weekends, summer_months)
        printer_func(params)
        print("\n")


def park_url(park: str) -> str:
    if park == "inyo":
      return "https://www.recreation.gov/api/permitinyo/233262/availability"
    elif park == "humboldt_toiyabe":
      return "https://www.recreation.gov/api/permitinyo/445856/availability"
    elif park == "yosemite":
      return "https://www.recreation.gov/api/permitinyo/445859/availability"
    elif park == "sierra":
      return "https://www.recreation.gov/api/permitinyo/445858/availability"
    elif park == "seki":
      return "https://www.recreation.gov/api/permitinyo/445857/availability"
    else:
      raise Exception("unsupported park name")

if __name__ == '__main__':
    run()
