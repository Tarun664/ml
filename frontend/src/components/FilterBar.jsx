import React from 'react';

export default function FilterBar({ filters, config, onChange, onAnalyze, loading }) {
  return (
    <div className="filter-bar">
      <div className="filter-group">
        <span className="filter-label">CITY</span>
        <select
          className="filter-select"
          value={config.city}
          onChange={e => onChange('city', e.target.value)}
        >
          {(filters.cities || ['All India']).map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <span className="filter-label">CRIME TYPE</span>
        <select
          className="filter-select"
          value={config.crime_type}
          onChange={e => onChange('crime_type', e.target.value)}
        >
          {(filters.crime_types || ['All']).map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <span className="filter-label">ALGORITHM</span>
        <div className="algo-toggle">
          {['kmeans', 'dbscan'].map(algo => (
            <button
              key={algo}
              className={`algo-btn ${config.algorithm === algo ? 'active' : ''}`}
              onClick={() => onChange('algorithm', algo)}
            >
              {algo.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {config.algorithm === 'kmeans' && (
        <div className="filter-group">
          <span className="filter-label">CLUSTERS</span>
          <input
            type="range"
            className="cluster-slider"
            min={4}
            max={20}
            value={config.n_clusters}
            onChange={e => onChange('n_clusters', parseInt(e.target.value))}
          />
          <span className="cluster-val">{config.n_clusters}</span>
        </div>
      )}

      <button
        className="analyze-btn"
        onClick={onAnalyze}
        disabled={loading}
      >
        {loading ? 'RUNNING...' : 'ANALYZE'}
      </button>
    </div>
  );
}
