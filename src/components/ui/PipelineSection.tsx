import React, { useState } from 'react';
import { SkipForward, Layers, Zap, AlertTriangle, ShieldCheck } from 'lucide-react';
import { audio } from '../../utils/audio';

interface PipelineSectionProps {
  scrollProgress: number;
}

type HazardMode = 'IDEAL' | 'STALL' | 'FORWARDING';

export const PipelineSection: React.FC<PipelineSectionProps> = ({ scrollProgress }) => {
  const isVisible = scrollProgress >= 0.89 && scrollProgress <= 0.98;
  const [hazardMode, setHazardMode] = useState<HazardMode>('FORWARDING');
  const [cycleNum, setCycleNum] = useState<number>(4);

  if (!isVisible) return null;

  const STAGES = ['IF', 'ID', 'EX', 'MEM', 'WB'];

  // Matrix tables depending on hazard mode
  // Ideal: I1: ADD R1, R2, R3 | I2: SUB R4, R5, R6 (Independent)
  // Stall: I1: ADD R1, R2, R3 | I2: SUB R4, R1, R5 (RAW on R1 with 2 stalls)
  // Forwarding: I1: ADD R1, R2, R3 | I2: SUB R4, R1, R5 (RAW on R1, forwarded at cycle 3 from EX/MEM to EX)

  const getStageForInst = (instIdx: number, currentCycle: number) => {
    if (hazardMode === 'IDEAL') {
      const stageIdx = currentCycle - instIdx;
      if (stageIdx < 1 || stageIdx > 5) return '—';
      return STAGES[stageIdx - 1];
    } else if (hazardMode === 'STALL') {
      if (instIdx === 1) {
        const stageIdx = currentCycle;
        if (stageIdx < 1 || stageIdx > 5) return '—';
        return STAGES[stageIdx - 1];
      } else if (instIdx === 2) {
        // I2 stalls at ID during Cycle 3 and 4 waiting for I1 WB at cycle 5
        if (currentCycle === 2) return 'IF';
        if (currentCycle === 3) return 'STALL (NOP)';
        if (currentCycle === 4) return 'STALL (NOP)';
        if (currentCycle === 5) return 'ID';
        if (currentCycle === 6) return 'EX';
        if (currentCycle === 7) return 'MEM';
        if (currentCycle === 8) return 'WB';
        return '—';
      } else {
        if (currentCycle < 5) return '—';
        return STAGES[currentCycle - 5] || '—';
      }
    } else {
      // FORWARDING: I2 fetches cycle 2, decodes cycle 3, executes cycle 4 directly receiving bypass
      const stageIdx = currentCycle - instIdx;
      if (stageIdx < 1 || stageIdx > 5) return '—';
      return STAGES[stageIdx - 1];
    }
  };

  const handleCycleChange = (c: number) => {
    audio.playClockTick();
    setCycleNum(c);
  };

  const handleAdvance = () => {
    audio.playClockTick();
    const maxC = hazardMode === 'STALL' ? 8 : 6;
    setCycleNum((prev) => (prev >= maxC ? 1 : prev + 1));
  };

  const handleModeChange = (mode: HazardMode) => {
    audio.playClick();
    setHazardMode(mode);
    setCycleNum(mode === 'FORWARDING' ? 4 : 3);
  };

  return (
    <div
      style={{
        position: 'fixed',
        left: '40px',
        bottom: '30px',
        width: '640px',
        maxWidth: 'calc(100vw - 80px)',
        zIndex: 40,
        animation: 'fadeIn 0.3s ease-out'
      }}
    >
      <div
        className="tech-panel"
        style={{
          borderRadius: '4px',
          padding: '22px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          borderLeft: '3px solid #ff6a00',
          maxHeight: '84vh',
          overflowY: 'auto'
        }}
      >
        {/* Header */}
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
              SYNCHRONOUS INSTRUCTION PIPELINE & HAZARDS
            </div>
            <h2
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '22px',
                fontWeight: 700,
                color: '#ffffff',
                marginTop: '2px'
              }}
            >
              5-STAGE PIPELINE & FORWARDING UNIT
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
            <Layers size={12} />
            CYCLE 0{cycleNum}
          </div>
        </div>

        {/* Hazard Mode Selector */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px'
          }}
        >
          <button
            onClick={() => handleModeChange('IDEAL')}
            style={{
              padding: '8px',
              background: hazardMode === 'IDEAL' ? '#ff6a00' : 'rgba(255, 255, 255, 0.04)',
              color: hazardMode === 'IDEAL' ? '#000000' : '#ffffff',
              border: hazardMode === 'IDEAL' ? '1px solid #ff6a00' : '1px solid rgba(255, 255, 255, 0.08)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              fontWeight: 600,
              cursor: 'pointer',
              borderRadius: '2px',
              textAlign: 'center'
            }}
          >
            IDEAL (NO HAZARDS)
          </button>

          <button
            onClick={() => handleModeChange('STALL')}
            style={{
              padding: '8px',
              background: hazardMode === 'STALL' ? '#ef4444' : 'rgba(255, 255, 255, 0.04)',
              color: hazardMode === 'STALL' ? '#ffffff' : '#ffffff',
              border: hazardMode === 'STALL' ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.08)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              fontWeight: 600,
              cursor: 'pointer',
              borderRadius: '2px',
              textAlign: 'center'
            }}
          >
            DATA HAZARD (2 STALLS)
          </button>

          <button
            onClick={() => handleModeChange('FORWARDING')}
            style={{
              padding: '8px',
              background: hazardMode === 'FORWARDING' ? '#ff6a00' : 'rgba(255, 255, 255, 0.04)',
              color: hazardMode === 'FORWARDING' ? '#000000' : '#ffffff',
              border: hazardMode === 'FORWARDING' ? '1px solid #ff6a00' : '1px solid rgba(255, 255, 255, 0.08)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              fontWeight: 600,
              cursor: 'pointer',
              borderRadius: '2px',
              textAlign: 'center'
            }}
          >
            WITH FORWARDING (BYPASS)
          </button>
        </div>

        {/* Hazard Explanation Card */}
        <div
          style={{
            padding: '10px 14px',
            background: hazardMode === 'FORWARDING'
              ? 'rgba(34, 197, 94, 0.08)'
              : hazardMode === 'STALL'
              ? 'rgba(239, 68, 68, 0.08)'
              : 'rgba(255, 255, 255, 0.02)',
            border: `1px solid ${
              hazardMode === 'FORWARDING'
                ? 'rgba(34, 197, 94, 0.3)'
                : hazardMode === 'STALL'
                ? 'rgba(239, 68, 68, 0.3)'
                : 'rgba(255, 255, 255, 0.08)'
            }`,
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          {hazardMode === 'FORWARDING' ? (
            <ShieldCheck size={16} color="#4ade80" />
          ) : hazardMode === 'STALL' ? (
            <AlertTriangle size={16} color="#f87171" />
          ) : (
            <Zap size={16} color="#ff6a00" />
          )}

          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#d0d7de', lineHeight: 1.4 }}>
            {hazardMode === 'FORWARDING' && (
              <>
                <strong style={{ color: '#4ade80' }}>FORWARDING ACTIVE:</strong> I1 (`ADD R1, R2, R3`) computes result in EX (Cycle 3). Forwarding multiplexers wire EX/MEM directly to I2 ALU input at Cycle 4, eliminating 2 stall cycles.
              </>
            )}
            {hazardMode === 'STALL' && (
              <>
                <strong style={{ color: '#f87171' }}>RAW HAZARD DETECTED:</strong> I2 (`SUB R4, R1, R5`) requires R1. Without forwarding, the pipeline inserts 2 NOP bubbles until I1 writes back to Register File at Cycle 5.
              </>
            )}
            {hazardMode === 'IDEAL' && (
              <>
                <strong style={{ color: '#ff6a00' }}>IDEAL PIPELINE:</strong> Successive instructions with no data or control dependencies achieve maximum throughput of 1 instruction per clock cycle (CPI = 1.0).
              </>
            )}
          </div>
        </div>

        {/* 3D Timing Matrix Table */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '12px',
            borderRadius: '2px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}
        >
          {/* Header Row: 5 Stages */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '120px repeat(5, 1fr)',
              gap: '6px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              paddingBottom: '6px'
            }}
          >
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#6e7681' }}>
              INSTRUCTION
            </div>
            {STAGES.map((s) => (
              <div
                key={s}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '10px',
                  fontWeight: 600,
                  color: '#ffffff',
                  textAlign: 'center'
                }}
              >
                {s}
              </div>
            ))}
          </div>

          {/* Instructions Rows */}
          {[
            { label: 'I1: ADD R1, R2, R3', id: 1 },
            { label: 'I2: SUB R4, R1, R5', id: 2 },
            { label: 'I3: AND R6, R7, R8', id: 3 }
          ].map((inst) => {
            const currentStage = getStageForInst(inst.id, cycleNum);
            const isStall = currentStage.includes('STALL');

            return (
              <div
                key={inst.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '120px repeat(5, 1fr)',
                  gap: '6px',
                  alignItems: 'center'
                }}
              >
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '10px',
                    color: inst.id === 1 ? '#ff6a00' : '#9aa3af',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  title={inst.label}
                >
                  {inst.label}
                </div>

                {STAGES.map((s) => {
                  const isCellActive = currentStage === s;
                  return (
                    <div
                      key={s}
                      style={{
                        padding: '6px 2px',
                        textAlign: 'center',
                        borderRadius: '2px',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '9px',
                        fontWeight: 600,
                        background: isCellActive
                          ? '#ff6a00'
                          : isStall && s === 'ID'
                          ? '#ef4444'
                          : 'rgba(255, 255, 255, 0.02)',
                        color: isCellActive
                          ? '#000000'
                          : isStall && s === 'ID'
                          ? '#ffffff'
                          : 'rgba(255, 255, 255, 0.2)',
                        border: `1px solid ${
                          isCellActive
                            ? '#ff6a00'
                            : isStall && s === 'ID'
                            ? '#ef4444'
                            : 'rgba(255, 255, 255, 0.05)'
                        }`,
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {isCellActive ? s : isStall && s === 'ID' ? 'NOP' : '—'}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Forwarding Bypass Banner (when active) */}
        {hazardMode === 'FORWARDING' && (
          <div
            style={{
              padding: '6px 10px',
              background: 'rgba(255, 106, 0, 0.06)',
              border: '1px dashed #ff6a00',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px'
            }}
          >
            <span style={{ color: '#8b949e' }}>HARDWARE BYPASS BUS:</span>
            <span style={{ color: '#ff6a00', fontWeight: 600 }}>
              EX/MEM.ALUOut ──► ALU.MuxInputB (0 Stalls)
            </span>
          </div>
        )}

        {/* Cycle Step Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            {[1, 2, 3, 4, 5, 6].map((c) => (
              <button
                key={c}
                onClick={() => handleCycleChange(c)}
                style={{
                  background: c === cycleNum ? '#ff6a00' : 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${c === cycleNum ? '#ff6a00' : 'rgba(255, 255, 255, 0.08)'}`,
                  color: c === cycleNum ? '#000000' : '#ffffff',
                  padding: '6px 10px',
                  borderRadius: '2px',
                  cursor: 'pointer',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '10px',
                  fontWeight: 600
                }}
              >
                C{c}
              </button>
            ))}
          </div>

          <button
            onClick={handleAdvance}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '10px' }}
          >
            <SkipForward size={11} />
            <span>ADVANCE CLOCK</span>
          </button>
        </div>
      </div>
    </div>
  );
};
