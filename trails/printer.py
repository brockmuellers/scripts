from datetime import datetime
import divisions
import json
import loads


def default(results, trailhead, date, weekend_only):
	raw(results, trailhead, date, weekend_only)

def raw(results, trailhead, date, weekend_only):
	to_print = _print_filter(results, [trailhead], [date], weekend_only, only_available=True)
	print(json.dumps(to_print, indent=4, sort_keys=True))

def anniversary(results, trailhead, date, weekend_only):
	trailhead = "Bishop Pass -South Lake"
	backup_trailheads = [
		# near bishop pass
		"Baker and Green Lakes",
		"Bishop Pass -South Lake",
		"Treasure Lakes",
		"Tyee Lakes",
		# slight north, near sabrina lake
		"George Lake ",
		"Sabrina Lake",
		"Lamarck Lakes",
		"Piute Pass",
		# south
		"Big Pine Creek North Fork",
		"Big Pine Creek South Fork"
	]
	all_dates = [
		"2022-06-02",
		"2022-06-03",
		"2022-06-04",
		# "2022-06-09",
		# "2022-06-10",
		# "2022-06-11",
		"2022-06-16",
		"2022-06-17",
		"2022-06-18",
		"2022-06-23",
		"2022-06-24",
		"2022-06-25"
	]
	best_dates = [
		"2022-06-03",
		"2022-06-04",
		# "2022-06-10",
		# "2022-06-11",
		"2022-06-17",
		"2022-06-18",
		"2022-06-24",
		"2022-06-25"
	]

	if date != None:
		all_dates = [date]
		best_dates = [date]

	# some backup trailheads, only with the ideal dates
	to_print1 = _print_filter(results, backup_trailheads, best_dates, weekend_only, only_available=True)
	print(json.dumps(to_print1, indent=4, sort_keys=True))
	print("---------------------")
	# the ideal trailhead, with all dates
	to_print = _print_filter(results, [trailhead], all_dates, weekend_only)
	print(json.dumps(to_print, indent=4, sort_keys=True))

def _print_filter(results, trailheads, dates, weekend_only, only_available=False):
	divs = divisions.load_divisions(False)
	divs_by_name = divs.id_by_name()
	divs_by_id = divs.name_by_id()

	to_print = {}

	for date_key, date_vals in results.items():
		should_print_date = dates == [None] or date_key in dates
		if should_print_date and weekend_only:
			should_print_date = date_is_weekend(date_key)

		for trail_id, trail_vals in date_vals.items():
			should_print_trail = trailheads == [None] or divs_by_id[trail_id] in trailheads

			if should_print_date and should_print_trail:
				trail_name = divs_by_id[trail_id]
				label = trail_name + " " + date_key + " " + time_key_to_weekday(date_key)
				if only_available and trail_vals["remaining"] == 0:
					continue
				to_print[label] = trail_vals["remaining"]

	if len(to_print) == 0:
		return "No Results"
	
	return to_print

def time_key_to_datetime(key: str) -> datetime:
	return datetime.strptime(key, '%Y-%m-%d')

def time_key_to_weekday(key: str) -> str:
	return time_key_to_datetime(key).strftime('%a')

def date_is_weekend(key: str) -> bool:
	return time_key_to_datetime(key).weekday() in [4, 5]
