import React from 'react';
import { Play, Pause, SkipForward, RotateCcw, Activity } from 'lucide-react';
import { EXECUTION_STAGES } from '../../data/cpuData';
import { audio } from '../../utils/audio';

interface ExecutionSectionProps {
  currentStageIndex: number;
  isPlaying: boolean;
  onPlayToggle: () => void;
  onStep: () => void;
  onReset: () => void;
  onSelectStage: (index: number) => void;
  scrollProgress: number;
}

export const ExecutionSection: React.FC<ExecutionSectionProps> = ({
  currentStageIndex,
  isPlaying,
  onPlayToggle,
  onStep,
  onReset,
  onSelectStage,
  scrollProgress
}) => {
  // Only show when in execution scroll zone (0.68 -> 0.85) or when manually active
  const isVisible = scrollProgress >= 0.65 && scrollProgress <= 0.86;
  const currentStage = EXECUTION_STAGES[currentStageIndex];

  if (!isVisible) return null;

  const isCompleted = currentStageIndex === EXECUTION_STAGES.length - 1;

  return (
    <div
      style={{
        position: 'fixed',
        left: '40px',
        bottom: '40px',
        width: '520px',
        maxWidth: 'calc(100vw - 80px)',
        zIndex: 40,
        animation: 'fadeIn 0.3s ease-out'
      }}
    >
      <div
        className="tech-panel"
        style={{
          borderRadius: '4px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          borderLeft: '3px solid #ff6a00'
        }}
      >
        {/* Section Eyebrow & Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px',
                letterSpacing: '0.12em',
                color: '#ff6a00',
                textTransform: 'uppercase'
              }}
            >
              ONE INSTRUCTION. FIVE STAGES.
            </div>
            <h2
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '24px',
                fontWeight: 700,
                color: '#ffffff',
                marginTop: '4px'
              }}
            >
              ADD R1, R2
            </h2>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              background: 'rgba(255, 106, 0, 0.1)',
              border: '1px solid rgba(255, 106, 0, 0.3)',
              borderRadius: '2px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              color: '#ff6a00'
            }}
          >
            <Activity size={12} />
            STAGE {currentStage.number} / 05
          </div>
        </div>

        {/* 5-Stage Stepper Buttons */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '4px'
          }}
        >
          {EXECUTION_STAGES.map((st, i) => {
            const isActive = i === currentStageIndex;
            const isPast = i < currentStageIndex;
            return (
              <button
                key={st.id}
                onClick={() => {
                  audio.playStep();
                  if (i === 3) audio.playAluChime();
                  onSelectStage(i);
                }}
                style={{
                  background: isActive
                    ? '#ff6a00'
                    : isPast
                    ? 'rgba(255, 106, 0, 0.2)'
                    : 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${
                    isActive
                      ? '#ff6a00'
                      : isPast
                      ? 'rgba(255, 106, 0, 0.4)'
                      : 'rgba(255, 255, 255, 0.08)'
                  }`,
                  color: isActive ? '#000000' : isPast ? '#ff8533' : '#8b949e',
                  padding: '8px 2px',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '9px',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  textAlign: 'center',
                  transition: 'all 0.15s ease'
                }}
              >
                {st.id.replace('_', ' ')}
              </button>
            );
          })}
        </div>

        {/* Current Stage Description & Datapath route */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '12px 14px',
            borderRadius: '2px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
        >
          <div
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '13px',
              fontWeight: 600,
              color: '#ffffff'
            }}
          >
            {currentStage.title}
          </div>
          <div
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '12px',
              lineHeight: 1.5,
              color: '#8b949e'
            }}
          >
            {currentStage.description}
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              color: '#ff6a00',
              marginTop: '4px'
            }}
          >
            Route: {currentStage.dataFlowDescription}
          </div>
        </div>

        {/* Live Datapath & Register State Table */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px'
          }}
        >
          <div
            style={{
              background: 'rgba(0,0,0,0.3)',
              padding: '8px 10px',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '2px'
            }}
          >
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#6e7681' }}>
              R1 (SRC 1)
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '14px',
                fontWeight: 600,
                color: '#ffffff',
                marginTop: '2px'
              }}
            >
              {currentStage.cpuState.r1}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(0,0,0,0.3)',
              padding: '8px 10px',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '2px'
            }}
          >
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#6e7681' }}>
              R2 (SRC 2)
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '14px',
                fontWeight: 600,
                color: '#ffffff',
                marginTop: '2px'
              }}
            >
              {currentStage.cpuState.r2}
            </div>
          </div>

          <div
            style={{
              background: 'rgba(0,0,0,0.3)',
              padding: '8px 10px',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '2px'
            }}
          >
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#6e7681' }}>
              ALU OP
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '12px',
                fontWeight: 600,
                color: currentStage.cpuState.aluResult !== null ? '#ff6a00' : '#8b949e',
                marginTop: '2px'
              }}
            >
              {currentStage.cpuState.aluOp}
            </div>
          </div>

          <div
            style={{
              background: isCompleted ? 'rgba(255, 106, 0, 0.15)' : 'rgba(0,0,0,0.3)',
              border: `1px solid ${isCompleted ? '#ff6a00' : 'rgba(255,255,255,0.06)'}`,
              padding: '8px 10px',
              borderRadius: '2px'
            }}
          >
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#ff6a00' }}>
              R3 (DEST)
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '14px',
                fontWeight: 700,
                color: currentStage.cpuState.r3 === 42 ? '#ff6a00' : '#ffffff',
                marginTop: '2px'
              }}
            >
              {currentStage.cpuState.r3}
            </div>
          </div>
        </div>

        {/* Micro-Operations Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#8b949e'
            }}
          >
            ACTIVE MICRO-OPERATIONS
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {currentStage.microOps.map((op, idx) => (
              <span
                key={idx}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '10px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  padding: '3px 8px',
                  borderRadius: '2px',
                  color: '#e6edf3'
                }}
              >
                {op}
              </span>
            ))}
          </div>
        </div>

        {/* Playback Controls & Professional Engineering Status Readout */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '14px'
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                audio.playClick();
                onPlayToggle();
              }}
              className="btn-primary"
              style={{ padding: '8px 16px', fontSize: '11px' }}
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} />}
              <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
            </button>

            <button
              onClick={() => {
                audio.playStep();
                if ((currentStageIndex + 1) % EXECUTION_STAGES.length === 3) {
                  audio.playAluChime();
                }
                onStep();
              }}
              className="btn-secondary"
              style={{ padding: '8px 14px', fontSize: '11px' }}
              title="Step to next stage"
            >
              <SkipForward size={12} />
              <span>STEP</span>
            </button>

            <button
              onClick={() => {
                audio.playClick();
                onReset();
              }}
              className="btn-secondary"
              style={{ padding: '8px 12px', fontSize: '11px' }}
              title="Reset to Fetch stage"
            >
              <RotateCcw size={12} />
            </button>
          </div>

          {/* Engineering Status Readout */}
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              color: isCompleted ? '#ff6a00' : '#8b949e',
              fontWeight: isCompleted ? 600 : 400
            }}
          >
            {isCompleted ? 'EXECUTION COMPLETE // R3 ← 42 // CYCLE 05' : `CYCLE 0${currentStageIndex + 1}`}
          </div>
        </div>
      </div>
    </div>
  );
};
