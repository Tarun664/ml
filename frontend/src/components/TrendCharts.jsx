import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, Cell
} from 'recharts';

const CHART_THEME = {
  background: 'transparent',
  text: '#aaaaaa',
  grid: '#222222',
  fill: '#ffffff',
  stroke: '#ffffff',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#000', border: '2px solid #fff',
      padding: '6px 10px', fontFamily: 'Space Mono, monospace', fontSize: 11
    }}>
      <p style={{ color: '#aaa', fontSize: 9, letterSpacing: 2 }}>{label}</p>
      <p style={{ color: '#fff', fontWeight: 700 }}>{payload[0].value?.toLocaleString()}</p>
    </div>
  );
};

export default function TrendCharts({ trends, loading }) {
  if (loading || !trends) {
    return (
      <div className="trend-panel">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="chart-section">
            <div className="skeleton" style={{ height: 12, width: '50%', marginBottom: 12 }} />
            <div className="skeleton" style={{ height: 100 }} />
          </div>
        ))}
      </div>
    );
  }

  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const maxTimeGrid = Math.max(...Object.values(trends.time_grid || {}), 1);

  return (
    <div className="trend-panel">

      {/* Crime Types Bar */}
      <div className="chart-section">
        <div className="chart-title">CRIME TYPE BREAKDOWN</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={trends.crime_types} layout="vertical" margin={{ left: 0, right: 10 }}>
            <XAxis type="number" tick={{ fill: CHART_THEME.text, fontSize: 9, fontFamily: 'Space Mono' }} />
            <YAxis
              type="category" dataKey="type" width={72}
              tick={{ fill: CHART_THEME.text, fontSize: 9, fontFamily: 'Space Mono' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#111' }} />
            <Bar dataKey="count" fill={CHART_THEME.fill} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Change 3: Hour Area — data is filtered by city+crime_type already from backend */}
      <div className="chart-section">
        <div className="chart-title">INCIDENTS BY HOUR OF DAY</div>
        <ResponsiveContainer width="100%" height={120}>
          <AreaChart data={trends.by_hour} margin={{ left: 0, right: 10 }}>
            <XAxis
              dataKey="hour"
              tick={{ fill: CHART_THEME.text, fontSize: 8, fontFamily: 'Space Mono' }}
              tickFormatter={h => h % 6 === 0 ? `${h}h` : ''}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone" dataKey="count"
              stroke={CHART_THEME.stroke} strokeWidth={2}
              fill="#ffffff" fillOpacity={0.08}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Change 3: Day Bar — filtered by city+crime_type */}
      <div className="chart-section">
        <div className="chart-title">INCIDENTS BY DAY OF WEEK</div>
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={trends.by_day} margin={{ left: 0, right: 10 }}>
            <XAxis
              dataKey="day"
              tick={{ fill: CHART_THEME.text, fontSize: 9, fontFamily: 'Space Mono' }}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#111' }} />
            <Bar dataKey="count">
              {trends.by_day.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.day === 'Fri' || entry.day === 'Sat' ? '#fff' : '#555'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Change 7: Rebuilt Time Heatmap Grid */}
      <div className="chart-section">
        <div className="chart-title">CRIME DENSITY — DAY × HOUR</div>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'flex', gap: 4, alignItems: 'flex-start', minWidth: 'max-content' }}>
            {/* Day labels — left side */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', paddingTop: 2 }}>
              {DAYS.map(d => (
                <div
                  key={d}
                  style={{
                    width: 28,
                    height: 11,
                    fontSize: 9,
                    color: '#666',
                    textAlign: 'right',
                    fontFamily: 'Space Mono, monospace',
                    lineHeight: '11px',
                    paddingRight: 4,
                    boxSizing: 'border-box',
                  }}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Grid columns */}
            <div>
              {/* Grid rows */}
              {DAYS.map(day => (
                <div key={day} style={{ display: 'flex', gap: '1px', marginBottom: '1px' }}>
                  {Array.from({ length: 24 }, (_, hour) => {
                    const val = trends.time_grid?.[`${day}-${hour}`] || 0;
                    // Change 7: black=no crime, near-white=high crime
                    const n = Math.round((val / maxTimeGrid) * 220);
                    return (
                      <div
                        key={hour}
                        style={{
                          width: 11,
                          height: 11,
                          margin: 0,
                          background: `rgb(${n},${n},${n})`,
                          flexShrink: 0,
                          cursor: 'default',
                        }}
                        title={`${day} ${hour}:00 — ${val} incidents`}
                      />
                    );
                  })}
                </div>
              ))}

              {/* Hour labels on the bottom */}
              <div style={{ display: 'flex', gap: '1px', marginTop: 4 }}>
                {Array.from({ length: 24 }, (_, h) => (
                  <div
                    key={h}
                    style={{
                      width: 11,
                      fontSize: 8,
                      color: '#555',
                      fontFamily: 'Space Mono, monospace',
                      textAlign: 'center',
                      flexShrink: 0,
                      lineHeight: '11px',
                    }}
                  >
                    {h === 0 || h === 6 || h === 12 || h === 18 || h === 23 ? h : ''}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Change 7: Color scale legend below grid */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
            <div style={{
              width: 100,
              height: 5,
              background: 'linear-gradient(to right, #000, rgb(220,220,220))',
              border: '1px solid #222',
            }} />
            <span style={{ fontSize: 8, color: '#555', fontFamily: 'Space Mono, monospace', letterSpacing: 1 }}>
              LOW → HIGH
            </span>
          </div>
        </div>
      </div>

      {/* Change 8: Rebuilt Top Cities as clean ranked table */}
      <div className="chart-section">
        <div className="chart-title">TOP CITIES</div>
        {trends.by_city?.map((c, i) => {
          const pct = (c.count / (trends.by_city[0]?.count || 1)) * 100;
          const rank = String(i + 1).padStart(2, '0');
          return (
            <div
              key={c.city}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '6px 0',
                borderBottom: '0.5px solid #1a1a1a',
              }}
            >
              {/* RANK */}
              <span style={{
                fontSize: 10,
                color: '#555',
                minWidth: 20,
                fontFamily: 'Space Mono, monospace',
                fontWeight: 700,
              }}>
                {rank}
              </span>
              {/* CITY */}
              <span style={{
                fontSize: 11,
                minWidth: 90,
                color: '#fff',
                fontFamily: 'Space Mono, monospace',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {c.city}
              </span>
              {/* BAR TRACK */}
              <div style={{ flex: 1, height: 3, background: '#111', position: 'relative' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: '#fff' }} />
              </div>
              {/* COUNT */}
              <span style={{
                fontSize: 10,
                color: '#777',
                minWidth: 45,
                textAlign: 'right',
                fontFamily: 'Space Mono, monospace',
              }}>
                {c.count?.toLocaleString()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Summary stats */}
      <div className="chart-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#222' }}>
        <div style={{ background: '#000', padding: '12px 14px' }}>
          <div style={{ fontSize: 8, color: '#666', letterSpacing: 2 }}>TOTAL INCIDENTS</div>
          <div style={{ fontSize: 22, fontFamily: 'Bebas Neue', letterSpacing: 2 }}>
            {trends.total?.toLocaleString()}
          </div>
        </div>
        <div style={{ background: '#000', padding: '12px 14px' }}>
          <div style={{ fontSize: 8, color: '#666', letterSpacing: 2 }}>TOTAL ARRESTED</div>
          <div style={{ fontSize: 22, fontFamily: 'Bebas Neue', letterSpacing: 2 }}>
            {trends.arrested?.toLocaleString()}
          </div>
        </div>
      </div>

    </div>
  );
}
