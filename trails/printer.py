from datetime import datetime
import divisions
import json
import loads


class FilterParams:
	def __init__(self, results, park, trailheads, dates, weekend_only, summer):
		self.results = results
		self.park = park
		self.trailheads = trailheads
		self.dates = dates
		self.weekend_only = weekend_only
		self.summer = summer

def default(params: FilterParams):
	raw(params)

def raw(params: FilterParams):
	to_print = _print_filter(params, only_available=True)
	print(json.dumps(to_print, indent=4, sort_keys=True))
	
def summer(params: FilterParams):
	params.summer = True
	
	if params.park == "inyo":
		params.trailheads = [
			# south to the palisades, north has more lakes+space, south is less crowded?
			"Big Pine Creek North Fork",
			"Big Pine Creek South Fork",
			# these are all towards minarets/ritter
			"Shadow Creek",
			"River Trail",
			"High Trail",
			"Rush Creek",
			"Minaret Lake",
			# leads to royce lakes
			"Pine Creek",
			# goes up from rock creek past ruby lake to pioneer basin
			"Mono Pass",
			# late season only! river crossing
			"Convict Creek"
		]
	elif params.park == "yosemite":
		params.trailheads = [
			# for grand canyon -> waterwheel
			"White Wolf->Pate Valley",
			"Glen Aulin->Cold Canyon/Waterwheel (pass through)"
		]
	elif params.park == "humboldt_toiyabe":
		params.trailheads = [
			"Robinson Creek",
			"Buckeye Creek",
			"Virginia Lakes"
		]
	elif params.park == "seki":
		params.trailheads = [
			"Sawtooth Pass"
		]
	else:
		return

	to_print = _print_filter(params, only_available=2)
	print(json.dumps(to_print, indent=4, sort_keys=True))
	

def anniversary(params: FilterParams):
	trailheads = []
	if params.park == "inyo":
		trailheads = [
			# stuff that is okay early season
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
	elif params.park == "yosemite":
		trailheads = []
		backup_trailheads = [
			# for grand canyon -> waterwheel
			"White Wolf->Pate Valley",
			"Glen Aulin->Cold Canyon/Waterwheel (pass through)"
		]
	elif params.park == "humboldt_toiyabe":
		# also see robinson, buckeye, maybe virginia in humboldt-toiyabe
		trailheads = [
			"Robinson Creek",
			"Buckeye Creek",
		]
		backup_trailheads = [
			"Virginia Lakes"
		]
	elif params.park == "sierra":
		trailheads = [
			"Mono Creek"
		]
		backup_trailheads = [
		]
	else:
		return

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

	params.summer = False # overwrite because June 2023 will apparently not be summer

	# ideal trailheads, only with the ideal dates
	print("BEST")
	params.trailheads = trailheads
	params.dates = best_dates
	to_print = _print_filter(params, only_available=2)
	print(json.dumps(to_print, indent=4, sort_keys=True))
	# the ideal trailhead, with all dates
	print("---------------------")

	print("MORE DATES")
	params.trailheads = trailheads
	params.dates = all_dates
	to_print = _print_filter(params, only_available=2)
	print(json.dumps(to_print, indent=4, sort_keys=True))
	# backup trailheads, with ideal dates
	print("---------------------")

	print("MORE TRAILS")
	params.trailheads = backup_trailheads
	params.dates = best_dates
	to_print = _print_filter(params, only_available=2)
	print(json.dumps(to_print, indent=4, sort_keys=True))
	
def _print_filter(params: FilterParams, only_available=0):
	results = params.results
	dates = params.dates
	trailheads = params.trailheads
	weekend_only = params.weekend_only
	summer_only = params.summer

	divs = divisions.load_divisions()
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
				if trail_vals["remaining"] < only_available:
					continue
				if trail_vals["remaining"] > 100000:
					continue # this is outside of permit season, I think
				to_print[label] = trail_vals["remaining"]

	if len(to_print) == 0:
		return "No Results"
	
	return to_print

def time_key_to_datetime(key: str) -> datetime:
	return datetime.strptime(key, '%Y-%m-%d')

def time_key_to_weekday(key: str) -> str:
	return time_key_to_datetime(key).strftime('%a')

# for entry dates F, S
def date_is_weekend(key: str) -> bool:
	return time_key_to_datetime(key).weekday() in [4, 5]

# summer excludes june for now because this is a very snowy year
def date_is_summer(key: str) -> bool:
	return time_key_to_datetime(key).month in [7,8,9]
	
	
	
	
