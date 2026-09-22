import React from 'react';
import { EXECUTION_STAGES } from '../../data/cpuData';
import { Cpu, ArrowRight, CheckCircle2, Circle, Radio, Zap } from 'lucide-react';

interface ExecutionTraceOverlayProps {
  currentStageIndex: number;
  isPlaying: boolean;
  scrollProgress: number;
}

export const ExecutionTraceOverlay: React.FC<ExecutionTraceOverlayProps> = ({
  currentStageIndex,
  isPlaying,
  scrollProgress
}) => {
  // Only display when user is in the execution zone (0.65 -> 0.86)
  const isVisible = scrollProgress >= 0.65 && scrollProgress <= 0.86;
  if (!isVisible) return null;

  const currentStage = EXECUTION_STAGES[currentStageIndex];
  const isFinished = currentStageIndex === 4;

  return (
    <div
      style={{
        position: 'fixed',
        top: '84px',
        right: '32px',
        width: '390px',
        maxWidth: 'calc(100vw - 64px)',
        zIndex: 40,
        pointerEvents: 'auto',
        animation: 'fadeIn 0.3s ease-out'
      }}
    >
      <div
        className="tech-panel"
        style={{
          borderRadius: '6px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          borderTop: '3px solid #ff6a00',
          background: 'rgba(10, 12, 16, 0.92)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 20px rgba(255, 106, 0, 0.15)'
        }}
      >
        {/* Header with Live Status Pill */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={16} color="#ff6a00" />
            <span
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.05em',
                color: '#ffffff',
                textTransform: 'uppercase'
              }}
            >
              PHYSICAL EXECUTION TRACE
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 8px',
              borderRadius: '12px',
              background: isPlaying ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.06)',
              border: `1px solid ${isPlaying ? '#38bdf8' : 'rgba(255, 255, 255, 0.12)'}`,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              color: isPlaying ? '#38bdf8' : '#8b949e'
            }}
          >
            {isPlaying ? (
              <>
                <Radio size={10} className="animate-pulse" />
                <span>BUS STREAMING</span>
              </>
            ) : (
              <span>STAGE 0{currentStageIndex + 1} / 05</span>
            )}
          </div>
        </div>

        {/* Current Instruction Banner */}
        <div
          style={{
            background: 'rgba(255, 106, 0, 0.07)',
            border: '1px solid rgba(255, 106, 0, 0.25)',
            borderRadius: '4px',
            padding: '10px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#ff6a00' }}>
              ACTIVE INSTRUCTION
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '15px',
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: '0.02em',
                marginTop: '2px'
              }}
            >
              ADD x3, x1, x2
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#8b949e' }}>
              RV32I R-TYPE
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#38bdf8', fontWeight: 600 }}>
              0x002081B3
            </div>
          </div>
        </div>

        {/* Real-time Physical Pipeline Stages Progression */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {EXECUTION_STAGES.map((st, idx) => {
            const isActive = idx === currentStageIndex;
            const isCompleted = idx < currentStageIndex;
            const isFuture = idx > currentStageIndex;

            return (
              <div
                key={st.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: '4px',
                  background: isActive
                    ? 'rgba(255, 106, 0, 0.12)'
                    : isCompleted
                    ? 'rgba(255, 255, 255, 0.02)'
                    : 'transparent',
                  border: `1px solid ${
                    isActive
                      ? 'rgba(255, 106, 0, 0.4)'
                      : isCompleted
                      ? 'rgba(56, 189, 248, 0.2)'
                      : 'rgba(255, 255, 255, 0.04)'
                  }`,
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Step indicator icon */}
                <div style={{ marginTop: '2px' }}>
                  {isCompleted ? (
                    <CheckCircle2 size={14} color="#38bdf8" />
                  ) : isActive ? (
                    <Zap size={14} color="#ff6a00" className="animate-pulse" />
                  ) : (
                    <Circle size={14} color="#484f58" />
                  )}
                </div>

                {/* Step content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '11px',
                        fontWeight: 600,
                        color: isActive ? '#ff8533' : isCompleted ? '#e6edf3' : '#6e7681'
                      }}
                    >
                      {idx + 1}. {st.id.replace('_', ' ')}
                    </span>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '9px',
                        color: isActive ? '#ff6a00' : isCompleted ? '#38bdf8' : '#484f58',
                        textTransform: 'uppercase'
                      }}
                    >
                      {isActive ? 'ACTIVE BUS' : isCompleted ? 'DONE' : 'PENDING'}
                    </span>
                  </div>

                  {/* Context-sensitive detail per stage */}
                  {isActive && (
                    <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {idx === 0 && (
                        <div
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '10px',
                            color: '#38bdf8',
                            background: 'rgba(56, 189, 248, 0.1)',
                            padding: '4px 8px',
                            borderRadius: '2px'
                          }}
                        >
                          PC (0x0040) ──► MEMORY ──► IR
                        </div>
                      )}

                      {idx === 1 && st.controlSignals && (
                        <div
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '9px',
                            color: '#e6edf3',
                            background: 'rgba(0, 0, 0, 0.5)',
                            padding: '6px 8px',
                            borderRadius: '2px',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '4px'
                          }}
                        >
                          <div><span style={{ color: '#ff8533' }}>OPCODE:</span> 0110011</div>
                          <div><span style={{ color: '#ff8533' }}>FUNCT3:</span> 000</div>
                          <div><span style={{ color: '#38bdf8' }}>RS1/RS2:</span> x1 / x2</div>
                          <div><span style={{ color: '#38bdf8' }}>RD:</span> x3</div>
                          <div style={{ gridColumn: 'span 2' }}>
                            <span style={{ color: '#4ade80' }}>CONTROL:</span> ALUOp=ADD | RegWrite=1
                          </div>
                        </div>
                      )}

                      {idx === 2 && (
                        <div
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '10px',
                            color: '#ffd700',
                            background: 'rgba(255, 215, 0, 0.1)',
                            padding: '4px 8px',
                            borderRadius: '2px',
                            display: 'flex',
                            justifyContent: 'space-between'
                          }}
                        >
                          <span>Port A [x1] = 20</span>
                          <ArrowRight size={12} style={{ alignSelf: 'center' }} />
                          <span>Port B [x2] = 22</span>
                        </div>
                      )}

                      {idx === 3 && (
                        <div
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '10px',
                            color: '#ff6a00',
                            background: 'rgba(255, 106, 0, 0.1)',
                            padding: '4px 8px',
                            borderRadius: '2px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontWeight: 600
                          }}
                        >
                          <span>ALU Computation:</span>
                          <span>20 + 22 = 42</span>
                        </div>
                      )}

                      {idx === 4 && (
                        <div
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: '10px',
                            color: '#4ade80',
                            background: 'rgba(74, 222, 128, 0.12)',
                            border: '1px solid rgba(74, 222, 128, 0.3)',
                            padding: '4px 8px',
                            borderRadius: '2px',
                            fontWeight: 700
                          }}
                        >
                          ✓ COMMITTED: x3 latch: 0 ──► 42
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Register Latches Summary */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '4px',
            padding: '10px 12px',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            textAlign: 'center'
          }}
        >
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#8b949e' }}>x1 (SRC1)</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
              20
            </div>
          </div>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#8b949e' }}>x2 (SRC2)</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
              22
            </div>
          </div>
          <div
            style={{
              background: isFinished ? 'rgba(74, 222, 128, 0.15)' : 'transparent',
              borderRadius: '2px',
              padding: '2px',
              transition: 'background 0.3s ease'
            }}
          >
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#ff6a00' }}>x3 (DEST)</div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '13px',
                fontWeight: 700,
                color: isFinished ? '#4ade80' : '#ffffff'
              }}
            >
              {isFinished ? '42' : '0'}
            </div>
          </div>
        </div>

        {/* Final Completion Banner */}
        {isFinished && (
          <div
            style={{
              padding: '8px 10px',
              borderRadius: '4px',
              background: 'rgba(74, 222, 128, 0.1)',
              border: '1px solid rgba(74, 222, 128, 0.4)',
              color: '#4ade80',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              textAlign: 'center',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <CheckCircle2 size={13} />
            <span>✓ INSTRUCTION COMPLETE: x3 = 42</span>
          </div>
        )}
      </div>
    </div>
  );
};
