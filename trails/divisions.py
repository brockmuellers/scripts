import json
import requests

"""
Load divisions from the API.
"""
def load_divisions(reload: bool):
    if reload:
        url = " https://www.recreation.gov/api/permitcontent/233262"
        headers = {
            "TE": "trailers",
            "User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0"
        }
        r = requests.get(url, headers=headers)
        if r.status_code != 200:
            raise Exception("failed to fetch divisions")

        with open('results/inyo_divisions.json', 'wb') as f:
            f.write(r.content)

    # load the payload from file
    # now init a Divisions class and return
    payload = {}
    with open('results/inyo_divisions.json', 'rb') as f:
        payload = json.load(f)['payload']
    division_arr = []
    for key, val in payload['divisions'].items():
        division_arr.append(Division(key, val['name']))

    return Divisions(division_arr)


"""
Pretty print all divisions to file, for human-readable reference.
"""
def store_pretty(divisions):
    by_name = divisions.id_by_name()
    with open('pretty_trail_names.json', 'w') as f:
        f.write(json.dumps(by_name, indent=4, sort_keys=True))
    by_id = divisions.name_by_id()
    with open('pretty_trail_ids.json', 'w') as f:
        f.write(json.dumps(by_name, indent=4, sort_keys=True))


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