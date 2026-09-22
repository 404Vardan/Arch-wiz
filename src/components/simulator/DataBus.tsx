import React, { useMemo } from 'react';
import * as THREE from 'three';

interface DataBusProps {
  points: [number, number, number][];
  color: string;
  isActive: boolean;
  busWidth?: number;
}

export const DataBus: React.FC<DataBusProps> = ({
  points,
  color,
  isActive,
  busWidth = 0.04
}) => {
  const curve = useMemo(() => {
    const vectors = points.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
    return new THREE.CatmullRomCurve3(vectors, false, 'catmullrom', 0.1);
  }, [points]);

  const tubeGeometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, 64, busWidth, 8, false);
  }, [curve, busWidth]);

  return (
    <group>
      {/* Physical 3D Bus Line */}
      <mesh geometry={tubeGeometry}>
        <meshStandardMaterial
          color={isActive ? color : '#262c36'}
          metalness={0.6}
          roughness={0.3}
          emissive={isActive ? color : '#000000'}
          emissiveIntensity={isActive ? 0.6 : 0.0}
        />
      </mesh>
    </group>
  );
};
