import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';

interface InstructionPacketProps {
  points: [number, number, number][];
  color: string;
  label: string;
  subLabel?: string;
  progress: number; // 0.0 to 1.0
  visible: boolean;
}

export const InstructionPacket: React.FC<InstructionPacketProps> = ({
  points,
  color,
  label,
  subLabel,
  progress,
  visible
}) => {
  const curve = useMemo(() => {
    const vectors = points.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
    return new THREE.CatmullRomCurve3(vectors, false, 'catmullrom', 0.1);
  }, [points]);

  if (!visible) return null;

  const clampedT = Math.max(0, Math.min(1, progress));
  const currentPos = curve.getPoint(clampedT);

  return (
    <group position={[currentPos.x, currentPos.y, currentPos.z]}>
      {/* Glowing Packet Core */}
      <mesh>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>

      {/* Outer Halo */}
      <mesh>
        <sphereGeometry args={[0.26, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} toneMapped={false} />
      </mesh>

      {/* Floating High-Contrast Value Label */}
      <Html position={[0, 0.45, 0]} center transform distanceFactor={8}>
        <div
          style={{
            background: 'rgba(10, 12, 16, 0.95)',
            border: `1.5px solid ${color}`,
            borderRadius: '4px',
            padding: '3px 8px',
            boxShadow: `0 0 12px ${color}60`,
            fontFamily: "'JetBrains Mono', monospace",
            whiteSpace: 'nowrap',
            userSelect: 'none',
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1px'
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff' }}>
            {label}
          </span>
          {subLabel && (
            <span style={{ fontSize: '8px', color: color, fontWeight: 600 }}>
              {subLabel}
            </span>
          )}
        </div>
      </Html>
    </group>
  );
};
