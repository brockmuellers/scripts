import json
import requests

PARKS = ["inyo", "humboldt_toiyabe", "yosemite", "sierra", "seki"]

"""
Load divisions from the API.
"""
def load_divisions():
    # load the payload from file
    # now init a Divisions class and return
    division_arr = []
    for park in PARKS:
        division_arr += load_divisions_arr_for_park(park)

    result = Divisions(division_arr)
    return result

def load_divisions_arr_for_park(park):
    division_arr = []
    payload = {}
    with open(f'results/{park}_divisions.json', 'rb') as f:
        payload = json.load(f)['payload']
    for key, val in payload['divisions'].items():
        division_arr.append(Division(key, val['name']))
    return division_arr

def reload_divisions():
    for park in PARKS:
        url = division_url(park)
        headers = {
            "TE": "trailers",
            "User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0"
        }
        r = requests.get(url, headers=headers)
        if r.status_code != 200:
            raise Exception("failed to fetch divisions")

        with open(f'results/{park}_divisions.json', 'wb') as f:
            f.write(r.content)

        # store the divisions in a pretty file for reference
        store_pretty(Divisions(load_divisions_arr_for_park(park)), park)

"""
Pretty print all divisions to file, for human-readable reference.
"""
def store_pretty(divisions, park):
    by_name = divisions.id_by_name()
    with open(f'reference/pretty_trail_names_{park}.json', 'w') as f:
        f.write(json.dumps(by_name, indent=4, sort_keys=True))
    by_id = divisions.name_by_id()
    with open(f'reference/pretty_trail_ids_{park}.json', 'w') as f:
        f.write(json.dumps(by_id, indent=4, sort_keys=True))


def division_url(park: str) -> str:
	if park == "inyo":
		return "https://www.recreation.gov/api/permitcontent/233262"
	elif park == "humboldt_toiyabe":
		return "https://www.recreation.gov/api/permitcontent/445856"
	elif park == "yosemite":
		return "https://www.recreation.gov/api/permitcontent/445859"
	elif park == "sierra":
		return "https://www.recreation.gov/api/permitcontent/445858"
	elif park == "seki":
		return "https://www.recreation.gov/api/permitcontent/445857"
	else:
		raise Exception("unsupported park")


"""
Divisions represent trailhead names and ids.
"""
class Divisions:
    def __init__(self, divisions):
        self.divisions = divisions

    def name_by_id(self):
        mapped = {}
        for division in self.divisions:
            mapped[division.id] = division.name
        return mapped

    def id_by_name(self):
        mapped = {}
        for division in self.divisions:
            mapped[division.name] = division.id
        return mapped


class Division:
    def __init__(self, id, name):
        self.id = id
        self.name = name
