import React, { useState } from 'react';
import { Volume2, VolumeX, Cpu, Gauge, HelpCircle } from 'lucide-react';
import { audio } from '../../utils/audio';

interface NavbarProps {
  scrollProgress: number;
  onNavigate: (sectionProgress: number) => void;
  onOpenSimulationLab?: () => void;
  onOpenSimulator: () => void;
  onOpenBenchmark: () => void;
  onOpenQuiz: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  scrollProgress,
  onNavigate,
  onOpenSimulationLab,
  onOpenSimulator,
  onOpenBenchmark,
  onOpenQuiz
}) => {
  const percent = Math.round(scrollProgress * 100);
  const [isMuted, setIsMuted] = useState<boolean>(audio.getIsMuted());

  const handleToggleMute = () => {
    const muted = audio.toggleMute();
    setIsMuted(muted);
    if (!muted) audio.playClick();
  };

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        zIndex: 50,
        padding: '14px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'linear-gradient(180deg, rgba(10, 11, 13, 0.94) 0%, rgba(10, 11, 13, 0) 100%)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
      }}
    >
      {/* Brand */}
      <div
        onClick={() => {
          audio.playClick();
          onNavigate(0);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          cursor: 'pointer'
        }}
      >
        <div
          style={{
            width: '10px',
            height: '10px',
            background: '#ff6a00',
            boxShadow: '0 0 12px rgba(255, 106, 0, 0.8)'
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: '15px',
              letterSpacing: '0.12em',
              color: '#ffffff'
            }}
          >
            ARCH-VIZ
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9px',
              color: '#6e7681',
              letterSpacing: '0.08em'
            }}
          >
            CPU VISUAL ANALYZER
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px'
        }}
      >
        {[
          { label: 'OVERVIEW', target: 0.05 },
          { label: 'ARCHITECTURE', target: 0.60 },
          { label: 'EXECUTION', target: 0.74 },
          { label: 'CACHE', target: 0.86 },
          { label: 'PIPELINE', target: 0.94 }
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => {
              audio.playClick();
              onNavigate(item.target);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#9aa3af',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              letterSpacing: '0.1em',
              cursor: 'pointer',
              transition: 'color 0.2s ease',
              padding: '6px 0',
              position: 'relative'
            }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.color = '#ff6a00')}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.color = '#9aa3af')}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* Right Actions: Benchmark, Quiz, Simulator Lab, Audio & Progress */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}
      >
        {/* Benchmark Trigger */}
        <button
          onClick={() => {
            audio.playClick();
            onOpenBenchmark();
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '6px 10px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#d0d7de',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px',
            fontWeight: 500,
            borderRadius: '2px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = '#38bdf8';
            (e.currentTarget as HTMLElement).style.color = '#38bdf8';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255, 255, 255, 0.1)';
            (e.currentTarget as HTMLElement).style.color = '#d0d7de';
          }}
        >
          <Gauge size={12} />
          <span>BENCHMARK</span>
        </button>

        {/* COA Quiz Trigger */}
        <button
          onClick={() => {
            audio.playClick();
            onOpenQuiz();
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '6px 10px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#d0d7de',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px',
            fontWeight: 500,
            borderRadius: '2px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = '#e5a93c';
            (e.currentTarget as HTMLElement).style.color = '#e5a93c';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255, 255, 255, 0.1)';
            (e.currentTarget as HTMLElement).style.color = '#d0d7de';
          }}
        >
          <HelpCircle size={12} />
          <span>QUIZ</span>
        </button>

        {/* Interactive 3D CPU Simulation Lab Trigger */}
        <button
          onClick={() => {
            audio.playClick();
            if (onOpenSimulationLab) onOpenSimulationLab();
            else onOpenSimulator();
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '6px 12px',
            background: '#ff6a00',
            border: '1px solid #ff6a00',
            color: '#000000',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.04em',
            borderRadius: '2px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 0 12px rgba(255, 106, 0, 0.3)'
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = '#ff8533';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = '#ff6a00';
          }}
        >
          <Cpu size={12} />
          <span>CPU SIMULATOR</span>
        </button>

        {/* Custom Assembly Sandbox Trigger */}
        <button
          onClick={() => {
            audio.playClick();
            onOpenSimulator();
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '6px 10px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#d0d7de',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px',
            fontWeight: 500,
            borderRadius: '2px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = '#ff6a00';
            (e.currentTarget as HTMLElement).style.color = '#ff6a00';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255, 255, 255, 0.1)';
            (e.currentTarget as HTMLElement).style.color = '#d0d7de';
          }}
        >
          <span>ASM LAB</span>
        </button>

        {/* Audio Mute/Unmute Toggle */}
        <button
          onClick={handleToggleMute}
          title={isMuted ? 'Unmute Audio Engine' : 'Mute Audio Engine'}
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: isMuted ? '#6e7681' : '#ff6a00',
            padding: '6px 8px',
            borderRadius: '2px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px'
          }}
        >
          {isMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
          <span>{isMuted ? 'MUTE' : 'AUDIO'}</span>
        </button>

        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px',
            color: '#6e7681',
            padding: '4px 6px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '2px',
            background: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          REV 03
        </div>

        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            color: '#ff6a00',
            fontWeight: 600,
            minWidth: '32px',
            textAlign: 'right'
          }}
        >
          {percent}%
        </div>
      </div>
    </header>
  );
};
