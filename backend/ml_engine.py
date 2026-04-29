import numpy as np
import pandas as pd
from sklearn.cluster import KMeans, DBSCAN
from sklearn.preprocessing import StandardScaler

# Real Bangalore areas for cluster snapping (Change 1)
BANGALORE_AREAS = [
    {"name": "Koramangala",       "lat": 12.9352, "lng": 77.6245},
    {"name": "Indiranagar",       "lat": 12.9784, "lng": 77.6408},
    {"name": "Whitefield",        "lat": 12.9698, "lng": 77.7500},
    {"name": "Jayanagar",         "lat": 12.9250, "lng": 77.5938},
    {"name": "Rajajinagar",       "lat": 12.9906, "lng": 77.5530},
    {"name": "Hebbal",            "lat": 13.0350, "lng": 77.5970},
    {"name": "Electronic City",   "lat": 12.8399, "lng": 77.6770},
    {"name": "HSR Layout",        "lat": 12.9116, "lng": 77.6389},
    {"name": "Yelahanka",         "lat": 13.1005, "lng": 77.5963},
    {"name": "Marathahalli",      "lat": 12.9591, "lng": 77.6971},
    {"name": "Banashankari",      "lat": 12.9252, "lng": 77.5460},
    {"name": "Malleswaram",       "lat": 13.0035, "lng": 77.5673},
    {"name": "Bannerghatta Road", "lat": 12.8907, "lng": 77.5967},
    {"name": "JP Nagar",          "lat": 12.9082, "lng": 77.5847},
    {"name": "MG Road",           "lat": 12.9756, "lng": 77.6079},
    {"name": "Sarjapur",          "lat": 12.8594, "lng": 77.7860},
    {"name": "Basavanagudi",      "lat": 12.9420, "lng": 77.5750},
    {"name": "RT Nagar",          "lat": 13.0218, "lng": 77.5940},
    {"name": "Hennur",            "lat": 13.0430, "lng": 77.6380},
    {"name": "Vijayanagar",       "lat": 12.9719, "lng": 77.5330},
]

_BLR_LATS = np.array([a["lat"] for a in BANGALORE_AREAS])
_BLR_LNGS = np.array([a["lng"] for a in BANGALORE_AREAS])


def _snap_to_bangalore_area(lat: float, lng: float) -> dict:
    """Return nearest BANGALORE_AREAS entry to (lat, lng)."""
    dists = (_BLR_LATS - lat) ** 2 + (_BLR_LNGS - lng) ** 2
    idx = int(np.argmin(dists))
    return BANGALORE_AREAS[idx]


def _is_bangalore(df: pd.DataFrame) -> bool:
    if "city" not in df.columns:
        return False
    cities = df["city"].dropna().unique()
    return len(cities) == 1 and cities[0].lower() in ("bangalore", "bengaluru")


def _cluster_stats(df: pd.DataFrame, cluster_id: int) -> dict:
    sub = df[df["_cluster"] == cluster_id]
    if sub.empty:
        return {}
    vc = sub["crime_type"].value_counts().head(3).reset_index()
    vc.columns = ["type", "count"]
    top_crimes = vc.to_dict("records")

    clat = float(sub["latitude"].mean())
    clng = float(sub["longitude"].mean())

    # Snap to Bangalore area if applicable
    area_name = ""
    if "area_name" in sub.columns:
        area_counts = sub["area_name"].value_counts()
        if not area_counts.empty and area_counts.index[0]:
            area_name = area_counts.index[0]

    return {
        "id":           int(cluster_id),
        "lat":          clat,
        "lng":          clng,
        "area_name":    area_name,
        "crime_count":  int(len(sub)),
        "top_crime":    sub["crime_type"].mode()[0] if not sub.empty else "Unknown",
        "top_crimes":   top_crimes,
        "arrest_rate":  round(float(sub["arrested"].mean()), 3),
        "peak_hour":    int(sub["hour"].mode()[0]),
        "peak_day":     sub["day_of_week"].mode()[0] if "day_of_week" in sub.columns else "N/A",
        "cities":       sub["city"].value_counts().head(3).index.tolist(),
    }


def run_kmeans(df: pd.DataFrame, n_clusters: int = 10):
    is_blr = _is_bangalore(df)

    coords = df[["latitude", "longitude"]].values
    scaler = StandardScaler()
    coords_scaled = scaler.fit_transform(coords)

    km = KMeans(n_clusters=n_clusters, random_state=42, n_init="auto", max_iter=300)
    labels = km.fit_predict(coords_scaled)
    df = df.copy()
    df["_cluster"] = labels

    clusters = [_cluster_stats(df, i) for i in range(n_clusters)]
    clusters = [c for c in clusters if c]

    # Change 1: Snap Bangalore cluster centers to real neighborhood coords
    if is_blr:
        used_areas = set()
        for c in clusters:
            snapped = _snap_to_bangalore_area(c["lat"], c["lng"])
            # Avoid duplicate area names by nudging slightly if already used
            name = snapped["name"]
            if name in used_areas:
                # Find next closest unused area
                dists = (_BLR_LATS - c["lat"]) ** 2 + (_BLR_LNGS - c["lng"]) ** 2
                sorted_idxs = np.argsort(dists)
                for idx in sorted_idxs:
                    candidate = BANGALORE_AREAS[idx]["name"]
                    if candidate not in used_areas:
                        snapped = BANGALORE_AREAS[idx]
                        name = candidate
                        break
            used_areas.add(name)
            c["lat"] = snapped["lat"]
            c["lng"] = snapped["lng"]
            c["area_name"] = name

    clusters.sort(key=lambda x: x["crime_count"], reverse=True)

    # Heatmap: sample up to 10k points as [lat, lng, weight]
    sample = df.sample(min(10_000, len(df)), random_state=0)
    heatmap = [[row["latitude"], row["longitude"], 0.5]
               for _, row in sample.iterrows()]

    return clusters, heatmap


