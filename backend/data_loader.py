import pandas as pd
import numpy as np
import os

INDIA_CITIES = [
    {"city": "Delhi",      "state": "Delhi",          "lat": 28.6139, "lng": 77.2090, "w": 0.16},
    {"city": "Mumbai",     "state": "Maharashtra",     "lat": 19.0760, "lng": 72.8777, "w": 0.14},
    {"city": "Bangalore",  "state": "Karnataka",       "lat": 12.9716, "lng": 77.5946, "w": 0.11},
    {"city": "Chennai",    "state": "Tamil Nadu",      "lat": 13.0827, "lng": 80.2707, "w": 0.09},
    {"city": "Kolkata",    "state": "West Bengal",     "lat": 22.5726, "lng": 88.3639, "w": 0.09},
    {"city": "Hyderabad",  "state": "Telangana",       "lat": 17.3850, "lng": 78.4867, "w": 0.08},
    {"city": "Pune",       "state": "Maharashtra",     "lat": 18.5204, "lng": 73.8567, "w": 0.07},
    {"city": "Ahmedabad",  "state": "Gujarat",         "lat": 23.0225, "lng": 72.5714, "w": 0.06},
    {"city": "Jaipur",     "state": "Rajasthan",       "lat": 26.9124, "lng": 75.7873, "w": 0.05},
    {"city": "Lucknow",    "state": "Uttar Pradesh",   "lat": 26.8467, "lng": 80.9462, "w": 0.05},
    {"city": "Surat",      "state": "Gujarat",         "lat": 21.1702, "lng": 72.8311, "w": 0.04},
    {"city": "Kanpur",     "state": "Uttar Pradesh",   "lat": 26.4499, "lng": 80.3319, "w": 0.03},
    {"city": "Nagpur",     "state": "Maharashtra",     "lat": 21.1458, "lng": 79.0882, "w": 0.03},
]

# Real Bangalore neighborhoods with accurate coordinates (Change 1)
BANGALORE_AREAS = [
    {"name": "Koramangala",       "lat": 12.9352, "lng": 77.6245, "w": 0.10},
    {"name": "Indiranagar",       "lat": 12.9784, "lng": 77.6408, "w": 0.09},
    {"name": "Whitefield",        "lat": 12.9698, "lng": 77.7500, "w": 0.09},
    {"name": "Jayanagar",         "lat": 12.9250, "lng": 77.5938, "w": 0.06},
    {"name": "Rajajinagar",       "lat": 12.9906, "lng": 77.5530, "w": 0.05},
    {"name": "Hebbal",            "lat": 13.0350, "lng": 77.5970, "w": 0.05},
    {"name": "Electronic City",   "lat": 12.8399, "lng": 77.6770, "w": 0.06},
    {"name": "HSR Layout",        "lat": 12.9116, "lng": 77.6389, "w": 0.08},
    {"name": "Yelahanka",         "lat": 13.1005, "lng": 77.5963, "w": 0.04},
    {"name": "Marathahalli",      "lat": 12.9591, "lng": 77.6971, "w": 0.06},
    {"name": "Banashankari",      "lat": 12.9252, "lng": 77.5460, "w": 0.04},
    {"name": "Malleswaram",       "lat": 13.0035, "lng": 77.5673, "w": 0.04},
    {"name": "Bannerghatta Road", "lat": 12.8907, "lng": 77.5967, "w": 0.04},
    {"name": "JP Nagar",          "lat": 12.9082, "lng": 77.5847, "w": 0.05},
    {"name": "MG Road",           "lat": 12.9756, "lng": 77.6079, "w": 0.05},
    {"name": "Sarjapur",          "lat": 12.8594, "lng": 77.7860, "w": 0.04},
    {"name": "Basavanagudi",      "lat": 12.9420, "lng": 77.5750, "w": 0.04},
    {"name": "RT Nagar",          "lat": 13.0218, "lng": 77.5940, "w": 0.04},
    {"name": "Hennur",            "lat": 13.0430, "lng": 77.6380, "w": 0.04},
    {"name": "Vijayanagar",       "lat": 12.9719, "lng": 77.5330, "w": 0.04},
]

CRIME_TYPES = [
    ("Theft",        0.22),
    ("Assault",      0.18),
    ("Robbery",      0.12),
    ("Burglary",     0.10),
    ("Fraud",        0.10),
    ("Cybercrime",   0.08),
    ("Murder",       0.05),
    ("Kidnapping",   0.05),
    ("Eve Teasing",  0.05),
    ("Drug Offense", 0.05),
]

