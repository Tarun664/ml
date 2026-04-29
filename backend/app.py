from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import os
from data_loader import load_india_data, load_uk_data, load_us_data
from ml_engine import run_kmeans, run_dbscan, get_trends, get_safety_ranking

app = Flask(__name__, static_folder="../frontend/build", static_url_path="/")
CORS(app)

# Load data once on startup
print("Loading crime data for multiple regions...")
DATASETS = {
    "india": load_india_data(),
    "uk": load_uk_data(),
    "us": load_us_data()
}
print("All datasets loaded.")

def get_df_for_region(region):
    region = region.lower()
    return DATASETS.get(region, DATASETS["india"])

@app.route("/api/filters")
def get_filters():
    region = request.args.get("region", "india")
    df = get_df_for_region(region)
    
    if df.empty:
        return jsonify({"cities": ["All"], "crime_types": ["All"], "date_range": {"min": "", "max": ""}})
        
    cities = sorted(df["city"].dropna().unique().tolist())
    crime_types = sorted(df["crime_type"].dropna().unique().tolist())
    return jsonify({
        "cities": [f"All {region.upper()}"] + cities,
        "crime_types": ["All"] + crime_types,
        "date_range": {
            "min": str(df["date"].min().date()),
            "max": str(df["date"].max().date()),
        }
    })


@app.route("/api/analyze", methods=["POST"])
def analyze():
    print(f"Request received: /api/analyze?region={request.args.get('region')}")
    region = request.args.get("region", "india")
    df = get_df_for_region(region)
    
    body = request.get_json(force=True)
    algorithm  = body.get("algorithm", "kmeans")
    n_clusters = int(body.get("n_clusters", 10))
    city       = body.get("city", f"All {region.upper()}")
    crime_type = body.get("crime_type", "All")

    if df.empty:
        print("Error: No data available for this region")
        return jsonify({"error": "No data available for this region"}), 400

    filtered = df.copy()
    if city and not city.startswith("All "):
        filtered = filtered[filtered["city"] == city]
    if crime_type and crime_type != "All":
        filtered = filtered[filtered["crime_type"] == crime_type]

    if len(filtered) < 10:
        print(f"Error: Not enough data for filters ({len(filtered)} records)")
        return jsonify({"error": "Not enough data for selected filters"}), 400

    # Sample for performance
    sample = filtered.sample(min(30000, len(filtered)), random_state=42)

    if algorithm == "dbscan":
        clusters, heatmap_pts = run_dbscan(sample)
    else:
        clusters, heatmap_pts = run_kmeans(sample, n_clusters)

    # Change 3: pass already-filtered df so trends are city+crime_type specific
    trends = get_trends(filtered)

    print(f"Analysis complete: {len(filtered)} records, {len(clusters)} clusters")
    return jsonify({
        "algorithm": algorithm,
        "total_records": len(filtered),
        "clusters": clusters,
        "heatmap_points": heatmap_pts,
        "trends": trends,
    })


# Change 2: New safety ranking endpoint
@app.route("/api/safety-ranking")
def safety_ranking():
    region     = request.args.get("region", "india")
    city       = request.args.get("city", "Bangalore")
    crime_type = request.args.get("crime_type", "Theft")

    df = get_df_for_region(region)

    if df.empty:
        return jsonify({"error": "No data available"}), 400

    # Filter to the requested city
    if city and not city.startswith("All "):
        city_df = df[df["city"] == city]
    else:
        city_df = df.copy()

    if "area_name" not in city_df.columns or city_df["area_name"].eq("").all():
        return jsonify({"crime_type": crime_type, "areas": []}), 200

    result = get_safety_ranking(city_df, crime_type)
    return jsonify(result)


# Serve React build (for production)
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    build_dir = os.path.join(os.path.dirname(__file__), "../frontend/build")
    if os.path.exists(build_dir):
        if path and os.path.exists(os.path.join(build_dir, path)):
            return send_from_directory(build_dir, path)
        return send_from_directory(build_dir, "index.html")
    return jsonify({"status": "API running. Start React dev server on port 3000."}), 200


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
