import click
import requests

# this whole command is wip
key_pair_id = "APKAIDPUN4QMG7VUQPSA"
policy = "eyJTdGF0ZW1lbnQiOiBbeyJSZXNvdXJjZSI6Imh0dHBzOi8vaGVhdG1hcC1leHRlcm5hbC0qLnN0cmF2YS5jb20vKiIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTY0NjQxMjc3MX0sIkRhdGVHcmVhdGVyVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNjQ1MTg4NzcxfX19XX0_"
signature = "UaUJEkAI3ZjRbTh~ovwgoDWRWs6cGOZLw7pcHbouOycLr4sp-0SNwlxOlFFE03vcD1TO-1et~sUx9853LUJsw78RiSbMyY~IomKGxxMg9A-HHnY9GsRM87y6b8H-Mh91CDolZ7PKYFYU4ES-sGFdHKZHKdOha3NhzD8QkqRHI-2sYmEx-Vl~YK7sthy8LmqTQ1ZlxAejEaicLMSKbFg6BoAU3rrq3BcYB~xuLrFe7RkmxcL3z1FnV0mUvbEoOi5bHjeZRcoZ7H4MBXHz2i~KSfvkWZn6io9IovpSVD4jmzyjJq-GKMxYbF5PyPpUOv4paGgF3dMdLKQXBr6N0CZ3Yw__"
base_url = "https://heatmap-external-a.strava.com/tiles-auth/all/hot"

@click.command()
@click.option('--outdir', default="/home/sara/repos/out", help='Directory in which to save tiles.')
def run(outdir: str): 
	load(outdir)

def load(outdir: str):
	headers = {
		"User-Agent": "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0"
	}

	start_x = 2802
	end_x = 2806
	start_y = 6376
	end_y = 6380
	zoom = 14

	for x in range(start_x, end_x):
		for y in range(start_y, end_y):
			print(x)
			print(y)

			params = {
				"Key-Pair-Id": key_pair_id,
				"Policy": policy,
				"Signature": signature,
			}

			url = f"{base_url}/{zoom}/{x}/{y}.png"

			r = requests.get(url, params=params, headers=headers)
			if r.status_code != 200:
				print("failed to fetch tile", zoom, x, y, r.status_code, r.text, r.content)
			else:
				with open(f'{outdir}/{zoom}_{x}_{y}.png', 'wb') as f:
					f.write(r.content)
					print(f"loaded tile {zoom}_{x}_{y}")



if __name__ == '__main__':
	run()

