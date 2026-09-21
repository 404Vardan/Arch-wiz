import React from 'react';
import { ArrowRight, Play } from 'lucide-react';

interface HeroOverlayProps {
  opacity: number;
  onExplore: () => void;
  onViewExecution: () => void;
}

export const HeroOverlay: React.FC<HeroOverlayProps> = ({
  opacity,
  onExplore,
  onViewExecution
}) => {
  if (opacity <= 0.01) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: opacity > 0.3 ? 'auto' : 'none',
        opacity: opacity,
        transition: 'opacity 0.2s ease-out',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        padding: '0 8vw'
      }}
    >
      <div style={{ maxWidth: '580px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Eyebrow */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#ff6a00'
          }}
        >
          <span style={{ width: '6px', height: '6px', background: '#ff6a00' }} />
          COA / PROJECT BASED LEARNING
        </div>

        {/* Large Editorial Title */}
        <h1
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(48px, 6.5vw, 84px)',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            lineHeight: 0.95,
            color: '#ffffff'
          }}
        >
          ARCH-VIZ
        </h1>

        {/* Subtitle */}
        <div
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '15px',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#d0d7de',
            lineHeight: 1.4
          }}
        >
          INTERACTIVE VISUAL ANALYZER
          <br />
          FOR CPU ARCHITECTURE & PERFORMANCE
        </div>

        {/* Description */}
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '15px',
            lineHeight: 1.6,
            color: '#8b949e',
            maxWidth: '460px'
          }}
        >
          See how instructions move through the processor — from fetch to execution, registers, ALU, memory and beyond.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: '14px', marginTop: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={onExplore}
            className="btn-primary"
            style={{
              padding: '14px 28px'
            }}
          >
            <span>EXPLORE ARCHITECTURE</span>
            <ArrowRight size={14} />
          </button>

          <button
            onClick={onViewExecution}
            className="btn-secondary"
            style={{
              padding: '14px 24px'
            }}
          >
            <Play size={13} style={{ fill: '#ff6a00', color: '#ff6a00' }} />
            <span>VIEW EXECUTION FLOW</span>
          </button>
        </div>

        {/* Scroll indicator prompt */}
        <div
          style={{
            marginTop: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px',
            letterSpacing: '0.12em',
            color: '#57606a',
            textTransform: 'uppercase'
          }}
        >
          <div
            style={{
              width: '24px',
              height: '36px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '12px',
              position: 'relative',
              display: 'flex',
              justifyContent: 'center',
              paddingTop: '6px'
            }}
          >
            <div
              style={{
                width: '3px',
                height: '6px',
                background: '#ff6a00',
                borderRadius: '2px',
                animation: 'pulseGlow 1.8s infinite'
              }}
            />
          </div>
          <span>SCROLL TO UNPACK ARCHITECTURE</span>
        </div>
      </div>
    </div>
  );
};
