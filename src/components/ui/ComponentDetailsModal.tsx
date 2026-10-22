import React, { useEffect } from 'react';
import { X, Cpu, Layers, ArrowRight, ArrowLeftRight, GitCommit } from 'lucide-react';
import { CPU_COMPONENTS } from '../../data/cpuData';
import { ComponentId } from '../../types';
import { audio } from '../../utils/audio';

interface ComponentDetailsModalProps {
  componentId: ComponentId | null;
  onClose: () => void;
  onSelectComponent?: (id: ComponentId) => void;
  currentInstruction?: string;
}

// Educational role description during active ADD x3, x1, x2 instruction
const INSTRUCTION_ROLES: Record<ComponentId, string> = {
  PC: 'Emits 0x0040 onto Address Bus during FETCH. Increments by +4 (0x0044) for sequential execution.',
  IR: 'Latches instruction word 0x002081B3 during FETCH. Feeds opcode and register fields to Control Unit decoder.',
  CU: 'Decodes opcode 0110011, funct3 000, funct7 0000000. Asserts ALUOp=ADD and RegWrite=1 control signals.',
  REG_FILE: 'Dual read ports output operands x1 = 20 and x2 = 22. Commits write-back result 42 into x3 during WRITE BACK.',
  ALU: 'Receives operands 20 and 22. 32-bit parallel adder executes 20 + 22 = 42 and dispatches result to write-back bus.',
  MEMORY: 'Responds to MAR (0x0040) read request by placing instruction machine word onto Memory Bus.',
  CACHE: 'L1 Instruction Cache provides near-instantaneous (~1.2ns) instruction hit lookup for loop iterations.',
  PIPELINE: 'Synchronizes 5-stage overlapped progression (IF → ID → EX → MEM → WB) and manages hazard detection.'
};

export const ComponentDetailsModal: React.FC<ComponentDetailsModalProps> = ({
  componentId,
  onClose,
  onSelectComponent,
  currentInstruction = 'ADD x3, x1, x2'
}) => {
  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && componentId) {
        audio.playClick();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [componentId, onClose]);

  if (!componentId) return null;
  const comp = CPU_COMPONENTS[componentId];
  if (!comp) return null;

  return (
    <div
      className="tech-panel edu-component-inspector"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '400px',
        maxWidth: 'calc(100vw - 36px)',
        maxHeight: 'calc(100vh - 80px)',
        zIndex: 65,
        borderRadius: '4px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        borderLeft: '3px solid #ff6a00',
        animation: 'fadeIn 0.22s ease-out',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.8), 0 0 24px rgba(255, 106, 0, 0.2)',
        overflowY: 'auto'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              letterSpacing: '0.1em',
              color: '#ff6a00',
              textTransform: 'uppercase'
            }}
          >
            <Cpu size={12} />
            {comp.category}
          </div>
          <h2
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '20px',
              fontWeight: 700,
              color: '#ffffff',
              marginTop: '2px'
            }}
          >
            {comp.name}
          </h2>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              color: '#8b949e',
              letterSpacing: '0.04em'
            }}
          >
            {comp.fullName}
          </div>
        </div>

        <button
          onClick={() => {
            audio.playClick();
            onClose();
          }}
          aria-label="Close component inspector (Esc)"
          title="Close Inspector (Esc)"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '2px',
            color: '#9aa3af',
            cursor: 'pointer',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.borderColor = '#ff6a00';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#9aa3af';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Primary Description */}
      <p
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '12px',
          lineHeight: 1.55,
          color: '#cbd5e1',
          margin: 0
        }}
      >
        {comp.description}
      </p>

      {/* Role in Active Instruction (ADD x3, x1, x2) */}
      <div
        style={{
          background: 'rgba(255, 106, 0, 0.08)',
          border: '1px solid rgba(255, 106, 0, 0.25)',
          borderRadius: '3px',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '9px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#ff8533',
            fontWeight: 700
          }}
        >
          <GitCommit size={11} />
          ROLE IN ACTIVE INSTRUCTION ({currentInstruction})
        </div>
        <div
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '11px',
            color: '#e6edf3',
            lineHeight: 1.45
          }}
        >
          {INSTRUCTION_ROLES[comp.id] || 'Participates in synchronized processor execution.'}
        </div>
      </div>

      {/* Connected Components Navigation Links */}
      {comp.connections && comp.connections.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#8b949e',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <ArrowLeftRight size={11} />
            INTER-CONNECTED DATAPATH UNITS
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {comp.connections.map((connId) => {
              const target = CPU_COMPONENTS[connId];
              return (
                <button
                  key={connId}
                  onClick={() => {
                    audio.playClick();
                    if (onSelectComponent) onSelectComponent(connId);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '2px',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '10px',
                    color: '#38bdf8',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#38bdf8';
                    e.currentTarget.style.background = 'rgba(56, 189, 248, 0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                  }}
                >
                  <span>{target ? target.name : connId}</span>
                  <ArrowRight size={10} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Technical Specifications */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#8b949e',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Layers size={11} />
          ARCHITECTURAL SPECIFICATIONS
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '5px' }}>
          {comp.techSpecs.map((spec, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '5px 8px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '2px',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px'
              }}
            >
              <span style={{ color: '#8b949e' }}>{spec.label}</span>
              <span style={{ color: '#f0f6fc', fontWeight: 600 }}>{spec.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
