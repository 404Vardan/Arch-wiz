import React from 'react';
import { CPU_COMPONENTS } from '../../data/cpuData';
import { ComponentId } from '../../types';
import { audio } from '../../utils/audio';
import { Cpu, ChevronRight } from 'lucide-react';

interface ComponentIndexOverlayProps {
  scrollProgress: number;
  activeComponentId: ComponentId | null;
  onSelectComponent: (id: ComponentId) => void;
  isModalOpen?: boolean;
}

const INDEX_ITEMS: { id: ComponentId; code: string; name: string; shortRole: string }[] = [
  { id: 'PC', code: 'PC', name: 'Program Counter', shortRole: 'Instruction Address Pointer (0x0040)' },
  { id: 'IR', code: 'IR', name: 'Instruction Register', shortRole: 'Opcode & Operand Word Latch' },
  { id: 'CU', code: 'CU', name: 'Control Unit', shortRole: 'Micro-op & Datapath Orchestrator' },
  { id: 'REG_FILE', code: 'RF', name: 'Register File', shortRole: '32 GPRs (x0–x31), Dual Read Ports' },
  { id: 'ALU', code: 'ALU', name: 'Arithmetic Logic Unit', shortRole: '32-Bit Parallel Adder & Logic' },
  { id: 'MEMORY', code: 'MEM', name: 'Main Memory Bus', shortRole: 'System Instruction & Data Storage' },
  { id: 'CACHE', code: 'L1/L2', name: 'Cache Subsystem', shortRole: 'Ultra-Fast SRAM Latency Bridge' },
  { id: 'PIPELINE', code: 'PIPE', name: 'Pipeline Controller', shortRole: '5-Stage Synchronous Overlap' }
];

export const ComponentIndexOverlay: React.FC<ComponentIndexOverlayProps> = ({
  scrollProgress,
  activeComponentId,
  onSelectComponent,
  isModalOpen = false
}) => {
  // Only visible during Architecture Exploration zone (0.45 to 0.65)
  // Hide if an overlay modal/inspector is actively open or if user scrolled beyond
  const isVisible = scrollProgress >= 0.45 && scrollProgress < 0.65 && !isModalOpen;

  if (!isVisible) return null;

  return (
    <aside
      className="tech-panel edu-component-index"
      style={{
        position: 'fixed',
        left: '28px',
        top: '84px',
        width: '320px',
        maxWidth: 'calc(100vw - 48px)',
        zIndex: 25,
        borderRadius: '4px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        borderLeft: '3px solid #ff6a00',
        animation: 'fadeIn 0.25s ease-out',
        maxHeight: 'calc(100vh - 120px)',
        overflowY: 'auto'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Cpu size={14} color="#ff6a00" />
          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '12px',
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: '0.06em'
            }}
          >
            ARCHITECTURE EXPLORER
          </span>
        </div>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '9px',
            color: '#ff8533',
            background: 'rgba(255, 106, 0, 0.1)',
            padding: '2px 6px',
            borderRadius: '2px',
            border: '1px solid rgba(255, 106, 0, 0.3)'
          }}
        >
          8 UNITS
        </span>
      </div>

      <div
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: '11px',
          color: '#8b949e',
          lineHeight: 1.4
        }}
      >
        Select any core unit below or click directly in 3D to inspect inputs, outputs, and architectural specs:
      </div>

      {/* Index List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {INDEX_ITEMS.map((item) => {
          const isSelected = activeComponentId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                audio.playClick();
                onSelectComponent(item.id);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 8px',
                background: isSelected ? 'rgba(255, 106, 0, 0.16)' : 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${isSelected ? '#ff6a00' : 'rgba(255, 255, 255, 0.06)'}`,
                borderRadius: '3px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.borderColor = 'rgba(255, 106, 0, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, overflow: 'hidden' }}>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '9px',
                    fontWeight: 700,
                    color: isSelected ? '#000000' : '#ff6a00',
                    background: isSelected ? '#ff6a00' : 'rgba(255, 106, 0, 0.12)',
                    padding: '2px 5px',
                    borderRadius: '2px',
                    flexShrink: 0
                  }}
                >
                  {item.code}
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span
                    style={{
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: '11px',
                      fontWeight: 600,
                      color: isSelected ? '#ffffff' : '#d0d7de',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {item.name}
                  </span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '9px',
                      color: isSelected ? '#ff8533' : '#6e7681',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {item.shortRole}
                  </span>
                </div>
              </div>

              <ChevronRight
                size={13}
                color={isSelected ? '#ff6a00' : '#4a5360'}
                style={{ flexShrink: 0 }}
              />
            </button>
          );
        })}
      </div>
    </aside>
  );
};
