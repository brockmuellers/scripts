from datetime import datetime
import divisions
import json
import loads

# weekdays
MON = 0
TUE = 1
WED = 2
THU = 3
FRI = 4
SAT = 5
SUN = 6


class FilterParams:
	def __init__(self, results, park, trailheads, dates, months: list[int], weekdays: list[int], min_open: int):
		self.results = results
		self.park = park
		self.trailheads = trailheads
		self.dates = dates
		self.months = months
		self.weekdays = weekdays
		self.min_open = min_open

def default(params: FilterParams):
	if params.months == None:
		params.months = [5, 6, 7, 8, 9, 10] # exclude non-quota seasons
	raw(params)

def raw(params: FilterParams):
	print_results(params)
	
	
def minarets(params: FilterParams):
	# trip with ross/wesley
	params.months = [7, 8]
	params.min_open = 3
	
	if params.park == "inyo":
		params.trailheads = [
			"Shadow Creek",
			"River Trail",
			"High Trail",
			"Rush Creek", # safest choice for late season
			"Minaret Lake"
		]
	elif params.park == "sierra":
		params.months = None
		params.dates = [
			"2023-07-12",
			"2023-07-13",
			"2023-07-14"
		]
		params.trailheads = [
			"Mono Creek"
		]
	else:
		return
	
	print_results(params)
	
def late_season(params: FilterParams):
	params.min_open = 2
	
	params.dates = [
		"2023-09-15",
		"2023-09-16",
		"2023-09-22",
		"2023-09-23",
		"2023-09-29",
		"2023-09-30",
		"2023-10-06",
		"2023-10-07",
		"2023-10-13",
		"2023-10-14",
		"2023-10-20",
		"2023-10-21",
	]
	
	if params.park == "inyo":
		params.trailheads = [
			# south of palisades, north has more lakes+space, south is less crowded?
			# at 7.7k', better in Oct, 10+ mi?
			"Big Pine Creek North Fork", # (short/long oct, most excited about this one)
			"Big Pine Creek South Fork", # (short/long oct)
			
			# leads to royce lakes, 7.4k' so better in Oct, 17 mi
			"Pine Creek", # (long oct)
			
			# rock creek area, 9.6k' so better in sep
			# goes up from rock creek past ruby lake to pioneer basin
			"Mono Pass", # 18 mi (long sep)
			"Little Lakes Valley", # easy and pretty, 10 mi (short sep)
			
			"Convict Creek" # late season only! river crossing, <10mi, 7.8k' (short oct)
		]
		print_results(params, "aspens inyo")
		
		params.trailheads = [
			# no aspens, but still seems nice in late season
			# (long sep or early oct), ~30 mi
			
			"Shadow Creek",
			"River Trail",
			"High Trail",
			"Rush Creek", # safest choice for late season
			"Minaret Lake"
		]
		print_results(params, "minarets inyo")
		
	elif params.park == "humboldt_toiyabe":
		params.trailheads = [
			"Robinson Creek",
			"Buckeye Creek",
			"Virginia Lakes"
		]
		return # skip me until I've done more research, but these should be easy + nice aspens
	elif params.park == "yosemite":
		# find some good short late season hikes from tuolumne too?; is shorter drive than inyo
		params.trailheads = [
			# for grand canyon -> waterwheel; white wolf direction preferred, ~30 mi
			# or could do short trip in from glen aulin
			# 10/6 weekend?
			"White Wolf->Pate Valley",
			"Glen Aulin->Cold Canyon/Waterwheel (pass through)"
		]

		print_results(params, "late yosemite")
		
	elif params.park == "seki":
		# permit season does end eventually, so maybe don't need to search for this?
		return
	else:
		return

def summer(params: FilterParams):
	params.min_open = 2
	params.weekdays = val_or_default(params.weekdays, [THU, FRI, SAT])
	
	if params.park == "inyo":
		params.trailheads = [
			# south to the palisades, north has more lakes+space, south is less crowded?
			"Big Pine Creek North Fork",
			"Big Pine Creek South Fork",
			# these are all towards minarets/ritter
			"Shadow Creek",
			"River Trail",
			"High Trail",
			"Rush Creek", # safest choice for late season
			"Minaret Lake",
			# leads to royce lakes
			"Pine Creek",
			# goes up from rock creek past ruby lake to pioneer basin
			"Mono Pass",
			# short and easy and pretty
			"Little Lakes Valley", 
			# some cool pinnacles, pretty far south
			"Kearsage Pass",
		]
		# excluding june because snow
		params.months = [7, 8]
		
	elif params.park == "yosemite":
		params.trailheads = [
			# for grand canyon -> waterwheel; white wolf direction preferred, ~30 mi
			# could be cool perseids weekend, otherwise 10/6 weekend
			"White Wolf->Pate Valley",
			"Glen Aulin->Cold Canyon/Waterwheel (pass through)"
			# all of these avoid dangerous creeks
			"Lyell (No Donohue Pass)",
			"Lyell Canyon (Donohue Pass Eligible)",
			"Rafferty Creek->Vogelsang",
			"Ten Lakes"
		]
		params.months = [7, 8]
		
	elif params.park == "humboldt_toiyabe":
		params.trailheads = [
			"Robinson Creek",
			"Buckeye Creek",
			"Virginia Lakes"
		]
		return # skip me until I've done more research
		
	elif params.park == "seki":
		params.trailheads = [
			# mineral king area
			"Franklin",
			"Sawtooth Pass",
			"Timber Gap",
			# mineral king area, short trail then xc
			"Mosquito Lakes", 
			"Eagle Lake", 
			"White Chief",
			# to lost lake, trail starts in jennie lakes wilderness?
			"Sugarloaf",
			# to mist falls
			"Bubbs Creek",
			# emerald/pear lakes area
			"Lakes Trail",
			"Lakes Trail Pass Through"
		]
		return # skip me until I've done more research
		
	else:
		return

	print_results(params)
	
