import React, { useState } from 'react';
import { SkipForward, Layers, Zap, AlertTriangle, ShieldCheck, GitBranch, RefreshCw, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { isZoneActive } from '../../data/sceneZones';
import { audio } from '../../utils/audio';

interface PipelineSectionProps {
  scrollProgress: number;
  isInspectorOpen?: boolean;
}

type PipelineTab = 'DATA_HAZARDS' | 'BRANCH_PREDICTOR';
type HazardMode = 'IDEAL' | 'STALL' | 'FORWARDING';

// 2-Bit Saturating Branch Predictor States
type BranchState = 0 | 1 | 2 | 3;

interface BranchHistoryItem {
  id: number;
  fromState: BranchState;
  toState: BranchState;
  action: 'TAKEN' | 'NOT_TAKEN';
  predicted: 'TAKEN' | 'NOT_TAKEN';
  hit: boolean;
}

export const PipelineSection: React.FC<PipelineSectionProps> = ({ scrollProgress, isInspectorOpen = false }) => {
  // Mutually exclusive scene zone check: strictly active in PIPELINE zone (0.89 to 0.95)
  const isVisible = isZoneActive(scrollProgress, 'PIPELINE') && !isInspectorOpen;

  const [activeTab, setActiveTab] = useState<PipelineTab>('DATA_HAZARDS');
  const [hazardMode, setHazardMode] = useState<HazardMode>('FORWARDING');
  const [cycleNum, setCycleNum] = useState<number>(4);

  // Branch Predictor State
  const [branchState, setBranchState] = useState<BranchState>(3); // Default Strongly Taken (11)
  const [lastOutcome, setLastOutcome] = useState<'TAKEN' | 'NOT_TAKEN' | null>(null);
  const [lastHit, setLastHit] = useState<boolean | null>(null);
  const [branchHistory, setBranchHistory] = useState<BranchHistoryItem[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    hits: 0,
    flushes: 0,
    cyclesPenalized: 0
  });

  if (!isVisible) return null;

  // Multi-instruction timing matrix mapping:
  // Instruction 1: ADD R1, R2, R3 (writes R1 in WB)
  // Instruction 2: SUB R4, R1, R5 (reads R1 in EX/ID)
  // Instruction 3: AND R6, R7, R8 (independent)
  const getStageAtCycle = (instId: number, cycle: number): { text: string; isStall: boolean; isBypass: boolean } => {
    if (hazardMode === 'IDEAL') {
      const stageIdx = cycle - instId; // 1-based: C1->I1=1(IF)
      if (stageIdx < 0 || stageIdx > 4) return { text: '—', isStall: false, isBypass: false };
      const STAGES = ['IF', 'ID', 'EX', 'MEM', 'WB'];
      return { text: STAGES[stageIdx], isStall: false, isBypass: false };
    }

    if (hazardMode === 'STALL') {
      if (instId === 1) {
        const s = ['IF', 'ID', 'EX', 'MEM', 'WB'][cycle - 1];
        return { text: s || '—', isStall: false, isBypass: false };
      }
      if (instId === 2) {
        if (cycle === 1) return { text: '—', isStall: false, isBypass: false };
        if (cycle === 2) return { text: 'IF', isStall: false, isBypass: false };
        if (cycle === 3) return { text: 'NOP (STALL)', isStall: true, isBypass: false };
        if (cycle === 4) return { text: 'NOP (STALL)', isStall: true, isBypass: false };
        if (cycle === 5) return { text: 'ID', isStall: false, isBypass: false }; // reads R1 newly written by I1
        if (cycle === 6) return { text: 'EX', isStall: false, isBypass: false };
        if (cycle === 7) return { text: 'MEM', isStall: false, isBypass: false };
        if (cycle === 8) return { text: 'WB', isStall: false, isBypass: false };
        return { text: '—', isStall: false, isBypass: false };
      }
      // instId === 3
      if (cycle < 6) return { text: '—', isStall: false, isBypass: false };
      const s = ['IF', 'ID', 'EX'][cycle - 6];
      return { text: s || '—', isStall: false, isBypass: false };
    }

    // FORWARDING MODE:
    // I1: C1=IF, C2=ID, C3=EX, C4=MEM, C5=WB
    // I2: C2=IF, C3=ID, C4=EX (receives bypass from I1 EX/MEM!), C5=MEM, C6=WB
    // I3: C3=IF, C4=ID, C5=EX, C6=MEM, C7=WB
    if (instId === 1) {
      const s = ['IF', 'ID', 'EX', 'MEM', 'WB'][cycle - 1];
      return { text: s || '—', isStall: false, isBypass: false };
    }
    if (instId === 2) {
      if (cycle === 2) return { text: 'IF', isStall: false, isBypass: false };
      if (cycle === 3) return { text: 'ID', isStall: false, isBypass: false };
      if (cycle === 4) return { text: 'EX (BYPASS)', isStall: false, isBypass: true };
      if (cycle === 5) return { text: 'MEM', isStall: false, isBypass: false };
      if (cycle === 6) return { text: 'WB', isStall: false, isBypass: false };
      return { text: '—', isStall: false, isBypass: false };
    }
    if (instId === 3) {
      if (cycle === 3) return { text: 'IF', isStall: false, isBypass: false };
      if (cycle === 4) return { text: 'ID', isStall: false, isBypass: false };
      if (cycle === 5) return { text: 'EX', isStall: false, isBypass: false };
      if (cycle === 6) return { text: 'MEM', isStall: false, isBypass: false };
      if (cycle === 7) return { text: 'WB', isStall: false, isBypass: false };
      return { text: '—', isStall: false, isBypass: false };
    }

    return { text: '—', isStall: false, isBypass: false };
  };

  const handleCycleChange = (c: number) => {
    audio.playClockTick();
    setCycleNum(c);
  };

  const handleAdvance = () => {
    audio.playClockTick();
    const maxC = hazardMode === 'STALL' ? 8 : 7;
    setCycleNum((prev) => (prev >= maxC ? 1 : prev + 1));
  };

  const handleModeChange = (mode: HazardMode) => {
    audio.playClick();
    setHazardMode(mode);
    setCycleNum(mode === 'FORWARDING' ? 4 : mode === 'STALL' ? 3 : 3);
  };

  // Branch Predictor logic
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

    setLastOutcome(outcome);
    setLastHit(isHit);
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
      ...prev.slice(0, 3)
    ]);
  };

  const resetBranchPredictor = () => {
    audio.playClick();
    setBranchState(3);
    setLastOutcome(null);
    setLastHit(null);
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
    <aside
      className="tech-panel edu-panel-dock"
      style={{
        position: 'fixed',
        left: '28px',
        bottom: '24px',
        width: '580px',
        maxWidth: 'calc(100vw - 56px)',
        maxHeight: 'calc(100vh - 100px)',
        zIndex: 40,
        borderRadius: '4px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        borderLeft: '3px solid #ff6a00',
        animation: 'fadeIn 0.25s ease-out',
        overflowY: 'auto'
      }}
    >
      {/* 1. Top Tab Selector */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '8px'
        }}
      >
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => {
              audio.playClick();
              setActiveTab('DATA_HAZARDS');
            }}
            style={{
              padding: '5px 10px',
              background: activeTab === 'DATA_HAZARDS' ? 'rgba(255, 106, 0, 0.16)' : 'rgba(255, 255, 255, 0.03)',
              border: `1px solid ${activeTab === 'DATA_HAZARDS' ? '#ff6a00' : 'rgba(255, 255, 255, 0.08)'}`,
              color: activeTab === 'DATA_HAZARDS' ? '#ff6a00' : '#8b949e',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              fontWeight: 600,
              cursor: 'pointer',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Layers size={11} />
            PIPELINE LANES & FORWARDING
          </button>

          <button
            onClick={() => {
              audio.playClick();
              setActiveTab('BRANCH_PREDICTOR');
            }}
            style={{
              padding: '5px 10px',
              background: activeTab === 'BRANCH_PREDICTOR' ? 'rgba(255, 106, 0, 0.16)' : 'rgba(255, 255, 255, 0.03)',
              border: `1px solid ${activeTab === 'BRANCH_PREDICTOR' ? '#ff6a00' : 'rgba(255, 255, 255, 0.08)'}`,
              color: activeTab === 'BRANCH_PREDICTOR' ? '#ff6a00' : '#8b949e',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              fontWeight: 600,
              cursor: 'pointer',
              borderRadius: '2px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <GitBranch size={11} />
            2-BIT BRANCH PREDICTOR
          </button>
        </div>

        <div
          style={{
            padding: '3px 8px',
            background: 'rgba(255, 106, 0, 0.1)',
            border: '1px solid rgba(255, 106, 0, 0.3)',
            borderRadius: '2px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '9px',
            color: '#ff6a00',
            fontWeight: 700
          }}
        >
          {activeTab === 'DATA_HAZARDS' ? `CYCLE 0${cycleNum}` : '2-BIT FSM'}
        </div>
      </div>

      {/* TAB 1: DATA HAZARDS & PIPELINE LANES */}
      {activeTab === 'DATA_HAZARDS' && (
        <>
          {/* Header */}
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
              INSTRUCTION OVERLAP & HAZARD MITIGATION
            </div>
            <h2
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '20px',
                fontWeight: 700,
                color: '#ffffff',
                marginTop: '1px'
              }}
            >
              5-STAGE PIPELINE TIMING LANES
            </h2>
          </div>

          {/* Mode Selector */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '6px'
            }}
          >
            <button
              onClick={() => handleModeChange('IDEAL')}
              style={{
                padding: '6px',
                background: hazardMode === 'IDEAL' ? '#ff6a00' : 'rgba(255, 255, 255, 0.04)',
                color: hazardMode === 'IDEAL' ? '#000000' : '#ffffff',
                border: hazardMode === 'IDEAL' ? '1px solid #ff6a00' : '1px solid rgba(255, 255, 255, 0.08)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '9px',
                fontWeight: 700,
                cursor: 'pointer',
                borderRadius: '2px',
                textAlign: 'center'
              }}
            >
              1. IDEAL (CPI = 1.0)
            </button>

            <button
              onClick={() => handleModeChange('STALL')}
              style={{
                padding: '6px',
                background: hazardMode === 'STALL' ? '#ef4444' : 'rgba(255, 255, 255, 0.04)',
                color: hazardMode === 'STALL' ? '#ffffff' : '#ffffff',
                border: hazardMode === 'STALL' ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.08)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '9px',
                fontWeight: 700,
                cursor: 'pointer',
                borderRadius: '2px',
                textAlign: 'center'
              }}
            >
              2. RAW STALLS (+2 NOPs)
            </button>

            <button
              onClick={() => handleModeChange('FORWARDING')}
              style={{
                padding: '6px',
                background: hazardMode === 'FORWARDING' ? '#ff6a00' : 'rgba(255, 255, 255, 0.04)',
                color: hazardMode === 'FORWARDING' ? '#000000' : '#ffffff',
                border: hazardMode === 'FORWARDING' ? '1px solid #ff6a00' : '1px solid rgba(255, 255, 255, 0.08)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '9px',
                fontWeight: 700,
                cursor: 'pointer',
                borderRadius: '2px',
                textAlign: 'center'
              }}
            >
              3. FORWARDING (BYPASS)
            </button>
          </div>

          {/* Explanatory Banner */}
          <div
            style={{
              padding: '8px 10px',
              background:
                hazardMode === 'FORWARDING'
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
              <ShieldCheck size={16} color="#4ade80" style={{ flexShrink: 0 }} />
            ) : hazardMode === 'STALL' ? (
              <AlertTriangle size={16} color="#f87171" style={{ flexShrink: 0 }} />
            ) : (
              <Zap size={16} color="#ff6a00" style={{ flexShrink: 0 }} />
            )}

            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#cbd5e1', lineHeight: 1.45 }}>
              {hazardMode === 'FORWARDING' && (
                <>
                  <strong style={{ color: '#4ade80' }}>BYPASS HARDWARE ACTIVE:</strong> I1 computes R1 at Cycle 3. Forwarding unit routes <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#ff6a00' }}>EX/MEM.ALUOut → ALU.MuxInputB</span> at Cycle 4, completely eliminating 2 stall bubbles.
                </>
              )}
              {hazardMode === 'STALL' && (
                <>
                  <strong style={{ color: '#f87171' }}>READ-AFTER-WRITE (RAW) HAZARD:</strong> I2 requires R1. Because forwarding is disabled, the hazard detection unit injects 2 NOP bubbles into ID (Cycles 3 and 4) until I1 writes back to the Register File at Cycle 5.
                </>
              )}
              {hazardMode === 'IDEAL' && (
                <>
                  <strong style={{ color: '#ff6a00' }}>IDEAL EXECUTION:</strong> Unrelated instructions advance each clock cycle without data dependencies. Sustained throughput = 1 instruction per cycle (CPI = 1.0).
                </>
              )}
            </div>
          </div>

          {/* Multi-Instruction Timing Lanes Diagram */}
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              padding: '10px',
              borderRadius: '3px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '5px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#8b949e', fontWeight: 700 }}>
                TIMING LANES (ROWS = INSTRUCTIONS, COLS = CLOCK CYCLES)
              </span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#ff6a00' }}>
                CURRENT: CYCLE C{cycleNum}
              </span>
            </div>

            {/* Cycle Header Columns */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '120px repeat(7, 1fr)',
                gap: '3px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                paddingBottom: '4px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#6e7681', textAlign: 'left' }}>
                INSTRUCTION
              </div>
              {[1, 2, 3, 4, 5, 6, 7].map((c) => (
                <div
                  key={c}
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '9px',
                    fontWeight: 700,
                    color: c === cycleNum ? '#ff6a00' : '#8b949e',
                    background: c === cycleNum ? 'rgba(255, 106, 0, 0.15)' : 'transparent',
                    padding: '2px 0',
                    borderRadius: '2px'
                  }}
                >
                  C{c}
                </div>
              ))}
            </div>

            {/* Instruction Rows */}
            {[
              { id: 1, label: 'I1: ADD R1, R2, R3', role: 'PRODUCER [R1]' },
              { id: 2, label: 'I2: SUB R4, R1, R5', role: 'CONSUMER [R1]' },
              { id: 3, label: 'I3: AND R6, R7, R8', role: 'INDEPENDENT' }
            ].map((inst) => (
              <div
                key={inst.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '120px repeat(7, 1fr)',
                  gap: '3px',
                  alignItems: 'center'
                }}
              >
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '9px',
                    color: inst.id === 1 ? '#ff8533' : inst.id === 2 ? '#38bdf8' : '#8b949e',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  title={`${inst.label} (${inst.role})`}
                >
                  {inst.label}
                </div>

                {[1, 2, 3, 4, 5, 6, 7].map((c) => {
                  const stageInfo = getStageAtCycle(inst.id, c);
                  const isCurrentCycle = c === cycleNum;
                  const isActiveCell = isCurrentCycle && stageInfo.text !== '—';

                  return (
                    <div
                      key={c}
                      style={{
                        padding: '4px 2px',
                        textAlign: 'center',
                        borderRadius: '2px',
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '8px',
                        fontWeight: 700,
                        background: isActiveCell
                          ? stageInfo.isStall
                            ? '#ef4444'
                            : stageInfo.isBypass
                            ? '#22c55e'
                            : '#ff6a00'
                          : stageInfo.isStall
                          ? 'rgba(239, 68, 68, 0.18)'
                          : stageInfo.isBypass
                          ? 'rgba(34, 197, 94, 0.18)'
                          : stageInfo.text !== '—'
                          ? 'rgba(255, 255, 255, 0.04)'
                          : 'transparent',
                        color: isActiveCell
                          ? stageInfo.isStall
                            ? '#ffffff'
                            : '#000000'
                          : stageInfo.isStall
                          ? '#f87171'
                          : stageInfo.isBypass
                          ? '#4ade80'
                          : stageInfo.text !== '—'
                          ? '#d0d7de'
                          : '#475569',
                        border: `1px solid ${
                          isCurrentCycle
                            ? '#ff6a00'
                            : stageInfo.isStall
                            ? 'rgba(239, 68, 68, 0.3)'
                            : 'rgba(255, 255, 255, 0.05)'
                        }`,
                        boxShadow: isActiveCell ? '0 0 8px rgba(255, 106, 0, 0.4)' : 'none'
                      }}
                    >
                      {stageInfo.text}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Forwarding Bypass Callout Banner (when forwarding mode) */}
          {hazardMode === 'FORWARDING' && (
            <div
              style={{
                padding: '6px 10px',
                background: 'rgba(34, 197, 94, 0.06)',
                border: '1px dashed #22c55e',
                borderRadius: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '9px'
              }}
            >
              <span style={{ color: '#8b949e' }}>RAW BYPASS ROUTE:</span>
              <span style={{ color: '#4ade80', fontWeight: 700 }}>
                I1 (EX/MEM at Cycle 4) ──► Multiplexer ──► I2 ALU Input (0 Stalls)
              </span>
            </div>
          )}

          {/* Cycle Step & Clock Advancement Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[1, 2, 3, 4, 5, 6, 7].map((c) => (
                <button
                  key={c}
                  onClick={() => handleCycleChange(c)}
                  style={{
                    background: c === cycleNum ? '#ff6a00' : 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${c === cycleNum ? '#ff6a00' : 'rgba(255, 255, 255, 0.08)'}`,
                    color: c === cycleNum ? '#000000' : '#ffffff',
                    padding: '4px 8px',
                    borderRadius: '2px',
                    cursor: 'pointer',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '9px',
                    fontWeight: 700
                  }}
                >
                  C{c}
                </button>
              ))}
            </div>

            <button
              onClick={handleAdvance}
              className="btn-secondary"
              style={{ padding: '5px 10px', fontSize: '10px' }}
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
              SPECULATIVE EXECUTION & CONTROL HAZARD RESOLUTION
            </div>
            <h2
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '20px',
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
              gap: '6px'
            }}
          >
            {stateLabels.map((st, idx) => {
              const isActive = branchState === idx;
              const isPredictTaken = idx >= 2;

              return (
                <div
                  key={st.code}
                  style={{
                    padding: '8px 6px',
                    borderRadius: '3px',
                    background: isActive ? 'rgba(255, 106, 0, 0.16)' : 'rgba(255, 255, 255, 0.02)',
                    border: isActive ? '2px solid #ff6a00' : '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '3px',
                    boxShadow: isActive ? '0 0 14px rgba(255, 106, 0, 0.35)' : 'none',
                    transition: 'all 0.18s ease',
                    position: 'relative'
                  }}
                >
                  {isActive && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '-7px',
                        background: '#ff6a00',
                        color: '#000000',
                        fontSize: '8px',
                        fontWeight: 800,
                        padding: '1px 4px',
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
                      fontSize: '13px',
                      fontWeight: 700,
                      color: isActive ? '#ff6a00' : '#8b949e'
                    }}
                  >
                    {st.code}
                  </span>

                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '8px',
                      fontWeight: 700,
                      color: st.color,
                      textAlign: 'center'
                    }}
                  >
                    {st.short}
                  </span>

                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '8px',
                      color: isPredictTaken ? '#4ade80' : '#9ca3af',
                      fontWeight: 600
                    }}
                  >
                    {isPredictTaken ? 'PREDICT TAKEN' : 'PREDICT NOT'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Explanatory Sequence: Current State -> Prediction -> Outcome -> Next */}
          <div
            style={{
              padding: '8px 10px',
              background: 'rgba(0, 0, 0, 0.35)',
              borderRadius: '3px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
          >
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '9px',
                color: '#ff8533',
                fontWeight: 700
              }}
            >
              FSM TRANSITION SEQUENCE
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px',
                flexWrap: 'wrap',
                gap: '6px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: '#8b949e' }}>STATE:</span>
                <strong style={{ color: '#ff6a00' }}>{stateLabels[branchState].code} ({stateLabels[branchState].short})</strong>
              </div>
              <ArrowRight size={11} color="#6e7681" />
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: '#8b949e' }}>PREDICTION:</span>
                <strong style={{ color: getPrediction(branchState) === 'TAKEN' ? '#38bdf8' : '#fbbf24' }}>
                  {getPrediction(branchState)}
                </strong>
              </div>
              {lastOutcome && (
                <>
                  <ArrowRight size={11} color="#6e7681" />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ color: '#8b949e' }}>OUTCOME:</span>
                    <strong style={{ color: lastHit ? '#4ade80' : '#f87171' }}>
                      {lastOutcome} {lastHit ? '✓ (0 Penalty)' : '✗ (2-Cycle Flush)'}
                    </strong>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Simulation Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '6px' }}>
            <button
              onClick={() => executeBranch('TAKEN')}
              style={{
                padding: '8px 10px',
                background: 'rgba(34, 197, 94, 0.15)',
                border: '1px solid #22c55e',
                color: '#4ade80',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px',
                fontWeight: 700,
                cursor: 'pointer',
                borderRadius: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <CheckCircle2 size={12} />
              SIMULATE TAKEN (T)
            </button>

            <button
              onClick={() => executeBranch('NOT_TAKEN')}
              style={{
                padding: '8px 10px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #ef4444',
                color: '#f87171',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px',
                fontWeight: 700,
                cursor: 'pointer',
                borderRadius: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <XCircle size={12} />
              SIMULATE NOT TAKEN (NT)
            </button>

            <button
              onClick={resetBranchPredictor}
              style={{
                padding: '8px 10px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#8b949e',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px',
                cursor: 'pointer',
                borderRadius: '2px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="Reset predictor FSM and stats"
            >
              <RefreshCw size={11} />
              RESET
            </button>
          </div>

          {/* Statistics Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '6px',
              background: 'rgba(0, 0, 0, 0.25)',
              padding: '6px 8px',
              borderRadius: '2px',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9px'
            }}
          >
            <div>
              <div style={{ color: '#6e7681' }}>TOTAL</div>
              <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '11px' }}>{stats.total}</div>
            </div>
            <div>
              <div style={{ color: '#6e7681' }}>HITS</div>
              <div style={{ color: '#4ade80', fontWeight: 700, fontSize: '11px' }}>{stats.hits}</div>
            </div>
            <div>
              <div style={{ color: '#6e7681' }}>FLUSHES</div>
              <div style={{ color: '#f87171', fontWeight: 700, fontSize: '11px' }}>{stats.flushes}</div>
            </div>
            <div>
              <div style={{ color: '#6e7681' }}>PENALTY</div>
              <div style={{ color: '#ff6a00', fontWeight: 700, fontSize: '11px' }}>+{stats.cyclesPenalized}c</div>
            </div>
          </div>
        </>
      )}
    </aside>
  );
};
