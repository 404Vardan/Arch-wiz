import React from 'react';
import { Html } from '@react-three/drei';
import { ComponentLifecycleState, RV32IControlSignals } from '../../engine/CPUExecutionEngine';

interface SimulatorControlUnitProps {
  position: [number, number, number];
  lifecycleState: ComponentLifecycleState;
  isActive: boolean;
  controlSignals: RV32IControlSignals;
}

export const SimulatorControlUnit: React.FC<SimulatorControlUnitProps> = ({
  position,
  lifecycleState,
  isActive,
  controlSignals
}) => {
  const stateColors: Record<ComponentLifecycleState, string> = {
    IDLE: '#64748b',
    RECEIVING: '#ff8533',
    PROCESSING: '#ff6a00',
    SENDING: '#38bdf8',
    COMPLETE: '#4ade80'
  };

  const activeColor = stateColors[lifecycleState] || '#ff6a00';

  return (
    <group position={position}>
      {/* 3D Silicon Housing */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 2.2, 0.5]} />
        <meshStandardMaterial
          color="#1b1c24"
          metalness={0.7}
          roughness={0.2}
          emissive={isActive ? activeColor : '#000000'}
          emissiveIntensity={isActive ? 0.35 : 0.0}
        />
      </mesh>

      {/* Top Gold Trim */}
      <mesh position={[0, 1.12, 0]}>
        <boxGeometry args={[3.0, 0.05, 0.45]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Top Input Port (from IR) */}
      <mesh position={[0, 1.15, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.2, 16]} />
        <meshStandardMaterial color="#ff6a00" emissive="#ff6a00" emissiveIntensity={0.8} />
      </mesh>

      {/* Left Output Port (to Register File) */}
      <mesh position={[-1.65, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.2, 16]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.8} />
      </mesh>

      {/* High-Contrast Technical Label Overlay */}
      <Html position={[0, 0, 0.28]} center transform distanceFactor={9}>
        <div
          style={{
            width: '270px',
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
              CONTROL UNIT (CU DECODER)
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

          {/* Decoded Bitfields */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '4px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9px',
              background: 'rgba(0, 0, 0, 0.5)',
              padding: '6px',
              borderRadius: '2px'
            }}
          >
            <div>
              <span style={{ color: '#8b949e' }}>OP: </span>
              <span style={{ color: '#ff8533', fontWeight: 600 }}>{controlSignals.opcode}</span>
            </div>
            <div>
              <span style={{ color: '#8b949e' }}>F3: </span>
              <span style={{ color: '#ffffff' }}>{controlSignals.funct3}</span>
            </div>
            <div>
              <span style={{ color: '#8b949e' }}>F7: </span>
              <span style={{ color: '#ffffff' }}>{controlSignals.funct7}</span>
            </div>
            <div>
              <span style={{ color: '#8b949e' }}>RS1: </span>
              <span style={{ color: '#ffd700', fontWeight: 600 }}>{controlSignals.rs1}</span>
            </div>
            <div>
              <span style={{ color: '#8b949e' }}>RS2: </span>
              <span style={{ color: '#38bdf8', fontWeight: 600 }}>{controlSignals.rs2}</span>
            </div>
            <div>
              <span style={{ color: '#8b949e' }}>RD: </span>
              <span style={{ color: '#4ade80', fontWeight: 600 }}>{controlSignals.rd}</span>
            </div>
          </div>

          {/* Control Output Assertions */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9px',
              color: '#38bdf8',
              background: 'rgba(56, 189, 248, 0.1)',
              padding: '4px 6px',
              borderRadius: '2px'
            }}
          >
            <span>ALUOp: {controlSignals.aluOp}</span>
            <span>RegWrite: {controlSignals.regWrite ? '1 (ASSERTED)' : '0'}</span>
          </div>
        </div>
      </Html>
    </group>
  );
};