# ── Crime Wave Events (synthetic historical surges) ─────────────────────────
# Each wave: date range, crime type spike, city focus, multiplier
CRIME_WAVES = [
    # Cybercrime surge: Jan–Mar 2020 (post-COVID lockdown, online fraud spike)
    {"start": "2020-01-01", "end": "2020-04-30", "crime": "Cybercrime",   "cities": ["Bangalore", "Hyderabad", "Delhi"], "mult": 3.2},
    # Theft spike: Oct–Dec 2021 (festive season)
    {"start": "2021-10-01", "end": "2021-12-31", "crime": "Theft",        "cities": ["Mumbai", "Delhi", "Pune"],          "mult": 2.5},
    # Drug Offense surge: mid 2022 (summer crackdown period)
    {"start": "2022-05-01", "end": "2022-08-31", "crime": "Drug Offense", "cities": ["Delhi", "Kolkata", "Lucknow"],       "mult": 2.8},
    # Robbery wave: Jan 2023 (winter spike)
    {"start": "2023-01-01", "end": "2023-03-15", "crime": "Robbery",      "cities": ["Chennai", "Jaipur", "Kanpur"],       "mult": 2.2},
    # Fraud wave: all of 2022 – UPI scam rise
    {"start": "2022-01-01", "end": "2022-12-31", "crime": "Fraud",        "cities": ["Ahmedabad", "Surat", "Mumbai"],      "mult": 2.0},
]


