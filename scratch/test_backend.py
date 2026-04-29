import requests
import json

def test_region(region):
    url = f"http://localhost:5000/api/analyze?region={region}"
    payload = {
        "algorithm": "kmeans",
        "n_clusters": 10,
        "city": f"All {region.upper()}",
        "crime_type": "All"
    }
    headers = {'Content-Type': 'application/json'}
    try:
        response = requests.post(url, headers=headers, data=json.dumps(payload), timeout=30)
        print(f"Region: {region} | Status: {response.status_code}")
        if response.status_code != 200:
            print(f"  Error: {response.text}")
    except Exception as e:
        print(f"Region: {region} | Failed: {e}")

test_region("india")
test_region("uk")
test_region("us")
