import React, { useState } from 'react';
import { X, Gauge, Zap, BarChart3, Clock, TrendingUp, ShieldAlert } from 'lucide-react';
import { audio } from '../../utils/audio';

interface BenchmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BenchmarkModal: React.FC<BenchmarkModalProps> = ({ isOpen, onClose }) => {
  const [instructionCount, setInstructionCount] = useState<number>(100000); // 100k instructions
  const [cacheMissRate, setCacheMissRate] = useState<number>(5); // 5%
  const [branchHazardRate, setBranchHazardRate] = useState<number>(10); // 10%

  if (!isOpen) return null;

  // Single-Cycle: Tclk = 850 ps (0.85 ns), CPI = 1.0
  const singleCycleTimeNs = 0.85;
  const singleCycleCPI = 1.0;
  const singleCycleTotalMs = (instructionCount * singleCycleCPI * singleCycleTimeNs) / 1e6;

  // Multi-Cycle: Tclk = 200 ps (0.20 ns), Average CPI = 4.2
  const multiCycleTimeNs = 0.20;
  const multiCycleCPI = 4.2;
  const multiCycleTotalMs = (instructionCount * multiCycleCPI * multiCycleTimeNs) / 1e6;

  // 5-Stage Pipelined (with forwarding): Tclk = 220 ps (0.22 ns)
  // Effective CPI = 1.0 + (branchHazardRate% * 1 stall) + (cacheMissRate% * 15 cycles L2/RAM stall)
  const pipeBaseCPI = 1.0;
  const branchStallPenalty = (branchHazardRate / 100) * 1.5;
  const cacheStallPenalty = (cacheMissRate / 100) * 12.0;
  const pipelinedCPI = Number((pipeBaseCPI + branchStallPenalty + cacheStallPenalty).toFixed(2));
  const pipelinedTimeNs = 0.22;
  const pipelinedTotalMs = (instructionCount * pipelinedCPI * pipelinedTimeNs) / 1e6;

  // Speedup relative to Single-Cycle baseline
  const speedup = (singleCycleTotalMs / pipelinedTotalMs).toFixed(2);