def _apply_crime_waves(df: pd.DataFrame, rng: np.random.Generator) -> pd.DataFrame:
    """Inject extra records during crime wave periods to create visible spikes."""
    wave_frames = []
    for wave in CRIME_WAVES:
        ws = pd.Timestamp(wave["start"])
        we = pd.Timestamp(wave["end"])
        span_days = (we - ws).days

        # Find target cities
        city_info = [c for c in INDIA_CITIES if c["city"] in wave["cities"]]
        if not city_info:
            continue

        # How many extra records to inject (proportional to multiplier)
        n_extra = int(500 * wave["mult"])

        # Pick city
        city_weights = np.array([c["w"] for c in city_info])
        city_weights /= city_weights.sum()
        chosen_city_idx = rng.choice(len(city_info), size=n_extra, p=city_weights)

        lats = np.array([c["lat"] for c in city_info])[chosen_city_idx] + rng.normal(0, 0.06, n_extra)
        lngs = np.array([c["lng"] for c in city_info])[chosen_city_idx] + rng.normal(0, 0.06, n_extra)
        cities  = [city_info[i]["city"]  for i in chosen_city_idx]
        states  = [city_info[i]["state"] for i in chosen_city_idx]

        # Times – cluster heavily in night hours for the wave
        hour_probs = np.ones(24)
        hour_probs[20:24] += 5
        hour_probs[0:3]   += 3
        hour_probs /= hour_probs.sum()
        hours = rng.choice(24, size=n_extra, p=hour_probs)

        day_probs = np.array([1.0, 1.0, 1.0, 1.1, 1.5, 2.0, 1.4])
        day_probs /= day_probs.sum()
        days_of_week = rng.choice(["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], size=n_extra, p=day_probs)

        rand_days = rng.integers(0, max(span_days, 1), n_extra)
        base_dates = pd.to_datetime([ws + pd.Timedelta(days=int(d)) for d in rand_days])
        full_dates = base_dates + pd.to_timedelta(hours, unit="h")

        arrested = rng.random(n_extra) < 0.25  # lower arrest rate during surges

        wave_frames.append(pd.DataFrame({
            "id":          np.arange(n_extra) + len(df),
            "date":        full_dates,
            "city":        cities,
            "state":       states,
            "area_name":   [""] * n_extra,
            "crime_type":  wave["crime"],
            "latitude":    lats,
            "longitude":   lngs,
            "hour":        hours,
            "day_of_week": days_of_week,
            "arrested":    arrested,
        }))

    if wave_frames:
        df = pd.concat([df] + wave_frames, ignore_index=True)
        df["id"] = np.arange(len(df))

    return df


def generate_bangalore_data(n: int = 8000, seed: int = 99) -> pd.DataFrame:
    """Generate Bangalore-specific synthetic data distributed across 20 real neighborhoods."""
    rng = np.random.default_rng(seed)

    area_names  = [a["name"] for a in BANGALORE_AREAS]
    lats        = np.array([a["lat"] for a in BANGALORE_AREAS])
    lngs        = np.array([a["lng"] for a in BANGALORE_AREAS])
    weights     = np.array([a["w"]   for a in BANGALORE_AREAS])
    weights    /= weights.sum()

    area_idx = rng.choice(len(BANGALORE_AREAS), size=n, p=weights)

    # Gaussian noise around each area center (std=0.015 as specified)
    noise_lat = rng.normal(0, 0.015, n)
    noise_lng = rng.normal(0, 0.015, n)
    record_lats = lats[area_idx] + noise_lat
    record_lngs = lngs[area_idx] + noise_lng

    crime_names  = [c[0] for c in CRIME_TYPES]
    crime_probs  = np.array([c[1] for c in CRIME_TYPES])
    crime_probs /= crime_probs.sum()

    # Per-area crime type bias — make crime distribution area-specific
    # Koramangala/Indiranagar: more Theft, Fraud, Cybercrime
    # Electronic City/Whitefield: more Cybercrime, Fraud
    # MG Road: more Robbery, Theft
    area_crime_bias = {}
    for i, area in enumerate(BANGALORE_AREAS):
        bias = crime_probs.copy()
        if area["name"] in ["Koramangala", "Indiranagar", "MG Road"]:
            bias[0] *= 1.8  # Theft
            bias[4] *= 1.5  # Fraud
        elif area["name"] in ["Whitefield", "Electronic City", "HSR Layout"]:
            bias[5] *= 2.5  # Cybercrime
            bias[4] *= 1.8  # Fraud
        elif area["name"] in ["Rajajinagar", "Banashankari", "JP Nagar"]:
            bias[1] *= 1.6  # Assault
            bias[2] *= 1.4  # Robbery
        elif area["name"] in ["Yelahanka", "Hebbal", "RT Nagar"]:
            bias[9] *= 2.0  # Drug Offense
            bias[7] *= 1.5  # Kidnapping
        bias /= bias.sum()
        area_crime_bias[i] = bias

    crime_idx = np.array([
        rng.choice(len(CRIME_TYPES), p=area_crime_bias[ai])
        for ai in area_idx
    ])

    # Peak at 22:00 and 13:00
    hour_probs = np.ones(24)
    hour_probs[21:24] += 3
    hour_probs[22]    += 4
    hour_probs[12:14] += 2
    hour_probs[0:4]   += 1.5
    hour_probs /= hour_probs.sum()
    hours = rng.choice(24, size=n, p=hour_probs)

    # Peak on Friday/Saturday
    day_probs = np.array([1.0, 1.0, 1.0, 1.1, 1.3, 1.6, 1.2])
    day_probs /= day_probs.sum()
    days_of_week = rng.choice(["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], size=n, p=day_probs)

    start = pd.Timestamp("2019-01-01")
    end   = pd.Timestamp("2023-12-31")
    random_days = rng.integers(0, (end - start).days, n)
    base_dates = pd.to_datetime([start + pd.Timedelta(days=int(d)) for d in random_days])
    full_dates = base_dates + pd.to_timedelta(hours, unit="h")

    arrested = rng.random(n) < 0.28

    df = pd.DataFrame({
        "id":          np.arange(n),
        "date":        full_dates,
        "city":        "Bangalore",
        "state":       "Karnataka",
        "area_name":   [area_names[i] for i in area_idx],
        "crime_type":  [crime_names[i] for i in crime_idx],
        "latitude":    record_lats,
        "longitude":   record_lngs,
        "hour":        hours,
        "day_of_week": days_of_week,
        "arrested":    arrested,
    })
    return df


def generate_india_data(n: int = 50_000, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)

    city_names  = [c["city"]  for c in INDIA_CITIES]
    state_names = [c["state"] for c in INDIA_CITIES]
    lats        = np.array([c["lat"] for c in INDIA_CITIES])
    lngs        = np.array([c["lng"] for c in INDIA_CITIES])
    weights     = np.array([c["w"]   for c in INDIA_CITIES])
    weights    /= weights.sum()

    city_idx = rng.choice(len(INDIA_CITIES), size=n, p=weights)

    noise_lat = rng.normal(0, 0.07, n)
    noise_lng = rng.normal(0, 0.07, n)
    record_lats = lats[city_idx] + noise_lat
    record_lngs = lngs[city_idx] + noise_lng

    crime_names  = [c[0] for c in CRIME_TYPES]
    crime_probs  = np.array([c[1] for c in CRIME_TYPES])
    crime_probs /= crime_probs.sum()
    crime_idx = rng.choice(len(CRIME_TYPES), size=n, p=crime_probs)

    # Peak at 22:00 and 13:00
    hour_probs = np.ones(24)
    hour_probs[21:24] += 3
    hour_probs[22]    += 4
    hour_probs[12:14] += 2
    hour_probs[0:4]   += 1.5
    hour_probs /= hour_probs.sum()
    hours = rng.choice(24, size=n, p=hour_probs)

    # Peak on Friday/Saturday
    day_probs = np.array([1.0, 1.0, 1.0, 1.1, 1.3, 1.6, 1.2])
    day_probs /= day_probs.sum()
    days_of_week = rng.choice(["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], size=n, p=day_probs)

    start = pd.Timestamp("2019-01-01")
    end   = pd.Timestamp("2023-12-31")
    random_days = rng.integers(0, (end - start).days, n)
    base_dates = pd.to_datetime([start + pd.Timedelta(days=int(d)) for d in random_days])
    full_dates = base_dates + pd.to_timedelta(hours, unit="h")

    arrested = rng.random(n) < 0.32

    # Determine area_name: only for Bangalore rows
    blr_idx_mask = [city_names[i] == "Bangalore" for i in city_idx]
    blr_area_rng = np.random.default_rng(seed + 1)
    blr_area_weights = np.array([a["w"] for a in BANGALORE_AREAS])
    blr_area_weights /= blr_area_weights.sum()
    area_names_list = [""] * n
    for j, is_blr in enumerate(blr_idx_mask):
        if is_blr:
            ai = blr_area_rng.choice(len(BANGALORE_AREAS), p=blr_area_weights)
            area_names_list[j] = BANGALORE_AREAS[ai]["name"]
            # Snap lat/lng to area center + noise
            record_lats[j] = BANGALORE_AREAS[ai]["lat"] + rng.normal(0, 0.015)
            record_lngs[j] = BANGALORE_AREAS[ai]["lng"] + rng.normal(0, 0.015)

    df = pd.DataFrame({
        "id":          np.arange(n),
        "date":        full_dates,
        "city":        [city_names[i]  for i in city_idx],
        "state":       [state_names[i] for i in city_idx],
        "area_name":   area_names_list,
        "crime_type":  [crime_names[i] for i in crime_idx],
        "latitude":    record_lats,
        "longitude":   record_lngs,
        "hour":        hours,
        "day_of_week": days_of_week,
        "arrested":    arrested,
    })

    # Inject crime waves for rich, story-telling data
    df = _apply_crime_waves(df, rng)
    print(f"Synthetic data generated: {len(df)} records (inc. {len(df)-n} crime-wave records)")
    return df


def load_india_data() -> pd.DataFrame:
    csv_path = os.path.join(os.path.dirname(__file__), "data", "india_crimes.csv")
    if os.path.exists(csv_path):
        try:
            df = pd.read_csv(csv_path, parse_dates=["date"])
            required = {"latitude", "longitude", "crime_type", "city", "date"}
            if required.issubset(df.columns):
                df = df.dropna(subset=["latitude", "longitude"])
                df = df[(df["latitude"].between(8.0, 37.0)) &
                        (df["longitude"].between(68.0, 97.5))]
                if "hour" not in df.columns:
                    df["hour"] = df["date"].dt.hour
                if "day_of_week" not in df.columns:
                    df["day_of_week"] = df["date"].dt.day_name().str[:3]
                if "arrested" not in df.columns:
                    df["arrested"] = False
                if "area_name" not in df.columns:
                    df["area_name"] = ""
                print(f"Loaded real CSV: {len(df)} rows")
                return df.head(50_000)
        except Exception as e:
            print(f"CSV load failed ({e}), falling back to synthetic data")

    print("Generating synthetic India crime data with crime waves...")
    base_df = generate_india_data(50_000)

    # Inject dedicated Bangalore neighborhood data
    blr_df = generate_bangalore_data(8000)
    combined = pd.concat([base_df, blr_df], ignore_index=True)
    combined["id"] = np.arange(len(combined))
    print(f"Total India records (incl. Bangalore detail): {len(combined)}")
    return combined

import urllib.request
import json

def load_uk_data() -> pd.DataFrame:
    # London coordinates
    url = "https://data.police.uk/api/crimes-street/all-crime?lat=51.5074&lng=-0.1278"
    try:
        req = urllib.request.urlopen(url)
        data = json.loads(req.read())
        
        records = []
        for item in data:
            if "location" in item and item["location"]:
                lat = float(item["location"]["latitude"])
                lng = float(item["location"]["longitude"])
                crime_type = item["category"].replace("-", " ").title()
                month = item["month"]
                date_obj = pd.to_datetime(month + "-01")
                
                records.append({
                    "id": item.get("id", np.random.randint(1000000)),
                    "date": date_obj,
                    "city": "London",
                    "state": "Greater London",
                    "area_name": "",
                    "crime_type": crime_type,
                    "latitude": lat,
                    "longitude": lng,
                    "hour": 12,
                    "day_of_week": date_obj.strftime("%a"),
                    "arrested": False
                })
        df = pd.DataFrame(records)
        print(f"Loaded {len(df)} UK records.")
        if len(df) < 10:
             raise ValueError("Insufficient data from API")
        return df
    except Exception as e:
        print(f"Failed to load UK data from API ({e}), falling back to synthetic data")
        return generate_uk_data(5000)

def generate_uk_data(n=5000) -> pd.DataFrame:
    rng = np.random.default_rng(43)
    # London-focused
    lats = 51.5074 + rng.normal(0, 0.05, n)
    lngs = -0.1278 + rng.normal(0, 0.05, n)
    crime_types = ["Theft", "Anti-Social Behaviour", "Violence And Sexual Offences", "Burglary", "Public Order"]
    
    df = pd.DataFrame({
        "id": np.arange(n),
        "date": pd.to_datetime("2023-01-01") + pd.to_timedelta(rng.integers(0, 365, n), unit="d"),
        "city": "London",
        "state": "Greater London",
        "area_name": "",
        "crime_type": rng.choice(crime_types, n),
        "latitude": lats,
        "longitude": lngs,
        "hour": rng.integers(0, 24, n),
        "day_of_week": rng.choice(["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], n),
        "arrested": rng.random(n) < 0.15
    })
    return df

def load_us_data() -> pd.DataFrame:
    # Chicago Socrata API
    url = "https://data.cityofchicago.org/resource/ijzp-q8t2.json?$limit=5000"
    try:
        req = urllib.request.urlopen(url)
        data = json.loads(req.read())
        
        records = []
        for item in data:
            if "latitude" in item and "longitude" in item:
                date_str = item.get("date", "")
                try:
                    date_obj = pd.to_datetime(date_str)
                    hour = date_obj.hour
                    dow = date_obj.strftime("%a")
                except:
                    date_obj = pd.to_datetime("2023-01-01")
                    hour = 12
                    dow = "Mon"
                
                records.append({
                    "id": item.get("id", np.random.randint(1000000)),
                    "date": date_obj,
                    "city": "Chicago",
                    "state": "Illinois",
                    "area_name": "",
                    "crime_type": item.get("primary_type", "Unknown").title(),
                    "latitude": float(item["latitude"]),
                    "longitude": float(item["longitude"]),
                    "hour": hour,
                    "day_of_week": dow,
                    "arrested": item.get("arrest", False)
                })
        df = pd.DataFrame(records)
        print(f"Loaded {len(df)} US records.")
        if len(df) < 10:
            raise ValueError("Insufficient data from API")
        return df
    except Exception as e:
        print(f"Failed to load US data from API ({e}), falling back to synthetic data")
        return generate_us_data(5000)

def generate_us_data(n=5000) -> pd.DataFrame:
    rng = np.random.default_rng(44)
    # Chicago-focused
    lats = 41.8781 + rng.normal(0, 0.06, n)
    lngs = -87.6298 + rng.normal(0, 0.06, n)
    crime_types = ["Theft", "Battery", "Criminal Damage", "Assault", "Narcotics"]
    
    df = pd.DataFrame({
        "id": np.arange(n),
        "date": pd.to_datetime("2023-01-01") + pd.to_timedelta(rng.integers(0, 365, n), unit="d"),
        "city": "Chicago",
        "state": "Illinois",
        "area_name": "",
        "crime_type": rng.choice(crime_types, n),
        "latitude": lats,
        "longitude": lngs,
        "hour": rng.integers(0, 24, n),
        "day_of_week": rng.choice(["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], n),
        "arrested": rng.random(n) < 0.22
    })
    return df
