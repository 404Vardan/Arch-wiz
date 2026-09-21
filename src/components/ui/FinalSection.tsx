import React from 'react';
import { ArrowRight, RotateCcw, Cpu } from 'lucide-react';
import { audio } from '../../utils/audio';

interface FinalSectionProps {
  scrollProgress: number;
  onExplore: () => void;
  onViewExecution: () => void;
  onResetToTop: () => void;
  onOpenSimulator: () => void;
}

export const FinalSection: React.FC<FinalSectionProps> = ({
  scrollProgress,
  onExplore,
  onViewExecution,
  onResetToTop,
  onOpenSimulator
}) => {
  const isVisible = scrollProgress >= 0.95;
  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 40,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: '0 24px',
        background: 'radial-gradient(circle at center, rgba(10, 11, 13, 0.4) 0%, rgba(10, 11, 13, 0.9) 100%)',
        animation: 'fadeIn 0.4s ease-out'
      }}
    >
      <div style={{ maxWidth: '680px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
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
          ARCH-VIZ // LAB SUITE
        </div>

        {/* Big Editorial Heading */}
        <h2
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 'clamp(36px, 5.5vw, 68px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1.05,
            color: '#ffffff'
          }}
        >
          SEE THE PROCESSOR.
          <br />
          <span style={{ color: '#ff6a00' }}>NOT JUST THE RESULT.</span>
        </h2>

        {/* Description */}
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '15px',
            lineHeight: 1.6,
            color: '#8b949e',
            maxWidth: '540px'
          }}
        >
          An interactive visual analyzer designed to make Computer Organization and Architecture observable. Test custom instructions, inspect cache blocks, and observe pipeline forwarding in real time.
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '14px', marginTop: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => {
              audio.playClick();
              onOpenSimulator();
            }}
            className="btn-primary"
            style={{ padding: '14px 28px', background: '#ff6a00', border: '1px solid #ff6a00' }}
          >
            <Cpu size={15} />
            <span>OPEN SIMULATOR LAB</span>
          </button>

          <button
            onClick={() => {
              audio.playClick();
              onExplore();
            }}
            className="btn-secondary"
            style={{ padding: '14px 24px' }}
          >
            <span>EXPLORE ARCHITECTURE</span>
            <ArrowRight size={14} />
          </button>

          <button
            onClick={() => {
              audio.playClick();
              onViewExecution();
            }}
            className="btn-secondary"
            style={{ padding: '14px 20px' }}
          >
            <span>VIEW EXECUTION</span>
          </button>

          <button
            onClick={() => {
              audio.playClick();
              onResetToTop();
            }}
            className="btn-secondary"
            style={{ padding: '14px 18px' }}
            title="Replay from start"
          >
            <RotateCcw size={14} />
          </button>
        </div>

        {/* Bottom Credits */}
        <div
          style={{
            marginTop: '40px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px',
            letterSpacing: '0.1em',
            color: '#57606a'
          }}
        >
          <div>COMPUTER ORGANIZATION & ARCHITECTURE — PBL</div>
          <div style={{ color: '#8b949e' }}>ARCH-VIZ // INTERACTIVE VISUAL ANALYZER & SIMULATION LAB</div>
        </div>
      </div>
    </div>
  );
};
