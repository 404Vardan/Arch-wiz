import React from 'react';
import { Play, Pause, SkipForward, RotateCcw, Activity, ArrowRight, Layers, Cpu, Info, CheckCircle2 } from 'lucide-react';
import { EXECUTION_STAGES } from '../../data/cpuData';
import { isZoneActive } from '../../data/sceneZones';
import { audio } from '../../utils/audio';

interface ExecutionSectionProps {
  currentStageIndex: number;
  isPlaying: boolean;
  onPlayToggle: () => void;
  onStep: () => void;
  onReset: () => void;
  onSelectStage: (index: number) => void;
  scrollProgress: number;
  onOpenSimulationLab?: () => void;
  isInspectorOpen?: boolean;
}

export const ExecutionSection: React.FC<ExecutionSectionProps> = ({
  currentStageIndex,
  isPlaying,
  onPlayToggle,
  onStep,
  onReset,
  onSelectStage,
  scrollProgress,
  onOpenSimulationLab,
  isInspectorOpen = false
}) => {
  // Mutually exclusive scene zone check: strictly active in EXECUTION zone (0.65 to 0.80)
  // When an inspector modal is open, we hide or minimize so zero overlap occurs
  const isVisible = isZoneActive(scrollProgress, 'EXECUTION') && !isInspectorOpen;
  const currentStage = EXECUTION_STAGES[currentStageIndex];

  if (!isVisible) return null;

  const isCompleted = currentStageIndex === EXECUTION_STAGES.length - 1;

  // Why it matters concept for each stage
  const WHY_IT_MATTERS: Record<number, string> = {
    0: 'Von Neumann architectures isolate memory access to the Fetch stage so instructions and data never contend for the memory bus in single-cycle pipelines.',
    1: 'Instruction decoding splits the single 32-bit machine word into control lines in parallel, driving ALU multiplexers and register read enables without software overhead.',
    2: 'High-performance register files incorporate dual independent read ports, allowing both source operands (rs1 and rs2) to be retrieved concurrently in a single clock phase.',
    3: 'The ALU executes pure combinational logic with zero side effects. The destination register x3 is strictly not updated until the dedicated Write-Back stage commits the result.',
    4: 'Write-Back synchronizes architectural register state with clock edge transitions. RegWrite enables atomic commit into x3, retiring the ADD instruction.'
  };

  return (
    <div
      className="tech-panel edu-panel-dock"
      style={{
        position: 'fixed',
        left: '28px',
        bottom: '24px',
        width: '540px',
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
      {/* 1. Header Bar: Eyebrow, Instruction, Lab trigger */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9px',
              letterSpacing: '0.14em',
              color: '#ff6a00',
              textTransform: 'uppercase'
            }}
          >
            5-STAGE DATAPATH EXECUTION
          </div>
          <h2
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '22px',
              fontWeight: 700,
              color: '#ffffff',
              marginTop: '1px'
            }}
          >
            ADD x3, x1, x2
          </h2>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              color: '#8b949e'
            }}
          >
            PC = 0x0040 | x1 = 20 | x2 = 22 | Initial x3 = 0
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {onOpenSimulationLab && (
            <button
              onClick={() => {
                audio.playClick();
                onOpenSimulationLab();
              }}
              className="btn-primary"
              style={{
                padding: '5px 9px',
                fontSize: '10px',
                background: '#ff6a00',
                color: '#000000'
              }}
              title="Open full-screen 3D simulation lab"
            >
              <Cpu size={12} />
              <span>3D LAB</span>
            </button>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              background: 'rgba(255, 106, 0, 0.1)',
              border: '1px solid rgba(255, 106, 0, 0.3)',
              borderRadius: '2px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              color: '#ff6a00',
              fontWeight: 600
            }}
          >
            <Activity size={11} />
            STAGE {currentStage.number} / 05
          </div>
        </div>
      </div>

      {/* 2. 5-Stage Stepper Navigation Buttons */}
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
                  ? 'rgba(255, 106, 0, 0.18)'
                  : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${
                  isActive
                    ? '#ff6a00'
                    : isPast
                    ? 'rgba(255, 106, 0, 0.35)'
                    : 'rgba(255, 255, 255, 0.08)'
                }`,
                color: isActive ? '#000000' : isPast ? '#ff8533' : '#8b949e',
                padding: '6px 2px',
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
              {st.number} {st.id === 'REGISTER_READ' ? 'READ' : st.id === 'WRITE_BACK' ? 'WB' : st.id}
            </button>
          );
        })}
      </div>

      {/* 3. Pedagogical Section: WHAT IS HAPPENING */}
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.35)',
          padding: '10px 12px',
          borderRadius: '3px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '12px',
              fontWeight: 700,
              color: '#ffffff'
            }}
          >
            {currentStage.title}
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9px',
              color: '#ff8533'
            }}
          >
            WHAT IS HAPPENING
          </span>
        </div>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '11px',
            lineHeight: 1.5,
            color: '#cbd5e1',
            margin: 0
          }}
        >
          {currentStage.description}
        </p>
      </div>

      {/* 4. Pedagogical Section: VISUAL FLOW (Lightweight Interactive Datapath Route SVG) */}
      <div
        style={{
          background: 'rgba(10, 13, 18, 0.8)',
          padding: '10px 12px',
          borderRadius: '3px',
          border: '1px solid rgba(255, 106, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#ff8533',
              fontWeight: 700
            }}
          >
            DATAPATH ROUTE OVERVIEW
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9px',
              color: '#38bdf8'
            }}
          >
            {currentStage.dataFlowDescription}
          </span>
        </div>

        {/* SVG Route Visualization */}
        <div style={{ width: '100%', overflowX: 'auto', padding: '4px 0' }}>
          <svg viewBox="0 0 500 52" style={{ width: '100%', minWidth: '460px', height: '48px', display: 'block' }}>
            <defs>
              <linearGradient id="activeBusGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ff6a00" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.9" />
              </linearGradient>
            </defs>

            {/* Nodes: PC, MEM, IR, CU, REG, ALU, WB */}
            {[
              { id: 'PC', label: 'PC', x: 10, y: 10, w: 45, stage: 0 },
              { id: 'MEM', label: 'MEM', x: 80, y: 10, w: 50, stage: 0 },
              { id: 'IR', label: 'IR', x: 155, y: 10, w: 42, stage: 0 },
              { id: 'CU', label: 'CU', x: 220, y: 10, w: 44, stage: 1 },
              { id: 'REG', label: 'REG FILE', x: 288, y: 10, w: 68, stage: 2 },
              { id: 'ALU', label: 'ALU', x: 380, y: 10, w: 48, stage: 3 },
              { id: 'WB', label: 'x3 WB', x: 450, y: 10, w: 45, stage: 4 }
            ].map((node) => {
              const isActive =
                (currentStageIndex === 0 && (node.id === 'PC' || node.id === 'MEM' || node.id === 'IR')) ||
                (currentStageIndex === 1 && (node.id === 'IR' || node.id === 'CU')) ||
                (currentStageIndex === 2 && (node.id === 'REG' || node.id === 'ALU')) ||
                (currentStageIndex === 3 && node.id === 'ALU') ||
                (currentStageIndex === 4 && (node.id === 'ALU' || node.id === 'WB' || node.id === 'REG'));

              return (
                <g key={node.id}>
                  <rect
                    x={node.x}
                    y={node.y}
                    width={node.w}
                    height={30}
                    rx={3}
                    fill={isActive ? 'rgba(255, 106, 0, 0.22)' : 'rgba(255, 255, 255, 0.03)'}
                    stroke={isActive ? '#ff6a00' : 'rgba(255, 255, 255, 0.12)'}
                    strokeWidth={isActive ? 1.5 : 1}
                  />
                  <text
                    x={node.x + node.w / 2}
                    y={node.y + 19}
                    textAnchor="middle"
                    fill={isActive ? '#ffffff' : '#8b949e'}
                    fontFamily="'JetBrains Mono', monospace"
                    fontSize="9px"
                    fontWeight={isActive ? 700 : 500}
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}

            {/* Connecting Bus Arrows */}
            {/* PC -> MEM */}
            <line
              x1="55"
              y1="25"
              x2="80"
              y2="25"
              stroke={currentStageIndex === 0 ? '#ff6a00' : '#333b47'}
              strokeWidth={currentStageIndex === 0 ? 2 : 1}
              strokeDasharray={currentStageIndex === 0 ? '3,3' : 'none'}
            />
            {/* MEM -> IR */}
            <line
              x1="130"
              y1="25"
              x2="155"
              y2="25"
              stroke={currentStageIndex === 0 ? '#38bdf8' : '#333b47'}
              strokeWidth={currentStageIndex === 0 ? 2 : 1}
            />
            {/* IR -> CU */}
            <line
              x1="197"
              y1="25"
              x2="220"
              y2="25"
              stroke={currentStageIndex === 1 ? '#ff6a00' : '#333b47'}
              strokeWidth={currentStageIndex === 1 ? 2 : 1}
            />
            {/* CU -> REG */}
            <line
              x1="264"
              y1="25"
              x2="288"
              y2="25"
              stroke={currentStageIndex === 1 ? '#ff6a00' : '#333b47'}
              strokeWidth={currentStageIndex === 1 ? 1.5 : 1}
            />
            {/* REG -> ALU (Dual Ports) */}
            <path
              d="M 356 20 L 380 20 M 356 30 L 380 30"
              stroke={currentStageIndex === 2 ? '#38bdf8' : '#333b47'}
              strokeWidth={currentStageIndex === 2 ? 2 : 1}
            />
            {/* ALU -> WB */}
            <line
              x1="428"
              y1="25"
              x2="450"
              y2="25"
              stroke={currentStageIndex >= 3 ? (currentStageIndex === 4 ? '#4ade80' : '#ff6a00') : '#333b47'}
              strokeWidth={currentStageIndex >= 3 ? 2 : 1}
            />
          </svg>
        </div>

        {/* Dynamic Micro-Explanation of Active Bus Action */}
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px',
            color: '#e6edf3',
            background: 'rgba(0,0,0,0.3)',
            padding: '5px 8px',
            borderRadius: '2px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span style={{ color: '#ff6a00' }}>►</span>
          {currentStageIndex === 0 && (
            <span>Address <strong style={{ color: '#ff6a00' }}>0x0040</strong> sent to RAM ──► Opcode <strong style={{ color: '#38bdf8' }}>0x002081B3</strong> latched into IR</span>
          )}
          {currentStageIndex === 1 && (
            <span>IR feeds <strong style={{ color: '#ff8533' }}>Opcode 0110011</strong> & funct3 000 to CU ──► Asserts <strong style={{ color: '#38bdf8' }}>ALUOp=ADD</strong>, RegWrite=1</span>
          )}
          {currentStageIndex === 2 && (
            <span>Dual Read Ports: <strong style={{ color: '#ffd700' }}>Port 1 (x1) = 20</strong> & <strong style={{ color: '#38bdf8' }}>Port 2 (x2) = 22</strong> travel independently to ALU</span>
          )}
          {currentStageIndex === 3 && (
            <span>ALU Parallel Adder core computes: <strong style={{ color: '#ff6a00' }}>20 + 22 = 42</strong> ──► Status: Z=0, N=0, C=0, V=0</span>
          )}
          {currentStageIndex === 4 && (
            <span>Write-Back bus delivers result 42 into <strong style={{ color: '#4ade80' }}>destination register x3 (0 → 42)</strong></span>
          )}
        </div>
      </div>

      {/* 5. Pedagogical Section: CURRENT VALUES & CONTROL SIGNALS */}
      {/* If DECODE stage: show decoded bitfields and control signals */}
      {currentStageIndex === 1 && (
        <div
          style={{
            background: 'rgba(255, 106, 0, 0.08)',
            border: '1px solid rgba(255, 106, 0, 0.3)',
            borderRadius: '3px',
            padding: '8px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '5px'
          }}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#ff8533',
              fontWeight: 700
            }}
          >
            DECODED RV32I BITFIELDS & CONTROL SIGNALS
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '4px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px'
            }}
          >
            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '3px 6px', borderRadius: '2px' }}>
              <span style={{ color: '#8b949e' }}>OPCODE: </span>
              <span style={{ color: '#ffffff', fontWeight: 600 }}>0110011</span>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '3px 6px', borderRadius: '2px' }}>
              <span style={{ color: '#8b949e' }}>FUNCT3: </span>
              <span style={{ color: '#ffffff', fontWeight: 600 }}>000</span>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '3px 6px', borderRadius: '2px' }}>
              <span style={{ color: '#8b949e' }}>FUNCT7: </span>
              <span style={{ color: '#ffffff', fontWeight: 600 }}>0000000</span>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '3px 6px', borderRadius: '2px' }}>
              <span style={{ color: '#8b949e' }}>ALUOp: </span>
              <span style={{ color: '#38bdf8', fontWeight: 600 }}>ADD</span>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '3px 6px', borderRadius: '2px' }}>
              <span style={{ color: '#8b949e' }}>RS1: </span>
              <span style={{ color: '#ffd700', fontWeight: 600 }}>x1</span>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '3px 6px', borderRadius: '2px' }}>
              <span style={{ color: '#8b949e' }}>RS2: </span>
              <span style={{ color: '#38bdf8', fontWeight: 600 }}>x2</span>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '3px 6px', borderRadius: '2px' }}>
              <span style={{ color: '#8b949e' }}>RD: </span>
              <span style={{ color: '#4ade80', fontWeight: 600 }}>x3</span>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '3px 6px', borderRadius: '2px' }}>
              <span style={{ color: '#8b949e' }}>RegWrite: </span>
              <span style={{ color: '#ff6a00', fontWeight: 600 }}>1</span>
            </div>
          </div>
        </div>
      )}

      {/* Live Register & ALU State Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '6px'
        }}
      >
        {/* x1 (rs1) */}
        <div
          style={{
            background: currentStageIndex === 2 ? 'rgba(255, 215, 0, 0.12)' : 'rgba(0,0,0,0.3)',
            border: `1px solid ${currentStageIndex === 2 ? 'rgba(255, 215, 0, 0.4)' : 'rgba(255,255,255,0.06)'}`,
            padding: '6px 8px',
            borderRadius: '2px'
          }}
        >
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#8b949e' }}>
            x1 (SRC 1)
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '13px',
              fontWeight: 600,
              color: '#ffffff',
              marginTop: '1px'
            }}
          >
            {currentStage.cpuState.r1}
          </div>
        </div>

        {/* x2 (rs2) */}
        <div
          style={{
            background: currentStageIndex === 2 ? 'rgba(56, 189, 248, 0.12)' : 'rgba(0,0,0,0.3)',
            border: `1px solid ${currentStageIndex === 2 ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255,255,255,0.06)'}`,
            padding: '6px 8px',
            borderRadius: '2px'
          }}
        >
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#8b949e' }}>
            x2 (SRC 2)
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '13px',
              fontWeight: 600,
              color: '#ffffff',
              marginTop: '1px'
            }}
          >
            {currentStage.cpuState.r2}
          </div>
        </div>

        {/* ALU OP */}
        <div
          style={{
            background: currentStageIndex === 3 ? 'rgba(255, 106, 0, 0.15)' : 'rgba(0,0,0,0.3)',
            border: `1px solid ${currentStageIndex === 3 ? 'rgba(255, 106, 0, 0.5)' : 'rgba(255,255,255,0.06)'}`,
            padding: '6px 8px',
            borderRadius: '2px'
          }}
        >
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#8b949e' }}>
            ALU CORE
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              fontWeight: 600,
              color: currentStage.cpuState.aluResult !== null ? '#ff6a00' : '#8b949e',
              marginTop: '2px'
            }}
          >
            {currentStage.cpuState.aluOp}
          </div>
        </div>

        {/* x3 (rd) */}
        <div
          style={{
            background: isCompleted ? 'rgba(74, 222, 128, 0.15)' : 'rgba(0,0,0,0.3)',
            border: `1px solid ${isCompleted ? '#4ade80' : 'rgba(255,255,255,0.06)'}`,
            padding: '6px 8px',
            borderRadius: '2px',
            transition: 'all 0.25s ease'
          }}
        >
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: isCompleted ? '#4ade80' : '#ff6a00' }}>
            x3 (DEST)
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '13px',
              fontWeight: 700,
              color: isCompleted ? '#4ade80' : '#ffffff',
              marginTop: '1px'
            }}
          >
            {isCompleted ? '42 (0 → 42)' : currentStage.cpuState.r3}
          </div>
        </div>
      </div>

      {/* 6. Pedagogical Section: WHY IT MATTERS */}
      <div
        style={{
          background: 'rgba(56, 189, 248, 0.05)',
          borderLeft: '2px solid #38bdf8',
          padding: '8px 10px',
          borderRadius: '0 3px 3px 0',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px'
        }}
      >
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '9px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#38bdf8',
            fontWeight: 700
          }}
        >
          WHY IT MATTERS IN COMPUTER ARCHITECTURE
        </div>
        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '11px',
            lineHeight: 1.45,
            color: '#d0d7de',
            margin: 0
          }}
        >
          {WHY_IT_MATTERS[currentStageIndex]}
        </p>
      </div>

      {/* 7. Controls: Play/Pause, Step, Reset, Status Readout */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          paddingTop: '10px'
        }}
      >
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => {
              audio.playClick();
              onPlayToggle();
            }}
            className="btn-primary"
            style={{ padding: '6px 14px', fontSize: '10px' }}
          >
            {isPlaying ? <Pause size={11} /> : <Play size={11} />}
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
            style={{ padding: '6px 12px', fontSize: '10px' }}
            title="Step to next stage"
          >
            <SkipForward size={11} />
            <span>STEP</span>
          </button>

          <button
            onClick={() => {
              audio.playClick();
              onReset();
            }}
            className="btn-secondary"
            style={{ padding: '6px 10px', fontSize: '10px' }}
            title="Reset to Fetch stage"
          >
            <RotateCcw size={11} />
          </button>
        </div>

        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px',
            color: isCompleted ? '#4ade80' : '#8b949e',
            fontWeight: isCompleted ? 700 : 500
          }}
        >
          {isCompleted ? '✓ x3 latched: 42 (INSTRUCTION COMMITTED)' : `CLOCK CYCLE 0${currentStageIndex + 1}`}
        </div>
      </div>
    </div>
  );
};
