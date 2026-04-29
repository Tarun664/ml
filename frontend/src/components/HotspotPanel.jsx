import React from 'react';

function ClusterDetail({ cluster }) {
  if (!cluster) return null;
  const maxCount = cluster.top_crimes?.[0]?.count || 1;

  return (
    <div className="cluster-detail">
      <div className="cd-title">
        {/* Change 5: show area_name prominently if available */}
        {cluster.area_name
          ? <>{cluster.area_name} <span style={{ color: '#555', fontSize: 10 }}>#{cluster.rank || (cluster.id + 1)}</span></>
          : <>HOTSPOT #{cluster.rank || (cluster.id + 1)}</>
        }
      </div>
      <div className="cd-grid">
        <div className="cd-cell">
          <span className="cd-cell-label">INCIDENTS</span>
          <span className="cd-cell-val">{cluster.crime_count?.toLocaleString()}</span>
        </div>
        <div className="cd-cell">
          <span className="cd-cell-label">ARREST RATE</span>
          <span className="cd-cell-val">{((cluster.arrest_rate || 0) * 100).toFixed(1)}%</span>
        </div>
        <div className="cd-cell">
          <span className="cd-cell-label">PEAK HOUR</span>
          <span className="cd-cell-val">{cluster.peak_hour}:00</span>
        </div>
        <div className="cd-cell">
          <span className="cd-cell-label">PEAK DAY</span>
          <span className="cd-cell-val">{cluster.peak_day}</span>
        </div>
        <div className="cd-cell" style={{ gridColumn: 'span 2' }}>
          <span className="cd-cell-label">LOCATION</span>
          <span className="cd-cell-val" style={{ fontSize: '11px' }}>
            {cluster.cities?.join(' / ')}
          </span>
        </div>
      </div>

      {cluster.top_crimes?.length > 0 && (
        <div className="cd-crimes">
          <div className="cd-crimes-title">TOP CRIME TYPES</div>
          {cluster.top_crimes.map(c => (
            <div key={c.type} className="cd-crime-bar">
              <span className="cd-crime-name">{c.type}</span>
              <div className="cd-crime-track">
                <div
                  className="cd-crime-fill"
                  style={{ width: `${(c.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="cd-crime-num">{c.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HotspotPanel({ clusters, selected, onSelect, loading }) {
  if (loading && clusters.length === 0) {
    return (
      <div className="hotspot-list">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="hotspot-item">
            <div className="skeleton" style={{ width: 36, height: 36 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div className="skeleton" style={{ height: 14, width: '70%' }} />
              <div className="skeleton" style={{ height: 10, width: '50%' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="hotspot-header">
        <span className="hotspot-header-label">DETECTED HOTSPOTS</span>
        <span className="hotspot-count">{clusters.length} ZONES</span>
      </div>

      <div className="hotspot-list">
        {clusters.map((cluster, idx) => {
          const isSelected = selected?.id === cluster.id;
          return (
            <div
              key={cluster.id}
              className={`hotspot-item ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelect(isSelected ? null : cluster)}
            >
              <span className="hi-rank">#{cluster.rank || (idx + 1)}</span>
              <div className="hi-body">
                {/* Change 5: show area_name as primary label when available */}
                <div className="hi-crime">
                  {cluster.area_name || cluster.top_crime}
                </div>
                <div className="hi-city">
                  {cluster.area_name
                    ? cluster.top_crime
                    : cluster.cities?.slice(0, 2).join(' · ')}
                </div>
                <div className="hi-meta">
                  <span className="hi-badge">{cluster.crime_count?.toLocaleString()} INC</span>
                  <span className="hi-badge">{((cluster.arrest_rate || 0) * 100).toFixed(0)}% ARR</span>
                  <span className="hi-badge">{cluster.peak_hour}:00 PEAK</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selected && <ClusterDetail cluster={selected} />}
    </>
  );
}
