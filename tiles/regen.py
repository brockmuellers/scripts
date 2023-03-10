import click

"""
to regenerate, go to www.strava.com/heatmap
***you must login!***
ctrl-shift-c to get to debug tools
network tab
right click on one of the "heatmap-external-*" requests, and copy request headers
or, find the cookie itself and copy its contents
paste results in single quotes

Header format:

GET /tiles-auth/all/hot/6/13/25.png?v=19 HTTP/1.1
Host: heatmap-external-c.strava.com
User-Agent: Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:91.0) Gecko/20100101 Firefox/91.0
Accept: image/webp,*/*
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate, br
Referer: https://www.strava.com/
Origin: https://www.strava.com
Connection: keep-alive
Cookie: sp=fe938537-7148-4ae6-b44f-19fcb479268d; _strava_cbv2=true; _ga=GA1.2.928113586.1644357878; _strava4_session=hpqqeqbt27ast4b3f2fvqilbniimi4om; _gid=GA1.2.1638927579.1646164111; CloudFront-Policy=eyJTdGF0ZW1lbnQiOiBbeyJSZXNvdXJjZSI6Imh0dHBzOi8vaGVhdG1hcC1leHRlcm5hbC0qLnN0cmF2YS5jb20vKiIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTY0NzAyODIyMX0sIkRhdGVHcmVhdGVyVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNjQ1ODA0MjIxfX19XX0_; CloudFront-Key-Pair-Id=APKAIDPUN4QMG7VUQPSA; CloudFront-Signature=SeJFQL1CWGSGHFri~DWJqn25rt6W3to94i01ano4ilb014W3gFEsknfwiL3T28BTlQskyYP3t8qb83du5Vpbg32O0o0628cVOMPCD6ZEDhyoq5VJ3iozXTDOIVFg8sM6Ah3uWRRz4zuE2gLdpzIHMtWPfShqYAerbtdSBYDjGCO-dYGQn0M4Kf6szFF-gadR~dYybZ4A7pxy8z4M8q8ijdgJWJXEFF3sS4awTKpP9SqpRc328YhICT5uoVOZIQsP--ECcSvAb5UjEF8S-NhM~ylT5tjnD4kjoLT7mKthSpu24SRoXl~aRuP4PZO5oWiVO289UBC0sYnLjZjlbSbv3g__
Sec-Fetch-Dest: empty
Sec-Fetch-Mode: cors
Sec-Fetch-Site: same-site
"""

# cookie suffixes
cookie_suffix = "Cookie: "
key_suffix = "CloudFront-Key-Pair-Id="
policy_suffix = "CloudFront-Policy="
signature_suffix = "CloudFront-Signature="

base_url = "https://heatmap-external-a.strava.com/tiles-auth/all/hot/{Z}/{X}/{Y}.png"

@click.command()
@click.option('--headers', help='Headers from which to extract keys (works to copy in firefox).')
@click.option('--cookie', help='Cookie from which to extract keys (instead of parsing from headers list).')
def run(headers: str, cookie: str):
	print("------------------------------\nstarting search\n------------------------------")

	if cookie == None and headers == None:
		print("Please provide a cookie or request header.\n" + \
			"You can find these at www.strava.com/heatmap when logged in to a strava account.\n" + \
			"Copy values from one of the \"heatmap-external-*\" requests.")
		return
	
	if cookie == None:
		# first parse headers from string
		# split on /n, then select cookie line
		lines = headers.split("\n")
		for line in lines:
			if line.startswith(cookie_suffix):
				cookie = line.strip(cookie_suffix)

	cookie_vals = cookie.split("; ")
	key_pair_id = ""
	policy = ""
	signature = ""
	for val in cookie_vals:
		#print(val)
		if val.startswith(key_suffix):
			key_pair_id = val[len(key_suffix):]
		elif val.startswith(policy_suffix):
			policy = val[len(policy_suffix):]
		elif val.startswith(signature_suffix):
			signature = val[len(signature_suffix):]

	if key_pair_id == "" or policy == "" or signature == "":
		raise Exception("did not find cookie vals", key_pair_id, policy, signature)

	print("Create a custom map source in caltopo and save it to your account. You must regenerate this in ~14 days.")
	print("--Type: Tile\n--Max Zoom: 15\n--Overlay: Transparent\n--URL Template:")
	print(f"    {base_url}?Key-Pair-Id={key_pair_id}&Policy={policy}&Signature={signature}")
	

if __name__ == '__main__':
	run()
