# REVIEW

A thorough review of the tool is available [here](https://deepwiki.com/Project-OSRM/osrm-backend/1-osrm-overview).

---

# MACOS

## NOTE: Make sure the requests python library is installed

```bash
pip install requests
```

## Install and Setup: Nominatim

A thorough installation guide exists [here](https://nominatim.org/release-docs/latest/admin/Installation/).

### Manual Setup

* **Step 1:** Open a terminal window.
* **Step 2:** Install dependencies:
```bash
brew install postgres@18 postgis osm2pgsql

```


* **Step 3 (Optional):** Configure the database by locating `postgresql.conf`:
```bash
sudo find / -name postgresql.conf

```


* **Step 4:** Download OpenStreetMap data (`.osm.pbf` file) from [Geofabrik](https://download.geofabrik.de/north-america/us).
* **Step 5:** Import the data following the [official import guide](https://nominatim.org/release-docs/latest/admin/Import/).
* **Test:** Verify the installation:
```bash
nominatim search --query "<your address>"

```



---

## Install and Setup: OSRM Pre-processing Pipeline

### Manual Setup

Run the following to install the backend:

```bash
brew install osrm-backend

```

This installs `osrm-extract`, `osrm-partition`, `osrm-customize`, and `osrm-routed`.

### Reference Documentation

Review these in order for a successful implementation:

1. [Data Preprocessing Pipeline](https://deepwiki.com/Project-OSRM/osrm-backend/2-data-preprocessing-pipeline)
2. [Extraction Process](https://deepwiki.com/Project-OSRM/osrm-backend/2.1-extraction-process)
3. [Partitioning and Customization (MLD Algorithm)](https://deepwiki.com/Project-OSRM/osrm-backend/2.3-partitioning-and-customization-(mld-algorithm))
4. [OSRM Routed Server](https://deepwiki.com/Project-OSRM/osrm-backend/8.1-osrm-routed-server)

### Pipeline Steps

* **Step 1: Extract**
Parses OpenStreetMap data using Lua profiles to create graph representations.
* *Profile path:* `/opt/homebrew/Cellar/osrm-backend/26.6.5/share/osrm-backend/profiles/car.lua`


```bash
osrm-extract -p /opt/homebrew/Cellar/osrm-backend/26.6.5/share/osrm-backend/profiles/car.lua *.osm.pbf

```


* **Step 2: Partition**
```bash
osrm-partition *.osm.pbf

```


* **Step 3: Customize**
```bash
osrm-customize *.osm.pbf

```


* **Step 4: Run Server**
If the default port 5000 is in use, use `lsof -i :5000` to find conflicts or change the port with `-p 5001`.
```bash
osrm-routed -a MLD *.osm.pbf

```


* **Step 5: Verify (Python Request)**
```python
import requests

url = "http://localhost:5001/route/v1/driving/-122.3321,47.6062;-122.2007,47.6101?overview=false"
r = requests.get(url)
data = r.json()

meters = data["routes"][0]["distance"]
miles = meters / 1609.344
print(f"Distance: {miles} miles")

```