import { useState, useEffect } from 'react';

export default function RateLimitToast() {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handler = (e) => {
      setMessage(e.detail?.message || 'Demasiadas solicitudes. Por favor espera un momento.');
      setVisible(true);
    };

    window.addEventListener('rate-limit', handler);
    return () => window.removeEventListener('rate-limit', handler);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        backgroundColor: '#f59e0b',
        color: '#1c1917',
        padding: '0.875rem 1.25rem',
        borderRadius: '0.5rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        maxWidth: '360px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.625rem',
        fontSize: '0.875rem',
        fontWeight: 500,
        animation: 'slideIn 0.25s ease-out',
      }}
    >
      <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>⚠️</span>
      <span>{message}</span>
      <button
        onClick={() => setVisible(false)}
        style={{
          marginLeft: 'auto',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '1rem',
          color: '#1c1917',
          flexShrink: 0,
          padding: 0,
          lineHeight: 1,
        }}
      >
        ✕
      </button>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
