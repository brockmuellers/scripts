import glob
import json
import requests
import os

# month as zero-padded int, with first and last days
months = [
        ['01', "{}-01-01", "{}-01-31"],
        ['02', "{}-02-01", "{}-02-28"], # update if leap year
        ['03', "{}-03-01", "{}-03-31"],
        ['04', "{}-04-01", "{}-04-30"],
        ['05', "{}-05-01", "{}-05-31"],
        ['06', "{}-06-01", "{}-06-30"],
        ['07', "{}-07-01", "{}-07-31"],
        ['08', "{}-08-01", "{}-08-31"],
        ['09', "{}-09-01", "{}-09-30"],
        ['10', "{}-10-01", "{}-10-31"],
        ['11', "{}-11-01", "{}-11-30"],
        ['12', "{}-12-01", "{}-12-31"],
    ]


def load_recent_results(basepath: str) -> map:
    results = {}
    for month, start, end in months:
        with open(f'{basepath}/inyo/{month}.json', 'rb') as f:
            r = json.load(f)
            results.update(r['payload'])
        with open(f'{basepath}/ht/{month}.json', 'rb') as f:
            r = json.load(f)
            # todo payload is a map of dates to {trail_num: ..., trail_num:...}, so this needs to 
            # append the trails for each date to the existing ones (if they exist)
    return results


def reload_results(year: int, basepath: str):
    # for inyo
    url = "https://www.recreation.gov/api/permitinyo/233262/availability"
    headers = {
        "TE": "trailers",
        "User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0"
    }

    for month, start, end in months:
        params = {
            "start_date": start.format(year),
            "end_date": end.format(year),
            "commercial_acct": "false"
        }

        r = requests.get(url, params=params, headers=headers)
        if r.status_code != 200:
            raise Exception("failed to fetch month", month, r.status_code, r.content)


        inyo_basepath = f'{basepath}/inyo'
        if inyo_basepath not in glob.glob(f'{basepath}/*'):
                os.makedirs(inyo_basepath)	
        with open(f'{inyo_basepath}/{month}.json', 'wb') as f:
            f.write(r.content)
            print(f"loaded month {month}")


    # for humboldt-toiyabe
    url = "https://www.recreation.gov/api/permitinyo/445856/availability"

    for month, start, end in months:
        params = {
            "start_date": start.format(year),
            "end_date": end.format(year),
            "commercial_acct": "false"
        }

        r = requests.get(url, params=params, headers=headers)
        if r.status_code != 200:
            raise Exception("failed to fetch month", month, r.status_code, r.content)


        ht_basepath = f'{basepath}/ht'
        if ht_basepath not in glob.glob(f'{basepath}/*'):
                os.makedirs(ht_basepath)	
        with open(f'{ht_basepath}/{month}.json', 'wb') as f:
            f.write(r.content)
            print(f"loaded month {month}")

