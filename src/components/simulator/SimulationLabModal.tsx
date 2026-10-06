import React, { useState, useEffect, useRef } from 'react';
import { cpuEngine, EngineState } from '../../engine/CPUExecutionEngine';
import { CPU_COMPONENTS } from '../../data/cpuData';
import { ComponentId } from '../../types';
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
  ListOrdered,
  Info,
  Layers,
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
  const [isTraceOpen, setIsTraceOpen] = useState<boolean>(false);
  const [inspectedComponent, setInspectedComponent] = useState<ComponentId | null>(null);

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
      const current = cpuEngine.getState();
      if (current.stageIndex >= 4) {
        setIsPlaying(false);
        audio.playAluChime();
        return;
      }
      audio.playStep();
      if (current.stageIndex + 1 === 3) {
        audio.playAluChime();
      }
      cpuEngine.step();
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

  // Chronological execution trace steps for ADD x3, x1, x2
  const traceItems = [
    {
      stage: 0,
      title: '01 FETCH',
      lines: [
        'PC (0x0040) → Address Bus',
        'Memory read: M[0x0040]',
        'Instruction word: 0x002081B3 → IR',
        'x3 = 0 | ALU Standby'
      ]
    },
    {
      stage: 1,
      title: '02 DECODE',
      lines: [
        'IR → Control Unit (Op: 0110011)',
        'RV32I R-Type: funct3=000, funct7=00',
        'Identified: rs1=x1, rs2=x2, rd=x3',
        'Asserted: ALUOp=ADD, RegWrite=1'
      ]
    },
    {
      stage: 2,
      title: '03 REG READ',
      lines: [
        'Register File read: x1 = 20',
        'Register File read: x2 = 22',
        'Dual operands → ALU input latches',
        'x3 remains 0 (pending execute)'
      ]
    },
    {
      stage: 3,
      title: '04 EXECUTE',
      lines: [
        'ALU receives: A = 20, B = 22',
        '32-bit Parallel Adder: 20 + 22 = 42',
        'Derived Status: Z=0, N=0, C=0, V=0',
        'Result 42 dispatched to WB Bus'
      ]
    },
    {
      stage: 4,
      title: '05 WRITE BACK',
      lines: [
        'WB Bus (42) → Register File Write Port',
        'RegWrite asserted for rd = x3',
        'x3 latched: 0 ──► 42',
        '✓ INSTRUCTION COMPLETE: x3 = 42'
      ]
    }
  ];

  const compData = inspectedComponent ? CPU_COMPONENTS[inspectedComponent] : null;

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
          height: '52px',
          minHeight: '52px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(13, 16, 23, 0.95)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'nowrap',
          gap: '12px',
          padding: '0 20px',
          zIndex: 20,
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#ff6a00',
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '14px',
              fontWeight: 700,
              letterSpacing: '0.05em'
            }}
          >
            <Cpu size={17} />
            <span>ARCH-VIZ // CPU SIMULATION LAB</span>
          </div>

          <div
            style={{
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '2px',
              padding: '2px 8px',
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
            padding: '4px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexShrink: 0
          }}
        >
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#ff8533' }}>
            INSTRUCTION:
          </span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
            ADD x3, x1, x2
          </span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#38bdf8' }}>
            (0x002081B3)
          </span>
        </div>

        {/* Header Action Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Execution Trace Toggle Button */}
          <button
            onClick={() => {
              audio.playClick();
              setIsTraceOpen(!isTraceOpen);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              background: isTraceOpen ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.06)',
              border: `1px solid ${isTraceOpen ? '#38bdf8' : 'rgba(255, 255, 255, 0.15)'}`,
              borderRadius: '4px',
              color: isTraceOpen ? '#38bdf8' : '#e6edf3',
              padding: '5px 10px',
              cursor: 'pointer',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              fontWeight: 600,
              transition: 'all 0.15s ease'
            }}
            title="Toggle Execution Trace Panel"
          >
            <ListOrdered size={13} />
            <span>TRACE</span>
          </button>

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
              padding: '5px 12px',
              cursor: 'pointer',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              fontWeight: 600,
              flexShrink: 0,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
          >
            <X size={13} />
            <span>EXIT LAB</span>
          </button>
        </div>
      </header>

      {/* 2. Main 3D Simulation Viewport */}
      <div style={{ flex: 1, position: 'relative', width: '100%', minHeight: 0 }}>
        <SimulatorScene
          engineState={engineState}
          isPlaying={isPlaying}
          onInspectComponent={(id) => setInspectedComponent(id)}
        />

        {/* Compact Collapsible Execution Trace Sidebar (Part 20) */}
        {isTraceOpen && (
          <aside
            style={{
              position: 'absolute',
              top: '12px',
              left: '16px',
              width: '270px',
              maxHeight: 'calc(100% - 24px)',
              background: 'rgba(10, 13, 20, 0.94)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '6px',
              backdropFilter: 'blur(16px)',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              zIndex: 30,
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ListOrdered size={14} color="#38bdf8" />
                <span
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#ffffff'
                  }}
                >
                  EXECUTION TRACE
                </span>
              </div>
              <button
                onClick={() => setIsTraceOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '2px'
                }}
              >
                <X size={13} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {traceItems.map((item) => {
                const isActive = item.stage === engineState.stageIndex;
                const isPast = item.stage <= engineState.stageIndex;

                return (
                  <div
                    key={item.title}
                    style={{
                      background: isActive
                        ? 'rgba(255, 106, 0, 0.12)'
                        : isPast
                        ? 'rgba(56, 189, 248, 0.05)'
                        : 'rgba(255, 255, 255, 0.02)',
                      borderLeft: `2.5px solid ${
                        isActive ? '#ff6a00' : isPast ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)'
                      }`,
                      padding: '5px 8px',
                      borderRadius: '0 3px 3px 0'
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: '10px',
                        fontWeight: 700,
                        color: isActive ? '#ff6a00' : isPast ? '#38bdf8' : '#64748b',
                        marginBottom: '3px'
                      }}
                    >
                      {item.title} {isActive && '● ACTIVE'}
                    </div>
                    {item.lines.map((l, i) => (
                      <div
                        key={i}
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: '9px',
                          color: isPast ? '#cbd5e1' : '#475569',
                          lineHeight: '1.3'
                        }}
                      >
                        {l}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </aside>
        )}

        {/* Compact Component Inspector Drawer (Part 30) */}
        {compData && (
          <aside
            style={{
              position: 'absolute',
              top: '12px',
              right: '16px',
              width: '290px',
              maxHeight: 'calc(100% - 24px)',
              background: 'rgba(10, 13, 20, 0.95)',
              border: '1px solid rgba(255, 106, 0, 0.4)',
              borderRadius: '6px',
              backdropFilter: 'blur(16px)',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              zIndex: 30,
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '9px',
                    color: '#ff6a00',
                    fontWeight: 600,
                    textTransform: 'uppercase'
                  }}
                >
                  {compData.category}
                </div>
                <div
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '15px',
                    fontWeight: 700,
                    color: '#ffffff'
                  }}
                >
                  {compData.name}
                </div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '10px',
                    color: '#94a3b8'
                  }}
                >
                  {compData.fullName}
                </div>
              </div>
              <button
                onClick={() => setInspectedComponent(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '2px'
                }}
              >
                <X size={14} />
              </button>
            </div>

            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '11px',
                color: '#cbd5e1',
                lineHeight: '1.4',
                margin: 0
              }}
            >
              {compData.description}
            </p>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '8px' }}>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '9px',
                  color: '#ff8533',
                  fontWeight: 600,
                  marginBottom: '6px'
                }}
              >
                HARDWARE SPECIFICATIONS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {compData.techSpecs.map((spec, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '9px'
                    }}
                  >
                    <span style={{ color: '#8b949e' }}>{spec.label}:</span>
                    <span style={{ color: '#ffffff', fontWeight: 600 }}>{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* 3. Bottom Execution HUD & Controls */}
      <footer
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(13, 16, 23, 0.95)',
          backdropFilter: 'blur(16px)',
          padding: '14px 24px',
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
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
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
                  minWidth: 0,
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
                  padding: '8px 10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, overflow: 'hidden' }}>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '10px',
                      color: isActive ? '#ff6a00' : isDone ? '#38bdf8' : '#64748b',
                      flexShrink: 0
                    }}
                  >
                    {st.num}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: '11px',
                      fontWeight: 700,
                      color: isActive ? '#ffffff' : isDone ? '#e6edf3' : '#8b949e',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {st.name}
                  </span>
                </div>
                {isDone ? (
                  <CheckCircle2 size={13} color="#38bdf8" style={{ flexShrink: 0 }} />
                ) : isActive ? (
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: '#ff6a00',
                      boxShadow: '0 0 8px #ff6a00',
                      flexShrink: 0
                    }}
                  />
                ) : (
                  <span style={{ fontSize: '10px', color: '#475569', flexShrink: 0 }}>○</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Execution Micro-operations & Control Buttons Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          {/* Controls: Play/Pause, Step, Reset */}
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={() => {
                audio.playClick();
                if (!isPlaying && engineState.stageIndex >= 4) {
                  cpuEngine.reset();
                }
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
              minWidth: '220px',
              maxWidth: '650px',
              margin: '0',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '4px',
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <Activity size={13} color="#ff6a00" style={{ flexShrink: 0 }} />
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
              fontWeight: 600,
              flexShrink: 0
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
