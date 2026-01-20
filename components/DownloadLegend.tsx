import React from 'react';
import type { DataSet } from '../types';

interface DownloadLegendProps {
  datasets: DataSet[];
}

const DownloadLegend: React.FC<DownloadLegendProps> = ({ datasets }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      padding: '12px',
      backgroundColor: '#f8fafc',
      borderRadius: '8px',
      border: '1px solid #e2e8f0',
      minWidth: '250px',
      maxWidth: '350px'
    }}>
      <h3 style={{
        fontSize: '1rem',
        fontWeight: 'bold',
        color: '#1e293b',
        margin: '0 0 8px 0',
        paddingBottom: '8px',
        borderBottom: '1px solid #e2e8f0',
      }}>
        Plotted Files
      </h3>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {datasets.map((ds) => (
          <li key={ds.name} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '16px',
              height: '16px',
              backgroundColor: ds.color,
              borderRadius: '3px',
              flexShrink: 0
            }} />
            <span style={{
              fontSize: '0.875rem',
              color: '#475569',
              fontWeight: 500,
              wordBreak: 'break-all'
            }}>
              {ds.name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default React.memo(DownloadLegend);