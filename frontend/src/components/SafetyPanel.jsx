import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CRIME_TYPES = [
  'Theft', 'Assault', 'Robbery', 'Burglary',
  'Fraud', 'Cybercrime', 'Murder', 'Kidnapping',
];

export default function SafetyPanel({ city, region }) {
  const [crimeType, setCrimeType]     = useState('Theft');
  const [ranking, setRanking]         = useState(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState(null);

  useEffect(() => {
    if (!city || city.startsWith('All ')) {
      setRanking(null);
      return;
    }
    setLoading(true);
    setError(null);
    axios
      .get(`/api/safety-ranking?region=${region}&city=${encodeURIComponent(city)}&crime_type=${encodeURIComponent(crimeType)}`)
      .then(r => setRanking(r.data))
      .catch(() => setError('Failed to load safety data.'))
      .finally(() => setLoading(false));
  }, [city, crimeType, region]);

  const isBangalore = city && !city.startsWith('All ') && city.toLowerCase() === 'bangalore';

  return (
    <div className="safety-panel">
      <div className="safety-header">
        <span className="safety-title">
          SAFEST AREAS — {crimeType.toUpperCase()}
        </span>
        <select
          className="safety-crime-select"
          value={crimeType}
          onChange={e => setCrimeType(e.target.value)}
        >
          {CRIME_TYPES.map(ct => (
            <option key={ct} value={ct}>{ct}</option>
          ))}
        </select>
      </div>

      {!isBangalore && (
        <div className="safety-empty">
          <span>Select <b>Bangalore</b> as city to view area safety rankings.</span>
        </div>
      )}

      {isBangalore && loading && (
        <div className="hotspot-list">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ padding: '10px 16px', borderBottom: '1px solid #111' }}>
              <div className="skeleton" style={{ height: 11, width: '80%', marginBottom: 6 }} />
              <div className="skeleton" style={{ height: 4, width: '100%' }} />
            </div>
          ))}
        </div>
      )}

      {isBangalore && error && (
        <div className="safety-empty">
          <span style={{ color: '#666' }}>{error}</span>
        </div>
      )}

      {isBangalore && !loading && ranking?.areas?.length > 0 && (
        <div className="safety-list">
          {ranking.areas.map((item) => {
            const maxCount = ranking.areas[ranking.areas.length - 1]?.count || 1;
            const pct = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
            return (
              <div key={item.area_name} className="safety-row">
                <span className="safety-rank">
                  {String(item.rank).padStart(2, '0')}
                </span>
                <div className="safety-body">
                  <div className="safety-area-name">{item.area_name}</div>
                  <div className="safety-bar-track">
                    <div
                      className="safety-bar-fill"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <span className="safety-count">{item.count}</span>
              </div>
            );
          })}
        </div>
      )}

      {isBangalore && !loading && ranking?.areas?.length === 0 && (
        <div className="safety-empty">
          <span style={{ color: '#555' }}>No area data available for this crime type.</span>
        </div>
      )}
    </div>
  );
}
