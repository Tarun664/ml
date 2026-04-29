import urllib.request, json

# Test 1: Bangalore analysis
req = urllib.request.Request(
    "http://localhost:5000/api/analyze?region=india",
    data=json.dumps({"algorithm":"kmeans","n_clusters":10,"city":"Bangalore","crime_type":"All"}).encode(),
    headers={"Content-Type":"application/json"},
    method="POST"
)
d = json.loads(urllib.request.urlopen(req).read())
print(f"=== Bangalore Analysis ===")
print(f"Total records: {d['total_records']}")
print(f"Clusters: {len(d['clusters'])}")
for c in d['clusters']:
    print(f"  {c['area_name']:20s}  lat={c['lat']:.4f} lng={c['lng']:.4f}  count={c['crime_count']}")

print(f"\nby_hour sample (first 6): {d['trends']['by_hour'][:6]}")
print(f"by_day: {d['trends']['by_day']}")

# Test 2: Safety ranking
req2 = urllib.request.urlopen("http://localhost:5000/api/safety-ranking?region=india&city=Bangalore&crime_type=Theft")
s = json.loads(req2.read())
print(f"\n=== Safety Ranking (Theft) ===")
print(f"Crime type: {s['crime_type']}")
for a in s['areas'][:10]:
    print(f"  #{a['rank']:2d} {a['area_name']:20s}  count={a['count']}  score={a['score']}")

# Test 3: Safety ranking for different crime type
req3 = urllib.request.urlopen("http://localhost:5000/api/safety-ranking?region=india&city=Bangalore&crime_type=Cybercrime")
s2 = json.loads(req3.read())
print(f"\n=== Safety Ranking (Cybercrime) ===")
for a in s2['areas'][:10]:
    print(f"  #{a['rank']:2d} {a['area_name']:20s}  count={a['count']}  score={a['score']}")

print("\n=== ALL TESTS PASSED ===")
