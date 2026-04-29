import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import CrimeMap from './components/CrimeMap';
import FilterBar from './components/FilterBar';
import HotspotPanel from './components/HotspotPanel';
import TrendCharts from './components/TrendCharts';
import SafetyPanel from './components/SafetyPanel';
import { NavbarHero } from './components/ui/hero-with-video';
import './App.css';

export default function App() {
  const [showDashboard, setShowDashboard] = useState(false);

  const [region, setRegion]                 = useState('india');
  const [filters, setFilters]               = useState({ cities: [], crime_types: [] });
  const [config, setConfig]                 = useState({
    city: 'All INDIA', crime_type: 'All', algorithm: 'kmeans', n_clusters: 10
  });
  const [data, setData]                     = useState(null);
  const [loading, setLoading]               = useState(false);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [activePanel, setActivePanel]       = useState('hotspots'); // 'hotspots' | 'trends' | 'safety'
  const [error, setError]                   = useState(null);

  // Load filter options
  useEffect(() => {
    axios.get(`/api/filters?region=${region}`)
      .then(r => setFilters(r.data))
      .catch(() => {});
  }, [region]);

  // Run analysis
  const analyze = useCallback(async (cfg = config) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`/api/analyze?region=${region}`, cfg);
      if (res.data && res.data.clusters) {
        res.data.clusters.sort((a, b) => b.crime_count - a.crime_count);
        res.data.clusters.forEach((cluster, index) => {
          cluster.rank = index + 1;
        });
      }
      setData(res.data);
      setSelectedCluster(null);
    } catch (e) {
      setError(e.response?.data?.error || 'Analysis failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, [config, region]);

  // Auto-run on first load and when region changes
  useEffect(() => {
    const newConfig = { city: `All ${region.toUpperCase()}`, crime_type: 'All', algorithm: 'kmeans', n_clusters: 10 };
    setConfig(newConfig);
    analyze(newConfig);
  }, [region]); // eslint-disable-line

  const handleConfigChange = (key, val) => {
    const next = { ...config, [key]: val };
    setConfig(next);
  };

  const handleAnalyze = () => analyze(config);

  if (!showDashboard) {
    return (
      <div onClick={(e) => {
        const target = e.target;
        if (target.textContent?.includes('Start Surveying')) {
          setShowDashboard(true);
        }
      }}>
        <NavbarHero />
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="app-header">
        <div className="header-brand">
          <h1 className="brand-title">[SYS] CRIMEWATCH</h1>
          <span className="brand-sub">{region.toUpperCase()} PATTERN ANALYSIS ENGINE</span>
        </div>
        <div className="header-stats">
          <select
            value={region}
            onChange={e => setRegion(e.target.value)}
            className="region-selector"
          >
            <option value="india">India (Hybrid)</option>
            <option value="uk">UK (Exact)</option>
            <option value="us">US (Exact)</option>
          </select>
          {data && (
            <>
              <div className="stat-pill">
                <span className="stat-label">TOTAL RECORDS</span>
                <span className="stat-val">{data.total_records?.toLocaleString()}</span>
              </div>
              <div className="stat-pill">
                <span className="stat-label">DETECTED ZONES</span>
                <span className="stat-val">{data.clusters?.length}</span>
              </div>
              <div className="stat-pill">
                <span className="stat-label">ARREST RATE</span>
                <span className="stat-val">{data.trends ? (data.trends.arrest_rate * 100).toFixed(1) + '%' : '—'}</span>
              </div>
            </>
          )}
          {loading && <span className="loading-badge">ANALYZING...</span>}
        </div>
      </header>

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        config={config}
        onChange={handleConfigChange}
        onAnalyze={handleAnalyze}
        loading={loading}
      />

      {/* Main Content */}
      <main className="app-main">
        {/* Left Sidebar */}
        <aside className="app-sidebar">
          <div className="sidebar-tabs">
            <button
              className={`tab-btn ${activePanel === 'hotspots' ? 'active' : ''}`}
              onClick={() => setActivePanel('hotspots')}
            >
              HOTSPOTS
            </button>
            <button
              className={`tab-btn ${activePanel === 'trends' ? 'active' : ''}`}
              onClick={() => setActivePanel('trends')}
            >
              TRENDS
            </button>
            <button
              className={`tab-btn ${activePanel === 'safety' ? 'active' : ''}`}
              onClick={() => setActivePanel('safety')}
            >
              SAFETY
            </button>
          </div>

          {error && (
            <div className="error-box">
              <span className="error-icon">!</span>
              <p>{error}</p>
            </div>
          )}

          {activePanel === 'hotspots' && (
            <HotspotPanel
              clusters={data?.clusters || []}
              selected={selectedCluster}
              onSelect={setSelectedCluster}
              loading={loading}
            />
          )}
          {activePanel === 'trends' && (
            <TrendCharts trends={data?.trends} loading={loading} />
          )}
          {activePanel === 'safety' && (
            <SafetyPanel
              city={config.city}
              region={region}
            />
          )}
        </aside>

        {/* Map */}
        <section className="app-map">
          <CrimeMap
            region={region}
            clusters={data?.clusters || []}
            heatmapPoints={data?.heatmap_points || []}
            selectedCluster={selectedCluster}
            onClusterSelect={setSelectedCluster}
            loading={loading}
          />
        </section>
      </main>
    </div>
  );
}
