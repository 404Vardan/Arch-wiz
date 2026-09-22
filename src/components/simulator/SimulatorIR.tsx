import React from 'react';
import { Html } from '@react-three/drei';
import { ComponentLifecycleState } from '../../engine/CPUExecutionEngine';

interface SimulatorIRProps {
  position: [number, number, number];
  lifecycleState: ComponentLifecycleState;
  isActive: boolean;
  instructionString: string;
  rawHex: string;
}

export const SimulatorIR: React.FC<SimulatorIRProps> = ({
  position,
  lifecycleState,
  isActive,
  instructionString,
  rawHex
}) => {
  const stateColors: Record<ComponentLifecycleState, string> = {
    IDLE: '#64748b',
    RECEIVING: '#c084fc',
    PROCESSING: '#fbbf24',
    SENDING: '#ff6a00',
    COMPLETE: '#4ade80'
  };

  const activeColor = stateColors[lifecycleState] || '#ff6a00';

  return (
    <group position={position}>
      {/* 3D Silicon Housing */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.8, 1.4, 0.5]} />
        <meshStandardMaterial
          color="#161922"
          metalness={0.7}
          roughness={0.25}
          emissive={isActive ? activeColor : '#000000'}
          emissiveIntensity={isActive ? 0.35 : 0.0}
        />
      </mesh>

      {/* Gold Trim */}
      <mesh position={[0, 0.72, 0]}>
        <boxGeometry args={[2.6, 0.05, 0.45]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Input Port Connector (Left side from Memory) */}
      <mesh position={[-1.45, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.2, 16]} />
        <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={0.8} />
      </mesh>

      {/* Output Port Connector (Bottom side to Control Unit) */}
      <mesh position={[0, -0.75, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.2, 16]} />
        <meshStandardMaterial color="#ff6a00" emissive="#ff6a00" emissiveIntensity={0.8} />
      </mesh>

      {/* High-Contrast Technical Label Overlay */}
      <Html position={[0, 0, 0.28]} center transform distanceFactor={9}>
        <div
          style={{
            width: '230px',
            background: 'rgba(10, 12, 18, 0.94)',
            border: `1.5px solid ${isActive ? activeColor : 'rgba(255, 255, 255, 0.15)'}`,
            borderRadius: '4px',
            padding: '8px 10px',
            boxShadow: isActive ? `0 0 16px ${activeColor}40` : 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
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
              INSTRUCTION REGISTER (IR)
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

          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '14px',
              fontWeight: 700,
              color: '#ffffff',
              textAlign: 'center',
              background: 'rgba(0, 0, 0, 0.5)',
              padding: '4px 0',
              borderRadius: '2px',
              marginTop: '2px'
            }}
          >
            {instructionString}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '8px',
              color: '#94a3b8'
            }}
          >
            <span>HEX: {rawHex}</span>
            <span style={{ color: '#ff8533' }}>DISPATCHES TO CU ▼</span>
          </div>
        </div>
      </Html>
    </group>
  );
};
