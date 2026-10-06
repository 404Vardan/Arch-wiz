import React from 'react';
import { Html } from '@react-three/drei';
import { ComponentLifecycleState } from '../../engine/CPUExecutionEngine';

interface SimulatorALUProps {
  position: [number, number, number];
  lifecycleState: ComponentLifecycleState;
  isActive: boolean;
  stageIndex?: number;
  inputA: number;
  inputB: number;
  result: number;
  flags: { zero: boolean; negative: boolean; carry: boolean; overflow: boolean };
  onInspect?: () => void;
}

export const SimulatorALU: React.FC<SimulatorALUProps> = ({
  position,
  lifecycleState,
  isActive,
  stageIndex = 0,
  inputA,
  inputB,
  result,
  flags,
  onInspect
}) => {
  const stateColors: Record<ComponentLifecycleState, string> = {
    IDLE: '#64748b',
    RECEIVING: '#fbbf24',
    PROCESSING: '#ff6a00',
    SENDING: '#4ade80',
    COMPLETE: '#4ade80'
  };

  const activeColor = stateColors[lifecycleState] || '#ff6a00';

  return (
    <group position={position} onClick={onInspect}>
      {/* 3D ALU Chevron / Trapezoid Geometry */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.8, 1.2, 1.8, 4]} />
        <meshStandardMaterial
          color="#181b24"
          metalness={0.8}
          roughness={0.2}
          emissive={isActive ? activeColor : '#000000'}
          emissiveIntensity={isActive ? 0.4 : 0.0}
        />
      </mesh>

      {/* Gold Core Trim */}
      <mesh position={[0, 0, 0.26]}>
        <ringGeometry args={[0.3, 0.45, 16]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Input Port A (Top-Left from RegFile) */}
      <mesh position={[-0.8, 0.95, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.2, 16]} />
        <meshStandardMaterial color="#ffd700" emissive="#ffd700" emissiveIntensity={0.8} />
      </mesh>

      {/* Input Port B (Top-Right from RegFile) */}
      <mesh position={[0.8, 0.95, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.2, 16]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.8} />
      </mesh>

      {/* Control Input Port (Right side from CU ALUOp line) */}
      <mesh position={[1.05, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.2, 16]} />
        <meshStandardMaterial color="#ff8533" emissive="#ff8533" emissiveIntensity={0.8} />
      </mesh>

      {/* Output Port (Bottom to Write-back bus) */}
      <mesh position={[0, -0.95, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.2, 16]} />
        <meshStandardMaterial color="#4ade80" emissive="#4ade80" emissiveIntensity={0.8} />
      </mesh>

      {/* High-Contrast Technical Label Overlay */}
      <Html position={[0, 0, 0.28]} center transform distanceFactor={9} zIndexRange={[10, 40]}>
        <div
          onClick={onInspect}
          style={{
            width: '290px',
            background: 'rgba(10, 12, 18, 0.95)',
            border: `1.5px solid ${isActive ? activeColor : 'rgba(255, 255, 255, 0.15)'}`,
            borderRadius: '4px',
            padding: '8px 12px',
            boxShadow: isActive ? `0 0 16px ${activeColor}40` : 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            userSelect: 'none',
            cursor: onInspect ? 'pointer' : 'default',
            pointerEvents: onInspect ? 'auto' : 'none'
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
              ALU (ARITHMETIC LOGIC UNIT)
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

          {/* Real-time Math Core Readout synchronized with actual execution stage */}
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.6)',
              padding: '5px 8px',
              borderRadius: '2px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px'
            }}
          >
            {/* Operands line */}
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9.5px', color: '#94a3b8' }}>
              {stageIndex < 2
                ? 'OPERANDS: STANDBY (A: --, B: --)'
                : `OPERANDS: A = ${inputA || 20} (x1) | B = ${inputB || 22} (x2)`}
            </div>

            {/* Arithmetic Result line */}
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '14px',
                fontWeight: 700,
                color: stageIndex >= 3 ? '#4ade80' : '#64748b'
              }}
            >
              {stageIndex < 2 && 'STANDBY // WAITING FOR REG READ'}
              {stageIndex === 2 && 'LATCHED // READY FOR EXECUTE'}
              {stageIndex === 3 && `${inputA || 20} + ${inputB || 22} = ${result || 42}`}
              {stageIndex === 4 && `RESULT: 42 (COMMITTED TO x3)`}
            </div>
          </div>

          {/* Derived Condition Flags Bar (Clearly identified as non-architectural for RISC-V) */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              paddingTop: '3px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '7.5px', color: '#64748b' }}>
                DERIVED ALU STATUS (Non-architectural flags):
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-around',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '8px',
                color: stageIndex >= 3 ? '#94a3b8' : '#475569'
              }}
            >
              <span>ZERO: {flags.zero ? '1' : '0'}</span>
              <span>NEG: {flags.negative ? '1' : '0'}</span>
              <span>CARRY: {flags.carry ? '1' : '0'}</span>
              <span>OVR: {flags.overflow ? '1' : '0'}</span>
            </div>
          </div>

          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '8px',
              color: '#94a3b8',
              textAlign: 'center',
              lineHeight: '1.2'
            }}
          >
            Performs arithmetic and logical operations.
          </div>
        </div>
      </Html>
    </group>
  );
};
