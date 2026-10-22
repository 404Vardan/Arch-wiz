import React, { useState, useMemo } from 'react';
import { CheckCircle2, AlertCircle, ArrowRight, Database, RefreshCw, Cpu, Layers, Info } from 'lucide-react';
import { CacheFlowType } from '../../types';
import { isZoneActive } from '../../data/sceneZones';
import { audio } from '../../utils/audio';

interface CacheSectionProps {
  scrollProgress: number;
  isInspectorOpen?: boolean;
}

type CacheMapping = 'DIRECT' | '2WAY';

interface CacheLine {
  valid: boolean;
  tag: string;
  data: string;
  lru: number;
}

export const CacheSection: React.FC<CacheSectionProps> = ({ scrollProgress, isInspectorOpen = false }) => {
  // Mutually exclusive scene zone check: strictly active in CACHE zone (0.80 to 0.89)
  const isVisible = isZoneActive(scrollProgress, 'CACHE') && !isInspectorOpen;

  const [activeFlow, setActiveFlow] = useState<CacheFlowType>('HIT');
  const [activeAddress, setActiveAddress] = useState<string>('0x004010');
  const [stats, setStats] = useState<{ hits: number; misses: number }>({ hits: 4, misses: 1 });

  // 4-Set Cache Matrix
  const [cacheLines, setCacheLines] = useState<Record<number, CacheLine[]>>({
    0: [{ valid: true, tag: '0x000401', data: 'ADD x3, x1, x2', lru: 1 }],
    1: [{ valid: true, tag: '0x000402', data: 'SUB x4, x1, x2', lru: 2 }],
    2: [{ valid: false, tag: '0x000000', data: '[EMPTY BLOCK]', lru: 0 }],
    3: [{ valid: true, tag: '0x000550', data: 'LW x5, 0(x1)', lru: 3 }]
  });

  // Mathematically derive 32-bit bitfields from the selected address
  const addressDecomposition = useMemo(() => {
    const cleanHex = activeAddress.replace(/^0x/i, '');
    const num = parseInt(cleanHex, 16) || 0;
    const bin32 = (num >>> 0).toString(2).padStart(32, '0');

    // Educational Direct-Mapped Cache Organization:
    // Block size: 4 bytes (Offset = bits [1:0], 2 bits)
    // Sets: 4 sets (Index = bits [3:2], 2 bits -> Sets 0-3)
    // Tag: Remaining 28 bits (bits [31:4])
    const offsetBits = bin32.slice(30, 32);
    const indexBits = bin32.slice(28, 30);
    const tagBits = bin32.slice(0, 28);

    const setIndex = parseInt(indexBits, 2);
    const byteOffset = parseInt(offsetBits, 2);
    const tagHex = '0x' + (parseInt(tagBits, 2) >>> 0).toString(16).toUpperCase().padStart(6, '0');

    return {
      bin32,
      offsetBits,
      indexBits,
      tagBits,
      setIndex,
      byteOffset,
      tagHex
    };
  }, [activeAddress]);

  if (!isVisible) return null;

  const hitRate = Math.round((stats.hits / Math.max(1, stats.hits + stats.misses)) * 100);

  const handleTestHit = () => {
    audio.playCacheHit();
    setActiveFlow('HIT');
    setActiveAddress('0x004010'); // maps to Set 0 (bits [3:2] = 00), tag matches!
    setStats((prev) => ({ ...prev, hits: prev.hits + 1 }));
  };

  const handleTestMiss = () => {
    audio.playCacheMiss();
    setActiveFlow('MISS');
    setActiveAddress('0x009838'); // maps to Set 2 (bits [3:2] = 10), Set 2 is empty/mismatch!
    setStats((prev) => ({ ...prev, misses: prev.misses + 1 }));
    // Refill Set 2 in educational model
    setCacheLines((prev) => ({
      ...prev,
      2: [{ valid: true, tag: '0x000983', data: 'M[0x009838] DATA', lru: Date.now() }]
    }));
  };

  const handlePresetLookup = (addr: string, isHit: boolean) => {
    setActiveAddress(addr);
    if (isHit) {
      audio.playCacheHit();
      setActiveFlow('HIT');
      setStats((prev) => ({ ...prev, hits: prev.hits + 1 }));
    } else {
      audio.playCacheMiss();
      setActiveFlow('MISS');
      setStats((prev) => ({ ...prev, misses: prev.misses + 1 }));
      setCacheLines((prev) => ({
        ...prev,
        2: [{ valid: true, tag: '0x000983', data: 'REFILLED_BLOCK', lru: Date.now() }]
      }));
    }
  };

  return (
    <aside
      className="tech-panel edu-panel-dock"
      style={{
        position: 'fixed',
        left: '28px',
        bottom: '24px',
        width: '560px',
        maxWidth: 'calc(100vw - 56px)',
        maxHeight: 'calc(100vh - 100px)',
        zIndex: 40,
        borderRadius: '4px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        borderLeft: '3px solid #ff6a00',
        animation: 'fadeIn 0.25s ease-out',
        overflowY: 'auto'
      }}
    >
      {/* 1. Header with Stats Counter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9px',
              letterSpacing: '0.14em',
              color: '#ff6a00',
              textTransform: 'uppercase'
            }}
          >
            MEMORY HIERARCHY & LATENCY BRIDGING
          </div>
          <h2
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '22px',
              fontWeight: 700,
              color: '#ffffff',
              marginTop: '1px'
            }}
          >
            L1/L2 CACHE SUBSYSTEM
          </h2>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              color: '#8b949e'
            }}
          >
            Organization: 4 Sets Direct-Mapped (4-Byte Line Size)
          </div>
        </div>

        {/* Live Hit-Rate Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 10px',
            background: 'rgba(255, 106, 0, 0.1)',
            border: '1px solid rgba(255, 106, 0, 0.3)',
            borderRadius: '2px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px'
          }}
        >
          <span style={{ color: '#8b949e' }}>HIT RATE:</span>
          <span style={{ color: '#ff6a00', fontWeight: 700 }}>{hitRate}%</span>
          <span style={{ color: '#6e7681', fontSize: '9px' }}>({stats.hits}H / {stats.misses}M)</span>
        </div>
      </div>

      {/* 2. WHAT IS HAPPENING (Concise Explanation) */}
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.35)',
          padding: '8px 10px',
          borderRadius: '3px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: '3px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
            {activeFlow === 'HIT' ? 'L1 Cache Hit: 1-Cycle Fast Return' : 'L1 Cache Miss: Main Memory Refill Flow'}
          </span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#ff8533' }}>
            WHAT IS HAPPENING
          </span>
        </div>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#cbd5e1', lineHeight: 1.45, margin: 0 }}>
          {activeFlow === 'HIT'
            ? 'The CPU emits an address. Set 0 tag matches the valid cached block. Data is served directly from high-speed L1 SRAM in ~1.2 ns (1 clock cycle) without stalling the datapath.'
            : 'Set 2 tag does not match or line is empty. The request proceeds to slower Main Memory (DRAM). A cache block is fetched across system buses, refilling Set 2, and returned to the CPU with a ~85 ns latency penalty.'}
        </p>
      </div>

      {/* 3. VISUAL FLOW: Explanatory Memory-Access Diagram (SVG) */}
      <div
        style={{
          background: 'rgba(10, 13, 18, 0.85)',
          padding: '10px 12px',
          borderRadius: '3px',
          border: '1px solid rgba(255, 106, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#ff8533',
              fontWeight: 700
            }}
          >
            MEMORY-ACCESS FLOW PATH
          </span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: activeFlow === 'HIT' ? '#4ade80' : '#38bdf8' }}>
            {activeFlow === 'HIT' ? '● HIT ROUTE ACTIVE (~1.2 ns)' : '● MISS & REFILL ROUTE ACTIVE (~85 ns)'}
          </span>
        </div>

        {/* SVG Flow Diagram */}
        <div style={{ width: '100%', overflowX: 'auto', padding: '2px 0' }}>
          <svg viewBox="0 0 500 68" style={{ width: '100%', minWidth: '470px', height: '62px', display: 'block' }}>
            {/* Box 1: CPU Core */}
            <rect x="10" y="16" width="65" height="34" rx="3" fill="#12161f" stroke="#38bdf8" strokeWidth="1.2" />
            <text x="42" y="36" textAnchor="middle" fill="#ffffff" fontFamily="'JetBrains Mono', monospace" fontSize="10px" fontWeight="600">CPU</text>

            {/* Path: CPU -> L1 */}
            <line x1="75" y1="33" x2="130" y2="33" stroke="#ff6a00" strokeWidth="1.8" />
            <polygon points="126,29 133,33 126,37" fill="#ff6a00" />
            <text x="102" y="27" textAnchor="middle" fill="#8b949e" fontFamily="'JetBrains Mono', monospace" fontSize="8px">REQ</text>

            {/* Box 2: L1 Cache Lookup */}
            <rect
              x="135"
              y="10"
              width="100"
              height="46"
              rx="3"
              fill={activeFlow === 'HIT' ? 'rgba(74, 222, 128, 0.15)' : 'rgba(239, 68, 68, 0.15)'}
              stroke={activeFlow === 'HIT' ? '#4ade80' : '#ef4444'}
              strokeWidth="1.5"
            />
            <text x="185" y="28" textAnchor="middle" fill="#ffffff" fontFamily="'Space Grotesk', sans-serif" fontSize="10px" fontWeight="700">L1 CACHE</text>
            <text
              x="185"
              y="44"
              textAnchor="middle"
              fill={activeFlow === 'HIT' ? '#4ade80' : '#f87171'}
              fontFamily="'JetBrains Mono', monospace"
              fontSize="9px"
              fontWeight="600"
            >
              {activeFlow === 'HIT' ? 'TAG MATCH [HIT]' : 'TAG MISMATCH'}
            </text>

            {/* If HIT: L1 Return Directly to CPU (top return loop) */}
            {activeFlow === 'HIT' && (
              <g>
                <path d="M 185 10 L 185 4 Q 185 2 183 2 L 44 2 Q 42 2 42 4 L 42 16" fill="none" stroke="#4ade80" strokeWidth="1.8" strokeDasharray="3,2" />
                <polygon points="39,12 42,16 45,12" fill="#4ade80" />
                <text x="110" y="9" textAnchor="middle" fill="#4ade80" fontFamily="'JetBrains Mono', monospace" fontSize="8px" fontWeight="700">DATA RETURN (~1.2ns)</text>
              </g>
            )}

            {/* If MISS: L1 -> Slower DRAM Memory */}
            <line
              x1="235"
              y1="33"
              x2="310"
              y2="33"
              stroke={activeFlow === 'MISS' ? '#ef4444' : '#333b47'}
              strokeWidth={activeFlow === 'MISS' ? 1.8 : 1}
              strokeDasharray={activeFlow === 'MISS' ? '3,2' : 'none'}
            />
            {activeFlow === 'MISS' && <polygon points="306,29 313,33 306,37" fill="#ef4444" />}

            {/* Box 3: Main Memory DRAM */}
            <rect
              x="315"
              y="10"
              width="100"
              height="46"
              rx="3"
              fill={activeFlow === 'MISS' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.02)'}
              stroke={activeFlow === 'MISS' ? '#38bdf8' : 'rgba(255, 255, 255, 0.1)'}
              strokeWidth={activeFlow === 'MISS' ? 1.5 : 1}
            />
            <text x="365" y="28" textAnchor="middle" fill="#ffffff" fontFamily="'Space Grotesk', sans-serif" fontSize="10px" fontWeight="700">MAIN MEMORY</text>
            <text x="365" y="44" textAnchor="middle" fill={activeFlow === 'MISS' ? '#38bdf8' : '#6e7681'} fontFamily="'JetBrains Mono', monospace" fontSize="9px">DRAM (~85ns)</text>

            {/* If MISS: DRAM Refill Loop -> L1 Set 2 */}
            {activeFlow === 'MISS' && (
              <g>
                <path d="M 365 56 L 365 63 Q 365 65 363 65 L 187 65 Q 185 65 185 63 L 185 56" fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeDasharray="3,2" />
                <polygon points="182,59 185,56 188,59" fill="#38bdf8" />
                <text x="275" y="62" textAnchor="middle" fill="#38bdf8" fontFamily="'JetBrains Mono', monospace" fontSize="8px" fontWeight="700">LINE REFILL INTO L1</text>
              </g>
            )}

            {/* Final Data Delivered to CPU */}
            <circle cx="475" cy="33" r="14" fill="#141820" stroke="#ff6a00" strokeWidth="1" />
            <text x="475" y="36" textAnchor="middle" fill="#ff6a00" fontFamily="'JetBrains Mono', monospace" fontSize="8px" fontWeight="700">DATA</text>
            <line x1={activeFlow === 'HIT' ? '235' : '415'} y1="33" x2="461" y2="33" stroke="#ff6a00" strokeWidth="1" strokeDasharray="2,2" />
          </svg>
        </div>
      </div>

      {/* 4. INTERACTIVE ADDRESS BREAKDOWN (Live Mathematically Computed) */}
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.4)',
          padding: '10px 12px',
          borderRadius: '3px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '6px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px'
          }}
        >
          <span style={{ color: '#8b949e' }}>
            ACTIVE ADDRESS: <strong style={{ color: '#ffffff' }}>{activeAddress}</strong>
          </span>
          <span style={{ color: '#ff6a00', fontSize: '9px' }}>
            MATHEMATICALLY DERIVED 32-BIT BITFIELDS
          </span>
        </div>

        {/* 32-bit Deconstructed Columns */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '16fr 6fr 4fr',
            gap: '4px',
            textAlign: 'center',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px'
          }}
        >
          {/* TAG [31:4] */}
          <div style={{ background: '#1c1f26', padding: '6px', borderRadius: '2px', border: '1px solid rgba(255, 106, 0, 0.2)' }}>
            <div style={{ color: '#ff6a00', fontWeight: 700, fontSize: '9px' }}>TAG [31:4] (28 BITS)</div>
            <div style={{ color: '#ffffff', fontWeight: 600, fontSize: '11px', marginTop: '1px' }}>{addressDecomposition.tagHex}</div>
            <div style={{ color: '#8b949e', fontSize: '8px', wordBreak: 'break-all', marginTop: '2px' }}>
              {addressDecomposition.tagBits.slice(0, 14)}...
            </div>
          </div>

          {/* SET INDEX [3:2] */}
          <div style={{ background: '#1c1f26', padding: '6px', borderRadius: '2px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
            <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: '9px' }}>SET INDEX [3:2]</div>
            <div style={{ color: '#38bdf8', fontWeight: 700, fontSize: '11px', marginTop: '1px' }}>
              Set {addressDecomposition.setIndex} ({addressDecomposition.indexBits})
            </div>
            <div style={{ color: '#8b949e', fontSize: '8px', marginTop: '2px' }}>
              2-bit index → 4 sets
            </div>
          </div>

          {/* BYTE OFFSET [1:0] */}
          <div style={{ background: '#1c1f26', padding: '6px', borderRadius: '2px', border: '1px solid rgba(229, 169, 60, 0.3)' }}>
            <div style={{ color: '#e5a93c', fontWeight: 700, fontSize: '9px' }}>OFFSET [1:0]</div>
            <div style={{ color: '#e5a93c', fontWeight: 700, fontSize: '11px', marginTop: '1px' }}>
              Byte {addressDecomposition.byteOffset} ({addressDecomposition.offsetBits})
            </div>
            <div style={{ color: '#8b949e', fontSize: '8px', marginTop: '2px' }}>
              4-byte block
            </div>
          </div>
        </div>

        {/* Educational Note */}
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '9px', color: '#6e7681', marginTop: '4px' }}>
          * Model: 32-bit byte-addressable memory, 4-byte cache line block size, 4 single-line sets.
        </div>
      </div>

      {/* 5. HIT / MISS TEST CONTROLS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={handleTestHit}
            className={activeFlow === 'HIT' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '6px 12px', fontSize: '10px' }}
          >
            <CheckCircle2 size={12} />
            <span>TEST CACHE HIT (0x004010)</span>
          </button>

          <button
            onClick={handleTestMiss}
            className={activeFlow === 'MISS' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '6px 12px', fontSize: '10px' }}
          >
            <AlertCircle size={12} />
            <span>TEST CACHE MISS (0x009838)</span>
          </button>
        </div>

        {/* Quick Presets */}
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={() => handlePresetLookup('0x004010', true)}
            style={{
              padding: '5px 7px',
              background: activeAddress === '0x004010' ? 'rgba(255, 106, 0, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${activeAddress === '0x004010' ? '#ff6a00' : 'rgba(255, 255, 255, 0.08)'}`,
              color: '#d0d7de',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9px',
              cursor: 'pointer',
              borderRadius: '2px'
            }}
            title="Lookup in Set 0 (Hit)"
          >
            Set 0 [Hit]
          </button>
          <button
            onClick={() => handlePresetLookup('0x004024', true)}
            style={{
              padding: '5px 7px',
              background: activeAddress === '0x004024' ? 'rgba(255, 106, 0, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${activeAddress === '0x004024' ? '#ff6a00' : 'rgba(255, 255, 255, 0.08)'}`,
              color: '#d0d7de',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9px',
              cursor: 'pointer',
              borderRadius: '2px'
            }}
            title="Lookup in Set 1 (Hit)"
          >
            Set 1 [Hit]
          </button>
          <button
            onClick={() => handlePresetLookup('0x009838', false)}
            style={{
              padding: '5px 7px',
              background: activeAddress === '0x009838' ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${activeAddress === '0x009838' ? '#38bdf8' : 'rgba(255, 255, 255, 0.08)'}`,
              color: '#d0d7de',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '9px',
              cursor: 'pointer',
              borderRadius: '2px'
            }}
            title="Lookup in Set 2 (Miss & Refill)"
          >
            Set 2 [Miss]
          </button>
        </div>
      </div>

      {/* 6. CACHE-LINE MATRIX VISUALIZATION */}
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.3)',
          borderRadius: '3px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          padding: '8px',
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '10px'
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '40px 52px 90px 1fr',
            color: '#8b949e',
            fontSize: '9px',
            paddingBottom: '5px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div>SET</div>
          <div>VALID</div>
          <div>CACHED TAG</div>
          <div>CACHED BLOCK DATA</div>
        </div>

        {[0, 1, 2, 3].map((setNum) => {
          const line = cacheLines[setNum][0];
          const isTargetSet = addressDecomposition.setIndex === setNum;
          const isHitMatch = activeFlow === 'HIT' && isTargetSet;
          const isMissRefill = activeFlow === 'MISS' && isTargetSet;

          return (
            <div
              key={setNum}
              style={{
                display: 'grid',
                gridTemplateColumns: '40px 52px 90px 1fr',
                padding: '5px 0',
                alignItems: 'center',
                background: isHitMatch
                  ? 'rgba(255, 106, 0, 0.14)'
                  : isMissRefill
                  ? 'rgba(56, 189, 248, 0.12)'
                  : 'transparent',
                borderLeft: isHitMatch
                  ? '2px solid #ff6a00'
                  : isMissRefill
                  ? '2px solid #38bdf8'
                  : '2px solid transparent',
                paddingLeft: '4px'
              }}
            >
              <div style={{ color: isTargetSet ? '#ff6a00' : '#8b949e', fontWeight: 700 }}>
                S{setNum}
              </div>
              <div>
                <span
                  style={{
                    padding: '1px 4px',
                    borderRadius: '2px',
                    fontSize: '8px',
                    fontWeight: 700,
                    background: line.valid ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: line.valid ? '#4ade80' : '#f87171'
                  }}
                >
                  {line.valid ? 'V=1' : 'V=0'}
                </span>
              </div>
              <div style={{ color: '#d0d7de', fontSize: '9px' }}>{line.tag}</div>
              <div style={{ color: line.valid ? '#ffffff' : '#6e7681', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{line.data}</span>
                {isHitMatch && <span style={{ color: '#ff6a00', fontSize: '8px', fontWeight: 700 }}>[HIT MATCH]</span>}
                {isMissRefill && <span style={{ color: '#38bdf8', fontSize: '8px', fontWeight: 700 }}>[REFILLED]</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* 7. CURRENT STATE & LATENCY COMPARISON */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px'
        }}
      >
        <div
          style={{
            padding: '8px 10px',
            background: 'rgba(255, 106, 0, 0.08)',
            border: '1px solid rgba(255, 106, 0, 0.25)',
            borderRadius: '2px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px'
          }}
        >
          <div style={{ color: '#8b949e', fontSize: '8px' }}>L1 SRAM ACCESS LATENCY</div>
          <div style={{ color: '#ff6a00', fontWeight: 700, fontSize: '13px' }}>~1.2 ns (1 Clock Cycle)</div>
          <div style={{ color: '#6e7681', fontSize: '8px' }}>On-chip static 6T RAM cells</div>
        </div>

        <div
          style={{
            padding: '8px 10px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '2px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '10px'
          }}
        >
          <div style={{ color: '#8b949e', fontSize: '8px' }}>MAIN DRAM LATENCY</div>
          <div style={{ color: '#f87171', fontWeight: 700, fontSize: '13px' }}>~85 ns (100+ Cycles)</div>
          <div style={{ color: '#6e7681', fontSize: '8px' }}>Off-chip bus capacitance & row buffer</div>
        </div>
      </div>
    </aside>
  );
};
