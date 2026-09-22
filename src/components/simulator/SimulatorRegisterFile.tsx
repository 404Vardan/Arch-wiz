import React from 'react';
import { Html } from '@react-three/drei';
import { ComponentLifecycleState } from '../../engine/CPUExecutionEngine';

interface SimulatorRegisterFileProps {
  position: [number, number, number];
  lifecycleState: ComponentLifecycleState;
  isActive: boolean;
  registers: Record<string, number>;
  sourceRegs: { rs1: string; rs2: string; rd: string };
  isWriteBack: boolean;
}

export const SimulatorRegisterFile: React.FC<SimulatorRegisterFileProps> = ({
  position,
  lifecycleState,
  isActive,
  registers,
  sourceRegs,
  isWriteBack
}) => {
  const stateColors: Record<ComponentLifecycleState, string> = {
    IDLE: '#64748b',
    RECEIVING: '#38bdf8',
    PROCESSING: '#fbbf24',
    SENDING: '#ffd700',
    COMPLETE: '#4ade80'
  };

  const activeColor = stateColors[lifecycleState] || '#ffd700';

  return (
    <group position={position}>
      {/* 3D Silicon Housing */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.8, 2.4, 0.5]} />
        <meshStandardMaterial
          color="#161a23"
          metalness={0.7}
          roughness={0.2}
          emissive={isActive ? activeColor : '#000000'}
          emissiveIntensity={isActive ? 0.35 : 0.0}
        />
      </mesh>

      {/* Gold Trim */}
      <mesh position={[0, 1.22, 0]}>
        <boxGeometry args={[3.6, 0.05, 0.45]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Output Port 1 Connector (Bottom-Left to ALU input A) */}
      <mesh position={[-0.8, -1.25, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.2, 16]} />
        <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.8} />
      </mesh>

      {/* Output Port 2 Connector (Bottom-Right to ALU input B) */}
      <mesh position={[0.8, -1.25, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.2, 16]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.8} />
      </mesh>

      {/* Write Port Connector (Top-Left from ALU Writeback bus) */}
      <mesh position={[-1.95, 0.6, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.2, 16]} />
        <meshStandardMaterial color="#4ade80" emissive="#4ade80" emissiveIntensity={0.8} />
      </mesh>

      {/* High-Contrast Technical Label Overlay */}
      <Html position={[0, 0, 0.28]} center transform distanceFactor={9}>
        <div
          style={{
            width: '320px',
            background: 'rgba(10, 12, 18, 0.94)',
            border: `1.5px solid ${isActive ? activeColor : 'rgba(255, 255, 255, 0.15)'}`,
            borderRadius: '4px',
            padding: '8px 12px',
            boxShadow: isActive ? `0 0 16px ${activeColor}40` : 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            userSelect: 'none',
            pointerEvents: 'none'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '11px',
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: '0.05em'
              }}
            >
              REGISTER FILE (32 × 32b)
            </span>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '9px',
                padding: '1px 5px',
                borderRadius: '2px',
                background: `${activeColor}20`,
                color: activeColor,
                fontWeight: 600
              }}
            >
              {lifecycleState}
            </span>
          </div>

          {/* Active Registers Bank Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '6px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px'
            }}
          >
            {/* x0 */}
            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '4px', borderRadius: '2px', textAlign: 'center' }}>
              <div style={{ color: '#8b949e', fontSize: '9px' }}>x0 (zero)</div>
              <div style={{ color: '#ffffff', fontWeight: 600 }}>0</div>
            </div>

            {/* x1 (SRC 1) */}
            <div
              style={{
                background: 'rgba(255, 215, 0, 0.12)',
                border: '1px solid rgba(255, 215, 0, 0.4)',
                padding: '4px',
                borderRadius: '2px',
                textAlign: 'center'
              }}
            >
              <div style={{ color: '#ffd700', fontSize: '9px', fontWeight: 600 }}>x1 [SRC 1]</div>
              <div style={{ color: '#ffffff', fontWeight: 700 }}>{registers.x1 ?? 20}</div>
            </div>

            {/* x2 (SRC 2) */}
            <div
              style={{
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                padding: '4px',
                borderRadius: '2px',
                textAlign: 'center'
              }}
            >
              <div style={{ color: '#38bdf8', fontSize: '9px', fontWeight: 600 }}>x2 [SRC 2]</div>
              <div style={{ color: '#ffffff', fontWeight: 700 }}>{registers.x2 ?? 22}</div>
            </div>

            {/* x3 (DEST) */}
            <div
              style={{
                background: isWriteBack ? 'rgba(74, 222, 128, 0.2)' : 'rgba(255, 106, 0, 0.12)',
                border: `1px solid ${isWriteBack ? '#4ade80' : 'rgba(255, 106, 0, 0.4)'}`,
                padding: '4px',
                borderRadius: '2px',
                textAlign: 'center',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ color: isWriteBack ? '#4ade80' : '#ff8533', fontSize: '9px', fontWeight: 600 }}>
                x3 [DEST]
              </div>
              <div
                style={{
                  color: isWriteBack ? '#4ade80' : '#ffffff',
                  fontWeight: 700,
                  fontSize: isWriteBack ? '12px' : '10px'
                }}
              >
                {isWriteBack ? '42 (0→42)' : (registers.x3 ?? 0)}
              </div>
            </div>
          </div>

          {/* Dual Read Ports Readout */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '8px',
              color: '#94a3b8',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              paddingTop: '4px'
            }}
          >
            <span>PORT 1: x1 ──► 20</span>
            <span>PORT 2: x2 ──► 22</span>
            <span style={{ color: isWriteBack ? '#4ade80' : '#94a3b8' }}>
              {isWriteBack ? 'WRITE PORT: 42 COMMITTED' : 'WRITE PORT: STANDBY'}
            </span>
          </div>
        </div>
      </Html>
    </group>
  );
};
