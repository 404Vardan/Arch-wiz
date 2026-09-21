import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CPU_COMPONENTS } from '../../data/cpuData';
import { ExecutionStage, ComponentId } from '../../types';

interface DataFlowParticlesProps {
  currentStage: ExecutionStage | null;
  scrollProgress: number;
  isExecuting: boolean;
}

export const DataFlowParticles: React.FC<DataFlowParticlesProps> = ({
  currentStage,
  scrollProgress,
  isExecuting
}) => {
  const pointsRef = useRef<THREE.Points>(null);

  // Explosion progress
  const explosionFactor = Math.max(0, Math.min(1, (scrollProgress - 0.45) / (0.68 - 0.45)));
  const easedExplosion = explosionFactor * explosionFactor * (3 - 2 * explosionFactor);

  // Only render particles if the architecture is exploded and either we are in execution scroll range or actively running instruction
  const shouldRender = scrollProgress >= 0.58 || isExecuting;

  // Active path sequence based on stage
  const currentPathEndpoints = useMemo<[ComponentId, ComponentId][]>(() => {
    if (!currentStage) {
      // Default subtle continuous system bus pulse
      return [
        ['PC', 'MEMORY'],
        ['MEMORY', 'IR'],
        ['REG_FILE', 'ALU']
      ];
    }

    switch (currentStage) {
      case 'FETCH':
        return [
          ['PC', 'MEMORY'],
          ['MEMORY', 'IR']
        ];
      case 'DECODE':
        return [['IR', 'CU']];
      case 'REGISTER_READ':
        return [['REG_FILE', 'ALU']];
      case 'EXECUTE':
        return [['ALU', 'CU']];
      case 'WRITE_BACK':
        return [['ALU', 'REG_FILE']];
      default:
        return [];
    }
  }, [currentStage]);

  // Particle count: 32 disciplined particles
  const PARTICLE_COUNT = 32;
  const particlePositions = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), []);
  const particleData = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      t: (i / PARTICLE_COUNT),
      speed: 0.008 + (i % 3) * 0.004,
      segmentIndex: i % Math.max(1, currentPathEndpoints.length)
    }));
  }, [currentPathEndpoints.length]);

  useFrame((_, delta) => {
    if (!pointsRef.current || !shouldRender || currentPathEndpoints.length === 0) return;

    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particleData[i];
      p.t = (p.t + p.speed * (delta * 60)) % 1;

      const [fromId, toId] = currentPathEndpoints[p.segmentIndex % currentPathEndpoints.length];
      const from = CPU_COMPONENTS[fromId];
      const to = CPU_COMPONENTS[toId];

      if (from && to) {
        const fromX = from.position[0] + (from.explodedPosition[0] - from.position[0]) * easedExplosion;
        const fromY = from.position[1] + (from.explodedPosition[1] - from.position[1]) * easedExplosion;
        const fromZ = from.position[2] + (from.explodedPosition[2] - from.position[2]) * easedExplosion;

        const toX = to.position[0] + (to.explodedPosition[0] - to.position[0]) * easedExplosion;
        const toY = to.position[1] + (to.explodedPosition[1] - to.position[1]) * easedExplosion;
        const toZ = to.position[2] + (to.explodedPosition[2] - to.position[2]) * easedExplosion;

        // Slight parabolic arch along Y
        const archY = Math.sin(p.t * Math.PI) * 0.25;

        positions[i * 3] = fromX + (toX - fromX) * p.t;
        positions[i * 3 + 1] = fromY + (toY - fromY) * p.t + archY;
        positions[i * 3 + 2] = fromZ + (toZ - fromZ) * p.t;
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (!shouldRender) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particlePositions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#ff6a00"
        size={0.08}
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};
