import loads

def default(results, trailhead, date):
	divs = loads.load_divisions(False)
	
	print("this is the default")

def raw(results, trailhead, date):
	divs = loads.load_divisions(False)
	divs_by_name = divs.id_by_name()

	for date_key, date_vals in results.items():
		should_print_date = date is None or date_key == date

		for trail_key, trail_vals in date_vals.items():
			should_print_trail = trailhead is None or divs_by_name[trail_key] == trailhead

			if should_print_date and should_print_trail:
				trailhead_id = divs_by_name[trailhead]
				dumped =  json.dumps(vals[trailhead_id], indent=4, sort_keys=True)
				print(trailhead + " " + date + ': ' + dumped)
