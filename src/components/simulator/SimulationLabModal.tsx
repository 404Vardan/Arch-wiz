import React, { useState, useEffect, useRef } from 'react';
import { cpuEngine, EngineState } from '../../engine/CPUExecutionEngine';
import { SimulatorScene } from './SimulatorScene';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  X,
  Cpu,
  Activity,
  CheckCircle2,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { audio } from '../../utils/audio';

interface SimulationLabModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SimulationLabModal: React.FC<SimulationLabModalProps> = ({
  isOpen,
  onClose
}) => {
  const [engineState, setEngineState] = useState<EngineState>(cpuEngine.getState());
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Subscribe to pure CPUExecutionEngine updates
  useEffect(() => {
    const unsubscribe = cpuEngine.subscribe((state) => {
      setEngineState(state);
    });
    return unsubscribe;
  }, []);

  // Autoplay loop with audio effects
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setEngineState((prev) => {
        if (prev.stageIndex >= 4) {
          setIsPlaying(false);
          audio.playAluChime();
          return prev;
        }
        audio.playStep();
        if (prev.stageIndex + 1 === 3) {
          audio.playAluChime();
        }
        cpuEngine.step();
        return cpuEngine.getState();
      });
    }, 2200);

    return () => clearInterval(timer);
  }, [isPlaying]);

  if (!isOpen) return null;

  const stageNames = [
    { id: 'FETCH', num: '01', name: 'FETCH' },
    { id: 'DECODE', num: '02', name: 'DECODE' },
    { id: 'REGISTER_READ', num: '03', name: 'REG READ' },
    { id: 'EXECUTE', num: '04', name: 'EXECUTE' },
    { id: 'WRITE_BACK', num: '05', name: 'WRITEBACK' }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: '#090b0f',
        display: 'flex',
        flexDirection: 'column',
        userSelect: 'none',
        overflow: 'hidden'
      }}
    >
      {/* 1. Technical Top Navigation Bar */}
      <header
        style={{
          height: '60px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(13, 16, 23, 0.95)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          zIndex: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#ff6a00',
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '15px',
              fontWeight: 700,
              letterSpacing: '0.05em'
            }}
          >
            <Cpu size={18} />
            <span>ARCH-VIZ // CPU SIMULATION LAB</span>
          </div>

          <div
            style={{
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '2px',
              padding: '3px 8px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              color: '#38bdf8',
              fontWeight: 600
            }}
          >
            RV32I STANDALONE DATAPATH
          </div>
        </div>

        {/* Active Instruction Pill */}
        <div
          style={{
            background: 'rgba(255, 106, 0, 0.1)',
            border: '1px solid rgba(255, 106, 0, 0.4)',
            borderRadius: '4px',
            padding: '5px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#ff8533' }}>
            INSTRUCTION:
          </span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
            ADD x3, x1, x2
          </span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#38bdf8' }}>
            (0x002081B3)
          </span>
        </div>

        {/* Close Button */}
        <button
          onClick={() => {
            audio.playClick();
            setIsPlaying(false);
            onClose();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '4px',
            color: '#e6edf3',
            padding: '6px 14px',
            cursor: 'pointer',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            fontWeight: 600,
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
        >
          <X size={14} />
          <span>EXIT LAB</span>
        </button>
      </header>

      {/* 2. Main 3D Simulation Viewport */}
      <div style={{ flex: 1, position: 'relative', width: '100%' }}>
        <SimulatorScene engineState={engineState} isPlaying={isPlaying} />
      </div>

      {/* 3. Bottom Execution HUD & Controls */}
      <footer
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(13, 16, 23, 0.95)',
          backdropFilter: 'blur(16px)',
          padding: '16px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          zIndex: 10
        }}
      >
        {/* 5-Stage Stepper Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '8px'
          }}
        >
          {stageNames.map((st, idx) => {
            const isActive = idx === engineState.stageIndex;
            const isDone = idx < engineState.stageIndex;

            return (
              <button
                key={st.id}
                onClick={() => {
                  audio.playStep();
                  if (idx === 3) audio.playAluChime();
                  setIsPlaying(false);
                  cpuEngine.setStage(idx);
                }}
                style={{
                  background: isActive
                    ? 'rgba(255, 106, 0, 0.2)'
                    : isDone
                    ? 'rgba(56, 189, 248, 0.1)'
                    : 'rgba(255, 255, 255, 0.03)',
                  border: `1.5px solid ${
                    isActive
                      ? '#ff6a00'
                      : isDone
                      ? 'rgba(56, 189, 248, 0.4)'
                      : 'rgba(255, 255, 255, 0.08)'
                  }`,
                  borderRadius: '4px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '10px',
                      color: isActive ? '#ff6a00' : isDone ? '#38bdf8' : '#64748b'
                    }}
                  >
                    {st.num}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: '12px',
                      fontWeight: 700,
                      color: isActive ? '#ffffff' : isDone ? '#e6edf3' : '#8b949e'
                    }}
                  >
                    {st.name}
                  </span>
                </div>
                {isDone ? (
                  <CheckCircle2 size={13} color="#38bdf8" />
                ) : isActive ? (
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#ff6a00',
                      boxShadow: '0 0 8px #ff6a00'
                    }}
                  />
                ) : (
                  <span style={{ fontSize: '10px', color: '#475569' }}>○</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Execution Micro-operations & Control Buttons Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Controls: Play/Pause, Step, Reset */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                audio.playClick();
                setIsPlaying(!isPlaying);
              }}
              style={{
                background: '#ff6a00',
                border: 'none',
                borderRadius: '4px',
                color: '#000000',
                padding: '8px 18px',
                cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {isPlaying ? <Pause size={13} /> : <Play size={13} />}
              <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
            </button>

            <button
              onClick={() => {
                audio.playStep();
                if ((engineState.stageIndex + 1) % 5 === 3) audio.playAluChime();
                setIsPlaying(false);
                cpuEngine.step();
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '4px',
                color: '#ffffff',
                padding: '8px 14px',
                cursor: 'pointer',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <SkipForward size={13} />
              <span>STEP</span>
            </button>

            <button
              onClick={() => {
                audio.playClick();
                setIsPlaying(false);
                cpuEngine.reset();
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '4px',
                color: '#ffffff',
                padding: '8px 12px',
                cursor: 'pointer'
              }}
              title="Reset to Fetch"
            >
              <RotateCcw size={13} />
            </button>
          </div>

          {/* Active Micro-operations Ticker */}
          <div
            style={{
              flex: 1,
              maxWidth: '650px',
              margin: '0 20px',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '4px',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <Activity size={13} color="#ff6a00" />
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                color: '#cbd5e1',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {engineState.activeMicroOps.join('  //  ')}
            </div>
          </div>

          {/* Status pill */}
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              color: engineState.isComplete ? '#4ade80' : '#ff8533',
              fontWeight: 600
            }}
          >
            {engineState.isComplete
              ? '✓ INSTRUCTION COMPLETE: x3 = 42'
              : `CYCLE 0${engineState.stageIndex + 1} // ${engineState.currentStage}`}
          </div>
        </div>
      </footer>
    </div>
  );
};