def fourthofjuly(params: FilterParams):
	params.dates = [
		"2023-07-01",
		"2023-07-02",
		"2023-07-03"
	]
	params.min_open = 3
	
	if params.park == "inyo":
		params.trailheads = [
			# these two are the best
			"Big Pine Creek North Fork",
			"Little Lakes Valley", 
			# also nice
			"Convict Creek",
			"McGee Pass",
			# maybe this would work?
			#"Pine Creek", 
			# some cool pinnacles, but pretty far south
			#"Kearsage Pass",
		]
	else:
		return
	
	print_results(params)

def anniversary(params: FilterParams):
	params.min_open = 2
	
	all_dates = [
		"2023-06-09",
		"2023-06-10",
		"2023-06-15",
		"2023-06-16",
		"2023-06-17",
		"2023-06-22",
		"2023-06-23",
		"2023-06-24",
		"2023-06-30",
		"2023-07-01"
	]
	best_dates = [
		"2023-06-16",
		"2023-06-17"
	]
	
	trailheads = []
	backup_trailheads = []
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
		# actually I doubt any of these will work
		return
	elif params.park == "yosemite":
		trailheads = [
			# for grand canyon -> waterwheel; tioga road may not be open
			"Lyell (No Donohue Pass)",
			"Lyell Canyon (Donohue Pass Eligible)",
			"Rafferty Creek->Vogelsang",
			"Ten Lakes"
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
		# skip for now, the mono creek permit is good enough
		return 
	elif params.park == "sierra":
		trailheads = [
			"Mono Creek"
		]
		# already got the mono creek permit, so skip this
		return
	else:
		return

	# ideal trailheads, only with the ideal dates
	if len(trailheads) > 0:
		params.trailheads = trailheads
		params.dates = best_dates
		print_results(params, "BEST " + params.park)
	
	# the ideal trailhead, with all dates
	#if len(trailheads) > 0:
	if False:
		params.trailheads = trailheads
		params.dates = all_dates
		print_results(params, "MORE DATES " + params.park)
	
	# backup trailheads, with ideal dates
	# skip for now, we have a backup
	if False:
	#if len(backup_trailheads) > 0:
		params.trailheads = backup_trailheads
		params.dates = best_dates
		print_results(params, "MORE TRAILS " + params.park)
	
def print_results(params: FilterParams, label: str = ""):
	if label == "":
		label = params.park
	label = label + ": "
	print(label, json.dumps(_print_filter(params), indent=4, sort_keys=True))
	
def _print_filter(params: FilterParams):
	results = params.results
	dates = params.dates
	trailheads = params.trailheads
	weekdays = params.weekdays
	only_available = params.min_open

	divs = divisions.load_divisions()
	divs_by_name = divs.id_by_name()
	divs_by_id = divs.name_by_id()

	to_print = {}

	# iterate through all results and print if it matches date/trail filters
	for date_key, date_vals in results.items():
		should_print_date = dates == [None] or date_key in dates
		if should_print_date and weekdays:
			should_print_date = _date_in_weekdays(date_key, weekdays)
		if should_print_date and params.months != None:
			should_print_date = _date_in_months(date_key, params.months)

		for trail_id, trail_vals in date_vals.items():
			should_print_trail = trailheads == [None] or divs_by_id[trail_id] in trailheads

			if should_print_date and should_print_trail:
				trail_name = divs_by_id[trail_id]
				label = trail_name + " " + date_key + " " + _time_key_to_weekday(date_key)
				if trail_vals["remaining"] < only_available:
					continue
				if trail_vals["remaining"] > 100000:
					continue # this is outside of permit season, I think
				to_print[label] = trail_vals["remaining"]

	if len(to_print) == 0:
		return "No Results"
	
	return to_print

def _time_key_to_datetime(key: str) -> datetime:
	return datetime.strptime(key, '%Y-%m-%d')

def _time_key_to_weekday(key: str) -> str:
	return _time_key_to_datetime(key).strftime('%a')

def _date_in_weekdays(key: str, days: list[int]) -> bool:
	return _time_key_to_datetime(key).weekday() in days
	
def _date_in_months(key: str, months: list[int]) -> bool:
	return _time_key_to_datetime(key).month in months

def val_or_default(val, default):
	return val if val else default
	
	
