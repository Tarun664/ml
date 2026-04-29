# Crime Analytics Project - Setup & Run Guide 🚀

This project combines a Flask backend with ML clustering (K-Means, DBSCAN) for crime data analysis across India, UK, and US regions, with a React frontend for visualization.

---

## 📋 Prerequisites

- **Python 3.8+** (check with `python --version`)
- **Node.js & npm** (for frontend - check with `node --version` and `npm --version`)
- **pip** (Python package manager - usually comes with Python)

---

## 🏃 Quick Start (Backend Only)

### Step 1: Open Terminal/PowerShell
Navigate to the project directory:
```powershell
cd c:\Users\Asus\.gemini\antigravity\scratch\projectml\backend
```

### Step 2: Create Virtual Environment (Recommended)
```powershell
python -m venv venv
```

### Step 3: Activate Virtual Environment
**On Windows (PowerShell):**
```powershell
.\venv\Scripts\Activate.ps1
```

**On Windows (Command Prompt):**
```cmd
venv\Scripts\activate.bat
```

**On Mac/Linux:**
```bash
source venv/bin/activate
```

### Step 4: Install Dependencies
```powershell
pip install -r requirements.txt
```

Expected packages installed:
- Flask 3.0.3+
- Flask-CORS 4.0.1+
- Pandas 2.2.2+
- NumPy 1.26.4+
- Scikit-learn 1.5.1+

### Step 5: Run the Backend Server
```powershell
python app.py
```

**Expected Output:**
```
Loading crime data for multiple regions...
Generating synthetic India crime data with crime waves...
Synthetic data generated: 50xxx records
Loaded real CSV: 0 rows (or loads actual data if data file exists)
Loaded xxx UK records.
Loaded xxx US records.
All datasets loaded.
 * Serving Flask app 'app'
 * Debug mode: on
 * Running on http://127.0.0.1:5000
 * Press CTRL+C to quit
```

✅ **Backend is now running on `http://localhost:5000`**

---

## 🎨 Optional: Run Frontend (React)

### Step 1: Open New Terminal
Navigate to frontend directory:
```powershell
cd c:\Users\Asus\.gemini\antigravity\scratch\projectml\frontend
```

### Step 2: Install Frontend Dependencies
```powershell
npm install
```

### Step 3: Start React Dev Server
```powershell
npm start
```

**Expected Output:**
```
Compiled successfully!
You can now view frontend in the browser.
  Local:            http://localhost:3000
  On Your Network:  http://xxx.x.x.x:3000
```

✅ **Frontend is now running on `http://localhost:3000`**

---

## 🔌 API Endpoints

Once backend is running, you can test these endpoints:

### Get Filter Options
```
GET http://localhost:5000/api/filters?region=india
```

### Run Analysis
```
POST http://localhost:5000/api/analyze?region=india
Body (JSON):
{
  "algorithm": "kmeans",
  "n_clusters": 10,
  "city": "All INDIA",
  "crime_type": "All"
}
```

---

## ✅ Verification Checklist

- [ ] Python dependencies installed
- [ ] Backend running without errors (no import errors)
- [ ] Flask server listening on port 5000
- [ ] Can access `http://localhost:5000` in browser
- [ ] (Optional) Frontend installed and running on port 3000
- [ ] (Optional) Frontend communicates with backend

---

## 🐛 Troubleshooting

### Issue: `ModuleNotFoundError: No module named 'flask'`
**Solution:** Make sure virtual environment is activated and dependencies installed:
```powershell
pip install -r requirements.txt
```

### Issue: Port 5000 already in use
**Solution:** Change port in `app.py` (line: `app.run(debug=True, port=5000)`) to another port like 5001

### Issue: Data loading fails
**Solution:** Program will automatically generate synthetic data. Check internet for UK/US data loading (these fetch live data from APIs).

### Issue: Frontend can't connect to backend
**Solution:** Ensure both servers are running and check CORS is enabled in Flask (`flask_cors` is imported)

---

## 📊 Project Structure

```
projectml/
├── backend/
│   ├── app.py              # Flask server & API routes
│   ├── ml_engine.py        # ML clustering (KMeans, DBSCAN)
│   ├── data_loader.py      # Data loading from CSVs/APIs
│   ├── requirements.txt    # Python dependencies
│   └── data/               # Crime data CSV files (optional)
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx         # Main React component
│   │   ├── components/     # UI components
│   │   └── index.js        # React entry point
│   ├── public/
│   │   └── index.html
│   └── package.json        # Node dependencies
│
└── RUN_GUIDE.md            # This file
```

---

## 🎯 Features

✅ **Multi-Region Crime Analysis** - India, UK, USA data  
✅ **Clustering Algorithms** - K-Means & DBSCAN  
✅ **Crime Trend Analysis** - By hour, day, city, type  
✅ **Heatmap Visualization** - Geographic crime hotspots  
✅ **REST API** - Flexible filtering and analysis  
✅ **Synthetic Data Generation** - Works without real datasets  

---

## 📝 Notes

- Backend generates **synthetic crime data** if real CSV not found
- Data includes realistic crime waves (seasonal patterns, event spikes)
- Frontend requires backend to be running
- All data is randomized/synthetic (educational purposes)

---

**Enjoy analyzing crime data! 🎉**
