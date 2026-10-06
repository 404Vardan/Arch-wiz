import React from 'react';
import { Html } from '@react-three/drei';
import { ComponentLifecycleState } from '../../engine/CPUExecutionEngine';

interface SimulatorMemoryProps {
  position: [number, number, number];
  lifecycleState: ComponentLifecycleState;
  isActive: boolean;
  instructionWord: string;
  onInspect?: () => void;
}

export const SimulatorMemory: React.FC<SimulatorMemoryProps> = ({
  position,
  lifecycleState,
  isActive,
  instructionWord,
  onInspect
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
    <group position={position} onClick={onInspect}>
      {/* 3D Silicon Housing */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.3, 1.6, 0.5]} />
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
        <boxGeometry args={[3.1, 0.05, 0.45]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Input Port Connector (Left side from PC) */}
      <mesh position={[-1.68, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.2, 16]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.8} />
      </mesh>

      {/* Output Port Connector (Right side to IR) */}
      <mesh position={[1.68, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.2, 16]} />
        <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={0.8} />
      </mesh>

      {/* High-Contrast Technical Label Overlay */}
      <Html position={[0, 0, 0.28]} center transform distanceFactor={9} zIndexRange={[10, 40]}>
        <div
          onClick={onInspect}
          style={{
            width: '260px',
            background: 'rgba(10, 12, 18, 0.95)',
            border: `1.5px solid ${isActive ? activeColor : 'rgba(255, 255, 255, 0.15)'}`,
            borderRadius: '4px',
            padding: '8px 12px',
            boxShadow: isActive ? `0 0 16px ${activeColor}40` : 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
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
              fontSize: '11.5px',
              fontWeight: 700,
              color: '#c084fc',
              textAlign: 'center',
              background: 'rgba(0, 0, 0, 0.5)',
              padding: '3px 6px',
              borderRadius: '2px',
              marginTop: '1px'
            }}
          >
            M[0x0040] ──► 0x002081B3
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
            Stores instructions and data accessed by the processor.
          </div>
        </div>
      </Html>
    </group>
  );
};
