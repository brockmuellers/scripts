from datetime import datetime
import divisions
import json
import loads


def default(results, trailhead, date, weekend_only):
	raw(results, trailhead, date, weekend_only)

def raw(results, trailhead, date, weekend_only):
	to_print = _print_filter(results, [trailhead], [date], weekend_only, False, only_available=True)
	print(json.dumps(to_print, indent=4, sort_keys=True))
	
def summer(results, trailhead, date, weekend_only):
	trailheads = [
		# south to the palisades, north has more lakes+space, south is less crowded?
		"Big Pine Creek North Fork",
		"Big Pine Creek South Fork",
		# these are all towards minarets/ritter
		"Shadow Creek",
		"River Trail",
		"High Trail",
		"Rush Creek",
		# leads to royce lakes
		"Pine Creek",
		# goes up from rock creek past ruby lake to pioneer basin
		"Mono Pass",
		# late season only! river crossing
		"Convict Creek"
	]

	dates = [date]
	
	to_print = _print_filter(results, trailheads, dates, weekend_only, True, only_available=2)
	print(json.dumps(to_print, indent=4, sort_keys=True))
	

def anniversary(results, trailhead, date, weekend_only):
	trailheads = [
		# stuff that is okay early season
		# also see robinson, buckeye, maybe virginia in humboldt-toiyabe
		# south to the palisades, should be okay-ish, north has more lakes+space, south is less crowded?
		"Big Pine Creek North Fork",
		"Big Pine Creek South Fork",
		# north a bit
		"Little Lakes Valley",
		# not so snowy?
		"Kearsarge Pass",
		"Shepherd Pass",
		"Meysan Lake",
		"Cottonwood Lakes"
	]
	backup_trailheads = [
		"Bishop Pass -South Lake",
		"Sabrina Lake",
		# near bishop pass
		#"Baker and Green Lakes",
		"Treasure Lakes",
		#"Tyee Lakes",
		# slight north, near sabrina lake
		#"George Lake ",
		#"Lamarck Lakes",
		#"Piute Pass",
		# first part fine, second part is snowy - royce lakes
		"Pine Creek",
		# seems very nice, lots of elevation gain, goes up from rock creek past ruby lake
		"Mono Pass"
	]
	all_dates = [
		"2023-06-01",
		"2023-06-02",
		"2023-06-03",
		"2023-06-09",
		"2023-06-09",
		"2023-06-10",
		"2023-06-15",
		"2023-06-16",
		"2023-06-17",
		"2023-06-22",
		"2023-06-23",
		"2023-06-24"
	]
	best_dates = [
		"2023-06-16",
		"2023-06-17"
	]

	summer_only = True
	if date != None:
		all_dates = [date]
		best_dates = [date]

	# ideal trailheads, only with the ideal dates
	print("BEST")
	to_print = _print_filter(results, trailheads, best_dates, weekend_only, summer_only, only_available=2)
	print(json.dumps(to_print, indent=4, sort_keys=True))
	# the ideal trailhead, with all dates
	print("---------------------")
	print("MORE DATES")
	to_print = _print_filter(results, trailheads, all_dates, weekend_only, summer_only, only_available=2)
	print(json.dumps(to_print, indent=4, sort_keys=True))
	# backup trailheads, with ideal dates
	print("---------------------")
	print("MORE TRAILS")
	to_print = _print_filter(results, backup_trailheads, best_dates, weekend_only, summer_only, only_available=2)
	print(json.dumps(to_print, indent=4, sort_keys=True))
	
def _print_filter(results, trailheads, dates, weekend_only, summer_only, only_available=0):
	divs = divisions.load_divisions(False)
	divs_by_name = divs.id_by_name()
	divs_by_id = divs.name_by_id()

	to_print = {}

	for date_key, date_vals in results.items():
		should_print_date = dates == [None] or date_key in dates
		if should_print_date and weekend_only:
			should_print_date = date_is_weekend(date_key)
		if should_print_date and summer_only:
			should_print_date = date_is_summer(date_key)

		for trail_id, trail_vals in date_vals.items():
			should_print_trail = trailheads == [None] or divs_by_id[trail_id] in trailheads

			if should_print_date and should_print_trail:
				trail_name = divs_by_id[trail_id]
				label = trail_name + " " + date_key + " " + time_key_to_weekday(date_key)
				if trail_vals["remaining"] < only_available or trail_vals["remaining"] > 100000:
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

def date_is_summer(key: str) -> bool:
	return time_key_to_datetime(key).month in [6,7,8,9]
	
	
	
	
