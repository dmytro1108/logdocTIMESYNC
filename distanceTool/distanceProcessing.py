# osrm-routed -p 5001 -a MLD washington-260627.osm.pbf
import subprocess
import json
import requests
from pathlib import Path
import argparse
''' 
	method that takes the output from my nominatim query and 
	produces the longitude and latitude coordinates as output
'''
def coordinateRes(k):
    k = k.stdout
    k = json.loads(k)

    lat = k[0]["lat"]
    lon = k[0]["lon"]
    return lat, lon

if __name__ == "__main__": # python3 distanceProcessing.py "<source A>" "<destination B>" "<Nominatim root exec path>" "<directory path of *osrm file>" "<selected *osrm file>"
	parser = argparse.ArgumentParser()
	
	parser.add_argument("loc1")
	parser.add_argument("loc2")

	args = parser.parse_args()
	
	
	osrm_path = "your base path here" / "your osrm name here"
		
	server = subprocess.Popen(["osrm-routed", "-p", "5001", "-a", "MLD", str(osrm_path)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, start_new_session=True)
    
	result1 = subprocess.run(["your nominatim path here", "search", "--query", args.loc1], text = True, capture_output = True)
	result2 = subprocess.run(["your nominatim path here", "search", "--query", args.loc2], text = True, capture_output = True)

	lat1, lon1 = coordinateRes(result1)
	lat2, lon2 = coordinateRes(result2)

	# configured to only count vehicle routes
	url = f"http://localhost:5001/route/v1/driving/{lon1},{lat1};{lon2},{lat2}?overview=false"

	r = requests.get(url)
	data = r.json()

	meters = data["routes"][0]["distance"]
	miles = meters / 1609.344

	print(miles)