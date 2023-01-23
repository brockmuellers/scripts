import csv
import requests
from bs4 import BeautifulSoup
from uszipcode import SearchEngine

# Get CSV of all foodbanks listed on Feeding America https://www.feedingamerica.org/all-food-banks

PATH = "/home/sara/repos/scripts/foodbanks/feeding_america.html"
OUT = "/home/sara/repos/scripts/foodbanks/results.csv"

def get():
	page = open(PATH)

	soup = BeautifulSoup(page.read(), "html.parser")

	results = soup.find_all("div", "results-box")
	# First one is irrelevant
	results = results[1:]
	
	rows = []

	for idx, result in enumerate(results):
		if len(result) not in [6, 7]:
			print("did not expect results length", idx)
			
		name = result.find_all("p", "name")[0].text.strip()
		
		# Parsing address and phone
		addr_raw = result.contents[1].contents
		if len(addr_raw) not in [5, 7]:
			print("did not expect address length", idx)
		addr1 = addr_raw[0]
		addr2 = ""
		if len(addr_raw) == 7:
			addr2 = addr_raw[2]
			# trim out extra address line so indices match up whether it is present or not
			addr_raw = addr_raw[0:2] + addr_raw[4:]

		city_state_zip = addr_raw[2]
		phone = addr_raw[4].text
		
		url = result.contents[2].text
		
		links = result.contents[3].contents
		if len(links) != 5:
			print("did not expect links length", len(links), idx)
		#find_food = links[0]["href"]
		#volunteer = links[2]
		give_link = links[3]["href"]
		
		counties = ""
		if len(result.contents) == 7:
			if len(result.contents[6]) < 2:
				print("did not expect counties length", len(links), idx)
			
			counties = result.contents[6].contents[1].title()
			
		rows.append([name, addr1, addr2, city_state_zip, phone, url, give_link, counties])
		
	write_csv(rows)
	

def write_csv(rows):

	field_names = [
		"State", 
		"County", 
		"Name", 
		"Contact Info",
		"Billing Street 1", 
		"City", 
		"State", 
		"Zipcode", 
		"Types Accepted",
		"Restrictions",
		"Transportation",
		"Steps",

		"URL", 
		"Donation link", 
		"Counties served"
	]

	with open(OUT, "w") as csvfile:
		writer = csv.writer(csvfile)
		writer.writerow(field_names)
		
		for row in rows:
			name, addr1, addr2, city_state_zip, phone, url, give_link, counties = row

			address = ", ".join(filter(None, [addr1, addr2]))

			city = city_state_zip.split(', ')[0]
			state = city_state_zip.split(', ')[1].split(' ')[0]
			zip_code = city_state_zip.split(', ')[1].split(' ')[1]
			
			contact = phone
			
			writer.writerow([
				STATES[state],
				get_county(zip_code),
				name, 
				contact,
				address, 
				city, 
				state, 
				zip_code, 
				"",
				"",
				"",
				"",
				url, 
				give_link, 
				counties
			])


def get_county(zip_code):
	sr = SearchEngine()
	z = sr.by_zipcode(zip_code)
	return z.county


STATES = {
        'AK': 'Alaska',
        'AL': 'Alabama',
        'AR': 'Arkansas',
        'AS': 'American Samoa',
        'AZ': 'Arizona',
        'CA': 'California',
        'CO': 'Colorado',
        'CT': 'Connecticut',
        'DC': 'District of Columbia',
        'DE': 'Delaware',
        'FL': 'Florida',
        'GA': 'Georgia',
        'GU': 'Guam',
        'HI': 'Hawaii',
        'IA': 'Iowa',
        'ID': 'Idaho',
        'IL': 'Illinois',
        'IN': 'Indiana',
        'KS': 'Kansas',
        'KY': 'Kentucky',
        'LA': 'Louisiana',
        'MA': 'Massachusetts',
        'MD': 'Maryland',
        'ME': 'Maine',
        'MI': 'Michigan',
        'MN': 'Minnesota',
        'MO': 'Missouri',
        'MP': 'Northern Mariana Islands',
        'MS': 'Mississippi',
        'MT': 'Montana',
        'NA': 'National',
        'NC': 'North Carolina',
        'ND': 'North Dakota',
        'NE': 'Nebraska',
        'NH': 'New Hampshire',
        'NJ': 'New Jersey',
        'NM': 'New Mexico',
        'NV': 'Nevada',
        'NY': 'New York',
        'OH': 'Ohio',
        'OK': 'Oklahoma',
        'OR': 'Oregon',
        'PA': 'Pennsylvania',
        'PR': 'Puerto Rico',
        'RI': 'Rhode Island',
        'SC': 'South Carolina',
        'SD': 'South Dakota',
        'TN': 'Tennessee',
        'TX': 'Texas',
        'UT': 'Utah',
        'VA': 'Virginia',
        'VI': 'Virgin Islands',
        'VT': 'Vermont',
        'WA': 'Washington',
        'WI': 'Wisconsin',
        'WV': 'West Virginia',
        'WY': 'Wyoming'
}

get()