  // Normalization for visual bars (max bar = 100%)
  const maxTime = Math.max(singleCycleTotalMs, multiCycleTotalMs, pipelinedTotalMs);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(5, 6, 8, 0.88)',
        backdropFilter: 'blur(16px)',
        padding: '20px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '960px',
          maxHeight: '90vh',
          background: 'var(--bg-secondary)',
          border: '1px solid rgba(255, 106, 0, 0.35)',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(255, 106, 0, 0.18)',
          borderRadius: '6px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 28px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                background: 'rgba(255, 106, 0, 0.12)',
                border: '1px solid #ff6a00',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px'
              }}
            >
              <Gauge size={18} color="#ff6a00" />
            </div>
            <div>
              <div
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  fontSize: '18px',
                  color: '#ffffff',
                  letterSpacing: '0.04em'
                }}
              >
                COA ARCHITECTURE BENCHMARK & PERFORMANCE MODEL
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '11px',
                  color: '#8b949e',
                  letterSpacing: '0.08em'
                }}
              >
                QUANTITATIVE CPU TIME: T = INSTRUCTION COUNT × CPI × CLOCK CYCLE TIME
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              audio.playClick();
              onClose();
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#8b949e',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Tuning Sliders */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '16px',
              background: 'rgba(0, 0, 0, 0.3)',
              padding: '18px',
              borderRadius: '4px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            {/* Instruction Count */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#8b949e' }}>
                  INSTRUCTION COUNT (I)
                </span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#ff6a00', fontWeight: 600 }}>
                  {instructionCount.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min="10000"
                max="500000"
                step="10000"
                value={instructionCount}
                onChange={(e) => {
                  setInstructionCount(Number(e.target.value));
                }}
                style={{ width: '100%', accentColor: '#ff6a00' }}
              />
            </div>

            {/* Cache Miss Rate */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#8b949e' }}>
                  CACHE MISS RATE (%)
                </span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#38bdf8', fontWeight: 600 }}>
                  {cacheMissRate}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="25"
                step="1"
                value={cacheMissRate}
                onChange={(e) => {
                  setCacheMissRate(Number(e.target.value));
                }}
                style={{ width: '100%', accentColor: '#38bdf8' }}
              />
            </div>

            {/* Branch Misprediction Rate */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: '#8b949e' }}>
                  BRANCH MISPREDICT RATE (%)
                </span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#e5a93c', fontWeight: 600 }}>
                  {branchHazardRate}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="2"
                value={branchHazardRate}
                onChange={(e) => {
                  setBranchHazardRate(Number(e.target.value));
                }}
                style={{ width: '100%', accentColor: '#e5a93c' }}
              />
            </div>
          </div>

          {/* Comparative Results Matrix */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                color: '#8b949e'
              }}
            >
              <span>ARCHITECTURE COMPARISON</span>
              <span>
                PIPELINE SPEEDUP: <strong style={{ color: '#ff6a00', fontSize: '14px' }}>{speedup}x</strong>
              </span>
            </div>

            {/* Architecture 1: Single-Cycle */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '14px',
                borderRadius: '4px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div>
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '14px', color: '#ffffff' }}>
                    1. Single-Cycle Datapath
                  </span>
                  <span style={{ marginLeft: '10px', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#8b949e' }}>
                    t_clk = 850 ps (1.18 GHz) | CPI = 1.00
                  </span>
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', fontWeight: 600, color: '#f87171' }}>
                  {singleCycleTotalMs.toFixed(3)} ms
                </div>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${(singleCycleTotalMs / maxTime) * 100}%`,
                    height: '100%',
                    background: '#f87171',
                    borderRadius: '4px',
                    transition: 'width 0.2s ease'
                  }}
                />
              </div>
            </div>

            {/* Architecture 2: Multi-Cycle */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '14px',
                borderRadius: '4px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div>
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '14px', color: '#ffffff' }}>
                    2. Multi-Cycle Datapath
                  </span>
                  <span style={{ marginLeft: '10px', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#8b949e' }}>
                    t_clk = 200 ps (5.00 GHz) | CPI = 4.20
                  </span>
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', fontWeight: 600, color: '#e5a93c' }}>
                  {multiCycleTotalMs.toFixed(3)} ms
                </div>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${(multiCycleTotalMs / maxTime) * 100}%`,
                    height: '100%',
                    background: '#e5a93c',
                    borderRadius: '4px',
                    transition: 'width 0.2s ease'
                  }}
                />
              </div>
            </div>

            {/* Architecture 3: 5-Stage Pipelined */}
            <div
              style={{
                background: 'rgba(255, 106, 0, 0.08)',
                border: '1px solid #ff6a00',
                padding: '14px',
                borderRadius: '4px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div>
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '14px', color: '#ff6a00' }}>
                    3. 5-Stage Pipelined (With Forwarding & Cache Model)
                  </span>
                  <span style={{ marginLeft: '10px', fontFamily: "'JetBrains Mono', monospace", fontSize: '10px', color: '#d0d7de' }}>
                    t_clk = 220 ps (4.55 GHz) | Effective CPI = {pipelinedCPI}
                  </span>
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '14px', fontWeight: 700, color: '#ff6a00' }}>
                  {pipelinedTotalMs.toFixed(3)} ms
                </div>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${(pipelinedTotalMs / maxTime) * 100}%`,
                    height: '100%',
                    background: '#ff6a00',
                    borderRadius: '4px',
                    transition: 'width 0.2s ease'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Academic Amdahl's Law & CPI formula callout */}
          <div
            style={{
              padding: '12px 16px',
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '4px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px',
              color: '#8b949e',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
          >
            <div style={{ color: '#38bdf8' }}>
              COA PRINCIPLE // IRON LAW OF PROCESSOR PERFORMANCE:
            </div>
            <div>
              Execution Time = (Instruction Count) × (Cycles Per Instruction) × (Clock Cycle Time)
            </div>
            <div style={{ color: '#6e7681', fontSize: '10px' }}>
              Pipelining reduces Clock Cycle Time down to the slowest individual stage (~220 ps), maintaining near-ideal CPI = 1.0 when hazards are mitigated via forwarding.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