def run_dbscan(df: pd.DataFrame, eps: float = 0.008, min_samples: int = 8):
    is_blr = _is_bangalore(df)

    coords = df[["latitude", "longitude"]].values
    scaler = StandardScaler()
    coords_scaled = scaler.fit_transform(coords)

    db = DBSCAN(eps=eps, min_samples=min_samples, n_jobs=-1)
    labels = db.fit_predict(coords_scaled)
    df = df.copy()
    df["_cluster"] = labels

    unique = [l for l in set(labels) if l != -1]
    clusters = [_cluster_stats(df, i) for i in unique]
    clusters = [c for c in clusters if c and c.get("crime_count", 0) > 5]

    # Change 1: Snap Bangalore cluster centers
    if is_blr:
        used_areas = set()
        for c in clusters:
            snapped = _snap_to_bangalore_area(c["lat"], c["lng"])
            name = snapped["name"]
            if name in used_areas:
                dists = (_BLR_LATS - c["lat"]) ** 2 + (_BLR_LNGS - c["lng"]) ** 2
                sorted_idxs = np.argsort(dists)
                for idx in sorted_idxs:
                    candidate = BANGALORE_AREAS[idx]["name"]
                    if candidate not in used_areas:
                        snapped = BANGALORE_AREAS[idx]
                        name = candidate
                        break
            used_areas.add(name)
            c["lat"] = snapped["lat"]
            c["lng"] = snapped["lng"]
            c["area_name"] = name

    clusters.sort(key=lambda x: x["crime_count"], reverse=True)
    clusters = clusters[:20]  # cap for performance

    sample = df[df["_cluster"] != -1].sample(min(10_000, len(df)), random_state=0)
    heatmap = [[row["latitude"], row["longitude"], 0.6]
               for _, row in sample.iterrows()]

    return clusters, heatmap


def get_trends(df: pd.DataFrame) -> dict:
    """
    Change 3: Compute trends on the already-filtered DataFrame.
    by_hour and by_day are specific to whatever city+crime_type subset is passed in.
    """
    # Crime type breakdown
    ct = df["crime_type"].value_counts().head(10).reset_index()
    ct.columns = ["type", "count"]
    crime_counts = ct.to_dict("records")

    # Crime by hour — filtered subset specific
    hour_counts = (
        df.groupby("hour").size()
        .reset_index(name="count")
        .sort_values("hour")
        .to_dict("records")
    )
    # Ensure all 24 hours present
    hour_map = {r["hour"]: r["count"] for r in hour_counts}
    hour_counts = [{"hour": h, "count": int(hour_map.get(h, 0))} for h in range(24)]

    # Crime by day of week — filtered subset specific
    day_order = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    day_counts_raw = df["day_of_week"].value_counts().to_dict()
    day_counts = [{"day": d, "count": int(day_counts_raw.get(d, 0))} for d in day_order]

    # Time heatmap: day x hour grid
    pivot = (
        df.groupby(["day_of_week", "hour"]).size()
        .reset_index(name="count")
    )
    time_grid = {}
    for _, row in pivot.iterrows():
        key = f"{row['day_of_week']}-{int(row['hour'])}"
        time_grid[key] = int(row["count"])

    # City breakdown
    cc = df["city"].value_counts().head(10).reset_index()
    cc.columns = ["city", "count"]
    city_counts = cc.to_dict("records")

    return {
        "crime_types": crime_counts,
        "by_hour":     hour_counts,
        "by_day":      day_counts,
        "time_grid":   time_grid,
        "by_city":     city_counts,
        "total":       int(len(df)),
        "arrested":    int(df["arrested"].sum()),
        "arrest_rate": round(float(df["arrested"].mean()), 3),
    }


def get_safety_ranking(df: pd.DataFrame, crime_type: str) -> dict:
    """
    Change 2: Safety ranking for Bangalore areas per crime type.
    Returns areas sorted safest (lowest count) to most dangerous.
    """
    if "area_name" not in df.columns:
        return {"crime_type": crime_type, "areas": []}

    # Filter to crime type if specified
    if crime_type and crime_type != "All":
        sub = df[df["crime_type"] == crime_type]
    else:
        sub = df.copy()

    # Only include rows with a known area
    sub = sub[sub["area_name"].notna() & (sub["area_name"] != "")]
    if sub.empty:
        return {"crime_type": crime_type, "areas": []}

    # Count per area
    area_counts = sub.groupby("area_name").size().reset_index(name="count")

    # Add any Bangalore areas with zero incidents
    all_area_names = [a["name"] for a in BANGALORE_AREAS]
    existing = set(area_counts["area_name"].tolist())
    zero_rows = [{"area_name": n, "count": 0}
                 for n in all_area_names if n not in existing]
    if zero_rows:
        area_counts = pd.concat([area_counts, pd.DataFrame(zero_rows)], ignore_index=True)

    # Sort safest first (lowest count)
    area_counts = area_counts.sort_values("count", ascending=True).reset_index(drop=True)
    max_count = int(area_counts["count"].max()) if not area_counts.empty else 1

    areas = []
    for rank, row in enumerate(area_counts.itertuples(), 1):
        score = round(1.0 - (row.count / max(max_count, 1)), 3)
        areas.append({
            "rank":      rank,
            "area_name": row.area_name,
            "count":     int(row.count),
            "score":     score,
        })

    return {"crime_type": crime_type, "areas": areas}
