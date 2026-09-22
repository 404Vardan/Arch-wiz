import React from 'react';
import { Html } from '@react-three/drei';
import { ComponentLifecycleState } from '../../engine/CPUExecutionEngine';

interface SimulatorPCProps {
  position: [number, number, number];
  pcValue: number;
  lifecycleState: ComponentLifecycleState;
  isActive: boolean;
}

export const SimulatorPC: React.FC<SimulatorPCProps> = ({
  position,
  pcValue,
  lifecycleState,
  isActive
}) => {
  const hexAddress = `0x${pcValue.toString(16).padStart(4, '0').toUpperCase()}`;

  const stateColors: Record<ComponentLifecycleState, string> = {
    IDLE: '#64748b',
    RECEIVING: '#38bdf8',
    PROCESSING: '#fbbf24',
    SENDING: '#ff6a00',
    COMPLETE: '#4ade80'
  };

  const activeColor = stateColors[lifecycleState] || '#ff6a00';

  return (
    <group position={position}>
      {/* 3D Silicon Housing */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.2, 1.4, 0.5]} />
        <meshStandardMaterial
          color="#161922"
          metalness={0.7}
          roughness={0.25}
          emissive={isActive ? activeColor : '#000000'}
          emissiveIntensity={isActive ? 0.35 : 0.0}
        />
      </mesh>

      {/* Gold Trim & Top Contact Pins */}
      <mesh position={[0, 0.72, 0]}>
        <boxGeometry args={[2.1, 0.05, 0.45]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Output Port Connector Pin (Right side -> Memory) */}
      <mesh position={[1.15, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.2, 16]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.8} />
      </mesh>

      {/* High-Contrast Technical Label Overlay */}
      <Html position={[0, 0, 0.28]} center transform distanceFactor={9}>
        <div
          style={{
            width: '180px',
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
              PROGRAM COUNTER
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
              fontSize: '16px',
              fontWeight: 700,
              color: '#38bdf8',
              letterSpacing: '0.05em',
              textAlign: 'center',
              background: 'rgba(0, 0, 0, 0.5)',
              padding: '3px 0',
              borderRadius: '2px',
              marginTop: '2px'
            }}
          >
            {hexAddress}
          </div>

          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '8px',
              color: '#94a3b8',
              textAlign: 'center'
            }}
          >
            EMITS INSTRUCTION ADDR
          </div>
        </div>
      </Html>
    </group>
  );
};
