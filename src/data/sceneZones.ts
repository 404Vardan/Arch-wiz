// Mutually Exclusive Scene Zones and Timeline Definitions for ARCH-VIZ
// Central source of truth for scroll-progress mapping and educational overlays

export type SceneZoneId =
  | 'HERO'
  | 'HARDWARE_REVEAL'
  | 'ARCHITECTURE'
  | 'EXECUTION'
  | 'CACHE'
  | 'PIPELINE'
  | 'FINAL';

export interface SceneZone {
  id: SceneZoneId;
  name: string;
  minProgress: number;
  maxProgress: number;
  centerProgress: number;
  description: string;
}

export const SCENE_ZONES: Record<SceneZoneId, SceneZone> = {
  HERO: {
    id: 'HERO',
    name: 'Landing Hero',
    minProgress: 0.0,
    maxProgress: 0.12,
    centerProgress: 0.05,
    description: 'Cinematic workstation introduction and closed laptop angle'
  },
  HARDWARE_REVEAL: {
    id: 'HARDWARE_REVEAL',
    name: 'Hardware Reveal',
    minProgress: 0.12,
    maxProgress: 0.45,
    centerProgress: 0.28,
    description: 'Laptop opening, display activation, and internal silicon substrate reveal'
  },
  ARCHITECTURE: {
    id: 'ARCHITECTURE',
    name: 'CPU Architecture',
    minProgress: 0.45,
    maxProgress: 0.65,
    centerProgress: 0.55,
    description: 'Exploded CPU architecture, component inspection, and technical index'
  },
  EXECUTION: {
    id: 'EXECUTION',
    name: 'Instruction Execution',
    minProgress: 0.65,
    maxProgress: 0.80,
    centerProgress: 0.72,
    description: '5-stage datapath execution of ADD x3, x1, x2 with active bus routes'
  },
  CACHE: {
    id: 'CACHE',
    name: 'Cache Subsystem',
    minProgress: 0.80,
    maxProgress: 0.89,
    centerProgress: 0.84,
    description: 'Hierarchical memory access flow, live address bitfield decomposition, and hit/miss matrix'
  },
  PIPELINE: {
    id: 'PIPELINE',
    name: 'Pipeline & Hazards',
    minProgress: 0.89,
    maxProgress: 0.95,
    centerProgress: 0.92,
    description: 'Instruction timing lanes, data hazard forwarding/stalls, and 2-bit branch prediction FSM'
  },
  FINAL: {
    id: 'FINAL',
    name: 'Lab Suite Overview',
    minProgress: 0.95,
    maxProgress: 1.0,
    centerProgress: 0.98,
    description: 'Final technical overview, summary, and simulator lab launch'
  }
};

/**
 * Resolves the single active mutually exclusive scene zone.
 * Strictly prevents multiple educational overlays from appearing simultaneously at boundary edges.
 */
export function getActiveSceneZone(progress: number): SceneZoneId {
  const p = Math.max(0, Math.min(1, progress));
  if (p < 0.12) return 'HERO';
  if (p < 0.45) return 'HARDWARE_REVEAL';
  if (p < 0.65) return 'ARCHITECTURE';
  if (p < 0.80) return 'EXECUTION';
  if (p < 0.89) return 'CACHE';
  if (p < 0.95) return 'PIPELINE';
  return 'FINAL';
}

/**
 * Checks if a specific zone is active using mutually exclusive half-open intervals.
 */
export function isZoneActive(progress: number, zoneId: SceneZoneId): boolean {
  return getActiveSceneZone(progress) === zoneId;
}
