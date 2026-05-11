import React from 'react';

const PageHeader = ({ title, subtitle, actions }) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: '20px',
      flexWrap: 'wrap',
      gap: '12px'
    }}>
      <div>
        <h1 style={{
          fontSize: '19px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.3px',
          marginBottom: subtitle ? '3px' : 0
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{subtitle}</p>
        )}
      </div>
      {actions && (
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>{actions}</div>
      )}
    </div>
  );
};

export default PageHeader;
