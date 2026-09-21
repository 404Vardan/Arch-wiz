import React from 'react';
import { X, Cpu, Layers } from 'lucide-react';
import { CPU_COMPONENTS } from '../../data/cpuData';
import { ComponentId } from '../../types';

interface ComponentDetailsModalProps {
  componentId: ComponentId | null;
  onClose: () => void;
}

export const ComponentDetailsModal: React.FC<ComponentDetailsModalProps> = ({
  componentId,
  onClose
}) => {
  if (!componentId) return null;
  const comp = CPU_COMPONENTS[componentId];
  if (!comp) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '32px',
        right: '32px',
        width: '380px',
        maxWidth: 'calc(100vw - 48px)',
        zIndex: 60,
        animation: 'fadeIn 0.25s ease-out'
      }}
    >
      <div
        className="tech-panel"
        style={{
          borderRadius: '4px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          borderLeft: '3px solid #ff6a00'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px',
                letterSpacing: '0.1em',
                color: '#ff6a00',
                textTransform: 'uppercase'
              }}
            >
              <Cpu size={12} />
              {comp.category}
            </div>
            <h2
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '22px',
                fontWeight: 700,
                color: '#ffffff',
                marginTop: '4px'
              }}
            >
              {comp.name}
            </h2>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                color: '#8b949e',
                letterSpacing: '0.05em'
              }}
            >
              {comp.fullName}
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '2px',
              color: '#9aa3af',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => ((e.currentTarget.style.color = '#ffffff'), (e.currentTarget.style.borderColor = '#ff6a00'))}
            onMouseLeave={(e) => ((e.currentTarget.style.color = '#9aa3af'), (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'))}
          >
            <X size={14} />
          </button>
        </div>

        {/* Primary Description */}
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '13px',
            lineHeight: 1.6,
            color: '#c9d1d9'
          }}
        >
          "{comp.description}"
        </p>

        {/* Scope Note required by user */}
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px',
            color: '#6e7681',
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '8px 10px',
            borderRadius: '2px',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}
        >
          Selected CPU architecture concept visualized by ARCH-VIZ.
        </div>

        {/* Technical Specs List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#8b949e',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Layers size={11} />
            ARCHITECTURAL SPECIFICATIONS
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '6px'
            }}
          >
            {comp.techSpecs.map((spec, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                  borderRadius: '2px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '11px'
                }}
              >
                <span style={{ color: '#8b949e' }}>{spec.label}</span>
                <span style={{ color: '#f0f6fc', fontWeight: 500 }}>{spec.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
