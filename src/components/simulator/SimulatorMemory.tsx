import React from 'react';
import { Html } from '@react-three/drei';
import { ComponentLifecycleState } from '../../engine/CPUExecutionEngine';

interface SimulatorMemoryProps {
  position: [number, number, number];
  lifecycleState: ComponentLifecycleState;
  isActive: boolean;
  instructionWord: string;
}

export const SimulatorMemory: React.FC<SimulatorMemoryProps> = ({
  position,
  lifecycleState,
  isActive,
  instructionWord
}) => {
  const stateColors: Record<ComponentLifecycleState, string> = {
    IDLE: '#64748b',
    RECEIVING: '#38bdf8',
    PROCESSING: '#fbbf24',
    SENDING: '#a855f7',
    COMPLETE: '#4ade80'
  };

  const activeColor = stateColors[lifecycleState] || '#a855f7';

  return (
    <group position={position}>
      {/* 3D Silicon Housing */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.2, 1.6, 0.5]} />
        <meshStandardMaterial
          color="#151923"
          metalness={0.7}
          roughness={0.2}
          emissive={isActive ? activeColor : '#000000'}
          emissiveIntensity={isActive ? 0.3 : 0.0}
        />
      </mesh>

      {/* Top Gold Memory Bus Array */}
      <mesh position={[0, 0.82, 0]}>
        <boxGeometry args={[3.0, 0.05, 0.45]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Input Port Connector (Left side from PC) */}
      <mesh position={[-1.65, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.2, 16]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.8} />
      </mesh>

      {/* Output Port Connector (Right side to IR) */}
      <mesh position={[1.65, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.2, 16]} />
        <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={0.8} />
      </mesh>

      {/* High-Contrast Technical Label Overlay */}
      <Html position={[0, 0, 0.28]} center transform distanceFactor={9}>
        <div
          style={{
            width: '260px',
            background: 'rgba(10, 12, 18, 0.94)',
            border: `1.5px solid ${isActive ? activeColor : 'rgba(255, 255, 255, 0.15)'}`,
            borderRadius: '4px',
            padding: '8px 12px',
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
              MAIN MEMORY // SRAM
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
              fontSize: '12px',
              fontWeight: 700,
              color: '#c084fc',
              textAlign: 'center',
              background: 'rgba(0, 0, 0, 0.5)',
              padding: '4px 6px',
              borderRadius: '2px',
              marginTop: '2px'
            }}
          >
            M[0x0040] ──► 0x002081B3
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
            <span>ADDR BUS: 0x0040</span>
            <span>DATA BUS: {instructionWord}</span>
          </div>
        </div>
      </Html>
    </group>
  );
};
