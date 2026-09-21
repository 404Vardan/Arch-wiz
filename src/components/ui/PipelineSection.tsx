import React, { useState } from 'react';
import { SkipForward, Layers, Zap, AlertTriangle, ShieldCheck, GitBranch, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { audio } from '../../utils/audio';

interface PipelineSectionProps {
  scrollProgress: number;
}

type PipelineTab = 'DATA_HAZARDS' | 'BRANCH_PREDICTOR';
type HazardMode = 'IDEAL' | 'STALL' | 'FORWARDING';

// 2-Bit Saturating Branch Predictor States
// 0: Strongly Not Taken (00)
// 1: Weakly Not Taken (01)
// 2: Weakly Taken (10)
// 3: Strongly Taken (11)
type BranchState = 0 | 1 | 2 | 3;

interface BranchHistoryItem {
  id: number;
  fromState: BranchState;
  toState: BranchState;
  action: 'TAKEN' | 'NOT_TAKEN';
  predicted: 'TAKEN' | 'NOT_TAKEN';
  hit: boolean;
}

export const PipelineSection: React.FC<PipelineSectionProps> = ({ scrollProgress }) => {
  const isVisible = scrollProgress >= 0.89 && scrollProgress <= 0.98;
  const [activeTab, setActiveTab] = useState<PipelineTab>('DATA_HAZARDS');
  const [hazardMode, setHazardMode] = useState<HazardMode>('FORWARDING');
  const [cycleNum, setCycleNum] = useState<number>(4);

  // Branch Predictor State
  const [branchState, setBranchState] = useState<BranchState>(3); // Default Strongly Taken (11) typical in loops
  const [branchHistory, setBranchHistory] = useState<BranchHistoryItem[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    hits: 0,
    flushes: 0,
    cyclesPenalized: 0
  });

  if (!isVisible) return null;

  const STAGES = ['IF', 'ID', 'EX', 'MEM', 'WB'];

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

  // Branch Predictor Logic
  const getPrediction = (state: BranchState): 'TAKEN' | 'NOT_TAKEN' => {
    return state >= 2 ? 'TAKEN' : 'NOT_TAKEN';
  };

  const executeBranch = (outcome: 'TAKEN' | 'NOT_TAKEN') => {
    const predicted = getPrediction(branchState);
    const isHit = predicted === outcome;

    if (isHit) {
      audio.playCacheHit();
    } else {
      audio.playCacheMiss();
    }

    let nextState: BranchState = branchState;
    if (outcome === 'TAKEN') {
      nextState = Math.min(3, branchState + 1) as BranchState;
    } else {
      nextState = Math.max(0, branchState - 1) as BranchState;
    }

    setBranchState(nextState);
    setStats((prev) => ({
      total: prev.total + 1,
      hits: prev.hits + (isHit ? 1 : 0),
      flushes: prev.flushes + (isHit ? 0 : 1),
      cyclesPenalized: prev.cyclesPenalized + (isHit ? 0 : 2)
    }));

    setBranchHistory((prev) => [
      {
        id: Date.now(),
        fromState: branchState,
        toState: nextState,
        action: outcome,
        predicted,
        hit: isHit
      },
      ...prev.slice(0, 4)
    ]);
  };

  const resetBranchPredictor = () => {
    audio.playClick();
    setBranchState(3);
    setStats({ total: 0, hits: 0, flushes: 0, cyclesPenalized: 0 });
    setBranchHistory([]);
  };

  const stateLabels = [
    { code: '00', name: 'STRONGLY NOT TAKEN', short: 'SNT', color: '#ef4444' },
    { code: '01', name: 'WEAKLY NOT TAKEN', short: 'WNT', color: '#f59e0b' },
    { code: '10', name: 'WEAKLY TAKEN', short: 'WT', color: '#38bdf8' },
    { code: '11', name: 'STRONGLY TAKEN', short: 'ST', color: '#22c55e' }
  ];

  return (
    <div
      style={{
        position: 'fixed',
        left: '40px',
        bottom: '30px',
        width: '660px',
        maxWidth: 'calc(100vw - 80px)',
        zIndex: 40,
        animation: 'fadeIn 0.3s ease-out'
      }}
    >
      <div
        className="tech-panel"
        style={{
          borderRadius: '4px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          borderLeft: '3px solid #ff6a00',
          maxHeight: '86vh',
          overflowY: 'auto'
        }}
      >
        {/* Top Tab Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '10px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                audio.playClick();
                setActiveTab('DATA_HAZARDS');
              }}
              style={{
                padding: '6px 12px',
                background: activeTab === 'DATA_HAZARDS' ? 'rgba(255, 106, 0, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${activeTab === 'DATA_HAZARDS' ? '#ff6a00' : 'rgba(255, 255, 255, 0.08)'}`,
                color: activeTab === 'DATA_HAZARDS' ? '#ff6a00' : '#8b949e',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px',
                fontWeight: 600,
                cursor: 'pointer',
                borderRadius: '2px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Layers size={12} />
              DATA HAZARDS & FORWARDING
            </button>

            <button
              onClick={() => {
                audio.playClick();
                setActiveTab('BRANCH_PREDICTOR');
              }}
              style={{
                padding: '6px 12px',
                background: activeTab === 'BRANCH_PREDICTOR' ? 'rgba(255, 106, 0, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${activeTab === 'BRANCH_PREDICTOR' ? '#ff6a00' : 'rgba(255, 255, 255, 0.08)'}`,
                color: activeTab === 'BRANCH_PREDICTOR' ? '#ff6a00' : '#8b949e',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px',
                fontWeight: 600,
                cursor: 'pointer',
                borderRadius: '2px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <GitBranch size={12} />
              2-BIT BRANCH PREDICTOR
            </button>
          </div>

          <div
            style={{
              padding: '4px 8px',
              background: 'rgba(255, 106, 0, 0.1)',
              border: '1px solid rgba(255, 106, 0, 0.3)',
              borderRadius: '2px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              color: '#ff6a00'
            }}
          >
            {activeTab === 'DATA_HAZARDS' ? `CYCLE 0${cycleNum}` : `2-BIT FSM`}
          </div>
        </div>

        {/* TAB 1: DATA HAZARDS & FORWARDING */}
        {activeTab === 'DATA_HAZARDS' && (
          <>
            <div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '9px',
                  letterSpacing: '0.12em',
                  color: '#ff6a00',
                  textTransform: 'uppercase'
                }}
              >
                DATA DEPENDENCY RESOLUTION
              </div>
              <h2
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#ffffff',
                  marginTop: '1px'
                }}
              >
                5-STAGE PIPELINE & FORWARDING UNIT
              </h2>
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
                  padding: '7px',
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
                  padding: '7px',
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
                  padding: '7px',
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
                padding: '8px 12px',
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
                gap: '8px'
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
                padding: '10px 12px',
                borderRadius: '2px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '120px repeat(5, 1fr)',
                  gap: '6px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  paddingBottom: '4px'
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
                            padding: '5px 2px',
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
                      padding: '5px 9px',
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
          </>
        )}

        {/* TAB 2: 2-BIT SATURATING BRANCH PREDICTOR */}
        {activeTab === 'BRANCH_PREDICTOR' && (
          <>
            <div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '9px',
                  letterSpacing: '0.12em',
                  color: '#ff6a00',
                  textTransform: 'uppercase'
                }}
              >
                CONTROL HAZARD & SPECULATIVE EXECUTION
              </div>
              <h2
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#ffffff',
                  marginTop: '1px'
                }}
              >
                2-BIT SATURATING COUNTER PREDICTOR (FSM)
              </h2>
            </div>

            {/* 4-State Visual FSM Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px'
              }}
            >
              {stateLabels.map((st, idx) => {
                const isActive = branchState === idx;
                const isPredictTaken = idx >= 2;

                return (
                  <div
                    key={st.code}
                    style={{
                      padding: '10px 8px',
                      borderRadius: '3px',
                      background: isActive
                        ? 'rgba(255, 106, 0, 0.16)'
                        : 'rgba(255, 255, 255, 0.02)',
                      border: isActive
                        ? '2px solid #ff6a00'
                        : '1px solid rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: isActive ? '0 0 15px rgba(255, 106, 0, 0.3)' : 'none',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                  >
                    {isActive && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '-8px',
                          background: '#ff6a00',
                          color: '#000000',
                          fontSize: '8px',
                          fontWeight: 800,
                          padding: '1px 5px',
                          borderRadius: '2px',
                          fontFamily: "'JetBrains Mono', monospace"
                        }}
                      >
                        CURRENT
                      </span>
                    )}

                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '14px',
                        fontWeight: 700,
                        color: isActive ? '#ff6a00' : '#6e7681'
                      }}
                    >
                      {st.code}
                    </span>

                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '9px',
                        fontWeight: 600,
                        color: st.color,
                        textAlign: 'center',
                        lineHeight: 1.2
                      }}
                    >
                      {st.short}
                    </span>

                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '9px',
                        color: isPredictTaken ? '#4ade80' : '#9ca3af',
                        marginTop: '2px',
                        fontWeight: 500
                      }}
                    >
                      {isPredictTaken ? '► PREDICT TAKEN' : '► PREDICT NOT'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Current Prediction Status Banner */}
            <div
              style={{
                padding: '10px 14px',
                background: getPrediction(branchState) === 'TAKEN'
                  ? 'rgba(56, 189, 248, 0.08)'
                  : 'rgba(245, 158, 11, 0.08)',
                border: `1px solid ${
                  getPrediction(branchState) === 'TAKEN'
                    ? 'rgba(56, 189, 248, 0.3)'
                    : 'rgba(245, 158, 11, 0.3)'
                }`,
                borderRadius: '2px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#8b949e' }}>
                  ACTIVE HARDWARE PREDICTION:{' '}
                </span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '11px',
                    fontWeight: 700,
                    color: getPrediction(branchState) === 'TAKEN' ? '#38bdf8' : '#fbbf24'
                  }}
                >
                  {getPrediction(branchState)} (STATE {branchState} - {stateLabels[branchState].short})
                </span>
              </div>

              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#6e7681' }}>
                Hysteresis protects loop exit blips
              </span>
            </div>

            {/* Branch Execution Action Buttons */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px' }}>
              <button
                onClick={() => executeBranch('TAKEN')}
                style={{
                  padding: '9px 12px',
                  background: 'rgba(34, 197, 94, 0.15)',
                  border: '1px solid #22c55e',
                  color: '#4ade80',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  borderRadius: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <CheckCircle2 size={13} />
                SIMULATE TAKEN (T)
              </button>

              <button
                onClick={() => executeBranch('NOT_TAKEN')}
                style={{
                  padding: '9px 12px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #ef4444',
                  color: '#f87171',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  borderRadius: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <XCircle size={13} />
                SIMULATE NOT TAKEN (NT)
              </button>

              <button
                onClick={resetBranchPredictor}
                style={{
                  padding: '9px 12px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#8b949e',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '11px',
                  cursor: 'pointer',
                  borderRadius: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Reset Predictor Stats & FSM"
              >
                <RefreshCw size={12} />
                RESET
              </button>
            </div>

            {/* Performance Stats & Pipeline Impact */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '6px',
                background: 'rgba(0, 0, 0, 0.25)',
                padding: '8px',
                borderRadius: '2px',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}
            >
              <div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#6e7681' }}>TOTAL BRANCHES</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', fontWeight: 700, color: '#ffffff' }}>
                  {stats.total}
                </div>
              </div>

              <div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#6e7681' }}>PREDICTION HITS</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', fontWeight: 700, color: '#4ade80' }}>
                  {stats.hits}
                </div>
              </div>

              <div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#6e7681' }}>FLUSHES (MISPREDICT)</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', fontWeight: 700, color: '#f87171' }}>
                  {stats.flushes}
                </div>
              </div>

              <div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#6e7681' }}>FLUSH PENALTY</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', fontWeight: 700, color: stats.cyclesPenalized > 0 ? '#ef4444' : '#ffffff' }}>
                  {stats.cyclesPenalized} CYCLES
                </div>
              </div>
            </div>

            {/* Real-time Branch Outcome Stream */}
            {branchHistory.length > 0 && (
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.2)',
                  padding: '8px 10px',
                  borderRadius: '2px',
                  border: '1px solid rgba(255, 255, 255, 0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#6e7681' }}>
                  SPECULATIVE EXECUTION EVENT LOG:
                </div>
                {branchHistory.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '10px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      color: item.hit ? '#4ade80' : '#f87171'
                    }}
                  >
                    <span>
                      {stateLabels[item.fromState].short} ({stateLabels[item.fromState].code}) ──[{item.action === 'TAKEN' ? 'T' : 'NT'}]──► {stateLabels[item.toState].short} ({stateLabels[item.toState].code})
                    </span>
                    <span style={{ fontWeight: 600 }}>
                      {item.hit ? 'HIT (0 STALL)' : 'MISPREDICT (-2 CYCLES FLUSH)'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

