import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

interface LoaderProps {
  onEnter: () => void;
}

export const Loader: React.FC<LoaderProps> = ({ onEnter }) => {
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setIsReady(true);
          return 100;
        }
        return prev + Math.floor(Math.random() * 15) + 10;
      });
    }, 90);

    return () => clearInterval(timer);
  }, []);

  const totalBlocks = 16;
  const filledBlocks = Math.min(totalBlocks, Math.round((progress / 100) * totalBlocks));
  const emptyBlocks = totalBlocks - filledBlocks;
  const barString = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#0a0b0d',
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
    >
      <div style={{ maxWidth: '420px', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '8px', height: '8px', background: '#ff6a00' }} />
          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: '18px',
              letterSpacing: '0.12em',
              color: '#ffffff'
            }}
          >
            ARCH-VIZ
          </span>
        </div>

        {/* Status Line */}
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            color: '#8b949e',
            letterSpacing: '0.08em'
          }}
        >
          {isReady ? 'SYSTEM READY // ALL SILICON REGISTERS LOADED' : 'INITIALIZING ARCHITECTURE...'}
        </div>

        {/* Technical Progress Bar */}
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '13px',
            color: '#ff6a00',
            letterSpacing: '0.04em'
          }}
        >
          [{barString}] {progress}%
        </div>

        {/* Subtext info */}
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px',
            color: '#484f58',
            lineHeight: 1.6
          }}
        >
          &gt; Latching 32-bit registers (R0-R31)...
          <br />
          &gt; Synthesizing 3D exploded processor topology...
          <br />
          &gt; Calibrating datapath timeline...
        </div>

        {/* Enter Button when ready */}
        <div style={{ marginTop: '12px', minHeight: '48px' }}>
          {isReady && (
            <button
              onClick={onEnter}
              className="btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '14px',
                animation: 'fadeIn 0.2s ease-out'
              }}
            >
              <span>ENTER ARCHITECTURE</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
