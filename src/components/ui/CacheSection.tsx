import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, ArrowRight, Database, RefreshCw, Cpu } from 'lucide-react';
import { CacheFlowType } from '../../types';
import { audio } from '../../utils/audio';

interface CacheSectionProps {
  scrollProgress: number;
}

type CacheMapping = 'DIRECT' | '2WAY';

interface CacheLine {
  valid: boolean;
  tag: string;
  data: string;
  lru: number; // for replacement
}

export const CacheSection: React.FC<CacheSectionProps> = ({ scrollProgress }) => {
  const isVisible = scrollProgress >= 0.81 && scrollProgress <= 0.92;
  const [activeFlow, setActiveFlow] = useState<CacheFlowType>('HIT');
  const [mapping, setMapping] = useState<CacheMapping>('DIRECT');
  const [activeAddress, setActiveAddress] = useState<string>('0x004010');
  const [stats, setStats] = useState<{ hits: number; misses: number }>({ hits: 4, misses: 1 });

  // Interactive Cache Matrix state (4 sets)
  const [cacheLines, setCacheLines] = useState<Record<number, CacheLine[]>>({
    0: [{ valid: true, tag: '0x0040', data: 'ADD R1, R2', lru: 1 }],
    1: [{ valid: true, tag: '0x0042', data: 'SUB R3, R1', lru: 2 }],
    2: [{ valid: false, tag: '0x0000', data: '[EMPTY]', lru: 0 }],
    3: [{ valid: true, tag: '0x0055', data: 'LOAD R4, [addr]', lru: 3 }]
  });

  if (!isVisible) return null;

  const hitRate = Math.round((stats.hits / (stats.hits + stats.misses)) * 100);

  // Address parsing
  const tagBits = '0000000001000000'; // 16-bit mock tag
  const indexBits = '01'; // Set 1
  const offsetBits = '00'; // Byte 0

  const handleTestHit = () => {
    audio.playCacheHit();
    setActiveFlow('HIT');
    setActiveAddress('0x004010');
    setStats((prev) => ({ ...prev, hits: prev.hits + 1 }));
  };

  const handleTestMiss = () => {
    audio.playCacheMiss();
    setActiveFlow('MISS');
    setActiveAddress('0x009830');
    setStats((prev) => ({ ...prev, misses: prev.misses + 1 }));
  };

  const handleCustomLookup = (addr: string, isHit: boolean) => {
    setActiveAddress(addr);
    if (isHit) {
      audio.playCacheHit();
      setActiveFlow('HIT');
      setStats((prev) => ({ ...prev, hits: prev.hits + 1 }));
    } else {
      audio.playCacheMiss();
      setActiveFlow('MISS');
      setStats((prev) => ({ ...prev, misses: prev.misses + 1 }));
      // Update Set 2 on miss to show cache fill
      setCacheLines((prev) => ({
        ...prev,
        2: [{ valid: true, tag: addr.slice(0, 6), data: 'FETCHED_DATA', lru: Date.now() }]
      }));
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        left: '40px',
        bottom: '30px',
        width: '640px',
        maxWidth: 'calc(100vw - 80px)',
        zIndex: 40,
        animation: 'fadeIn 0.3s ease-out'
      }}
    >
      <div
        className="tech-panel"
        style={{
          borderRadius: '4px',
          padding: '22px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          borderLeft: '3px solid #ff6a00',
          maxHeight: '84vh',
          overflowY: 'auto'
        }}
      >
        {/* Header with Stats Counter */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px',
                letterSpacing: '0.12em',
                color: '#ff6a00',
                textTransform: 'uppercase'
              }}
            >
              HIERARCHICAL MEMORY & CACHE MATRIX
            </div>
            <h2
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '22px',
                fontWeight: 700,
                color: '#ffffff',
                marginTop: '2px'
              }}
            >
              L1/L2 CACHE SUBSYSTEM
            </h2>
          </div>

          {/* Live Hit-Rate Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              background: 'rgba(255, 106, 0, 0.1)',
              border: '1px solid rgba(255, 106, 0, 0.3)',
              borderRadius: '2px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px'
            }}
          >
            <span style={{ color: '#8b949e' }}>HIT RATE:</span>
            <span style={{ color: '#ff6a00', fontWeight: 700 }}>{hitRate}%</span>
            <span style={{ color: '#6e7681', fontSize: '9px' }}>({stats.hits}H / {stats.misses}M)</span>
          </div>
        </div>

        {/* 32-Bit Memory Address Breakdown Bar */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.4)',
            padding: '12px 14px',
            borderRadius: '3px',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '6px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px'
            }}
          >
            <span style={{ color: '#8b949e' }}>MEMORY ADDRESS: <strong style={{ color: '#ffffff' }}>{activeAddress}</strong></span>
            <span style={{ color: '#38bdf8' }}>32-BIT DECONSTRUCTION</span>
          </div>

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
            <div style={{ background: '#1c1f26', padding: '6px', borderRadius: '2px' }}>
              <div style={{ color: '#ff6a00', fontWeight: 600 }}>TAG [31:16]</div>
              <div style={{ color: '#d0d7de', fontSize: '9px' }}>{tagBits}</div>
            </div>
            <div style={{ background: '#1c1f26', padding: '6px', borderRadius: '2px' }}>
              <div style={{ color: '#38bdf8', fontWeight: 600 }}>SET INDEX [15:2]</div>
              <div style={{ color: '#d0d7de', fontSize: '9px' }}>{indexBits} (Set 1)</div>
            </div>
            <div style={{ background: '#1c1f26', padding: '6px', borderRadius: '2px' }}>
              <div style={{ color: '#e5a93c', fontWeight: 600 }}>OFFSET [1:0]</div>
              <div style={{ color: '#d0d7de', fontSize: '9px' }}>{offsetBits} (Byte 0)</div>
            </div>
          </div>
        </div>

        {/* Action Buttons & Mapping Selector */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={handleTestHit}
              className={activeFlow === 'HIT' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '8px 14px', fontSize: '11px' }}
            >
              <CheckCircle2 size={13} />
              <span>TEST CACHE HIT</span>
            </button>

            <button
              onClick={handleTestMiss}
              className={activeFlow === 'MISS' ? 'btn-primary' : 'btn-secondary'}
              style={{ padding: '8px 14px', fontSize: '11px' }}
            >
              <AlertCircle size={13} />
              <span>TEST CACHE MISS</span>
            </button>
          </div>

          {/* Quick Preset Lookups */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <button
              onClick={() => handleCustomLookup('0x004010', true)}
              style={{
                padding: '6px 8px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#d0d7de',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px',
                cursor: 'pointer',
                borderRadius: '2px'
              }}
              title="Lookup in Set 0 (Hit)"
            >
              0x004010
            </button>
            <button
              onClick={() => handleCustomLookup('0x009830', false)}
              style={{
                padding: '6px 8px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#d0d7de',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '10px',
                cursor: 'pointer',
                borderRadius: '2px'
              }}
              title="Lookup in Set 2 (Miss & Refill)"
            >
              0x009830
            </button>
          </div>
        </div>

        {/* Cache Lines Matrix Table */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '3px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            padding: '10px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px'
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '40px 50px 80px 1fr',
              color: '#8b949e',
              fontSize: '9px',
              paddingBottom: '6px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div>SET</div>
            <div>VALID</div>
            <div>TAG</div>
            <div>CACHED BLOCK (DATA)</div>
          </div>

          {[0, 1, 2, 3].map((setNum) => {
            const line = cacheLines[setNum][0];
            const isMatch = activeFlow === 'HIT' && setNum === 0;
            const isMissRefill = activeFlow === 'MISS' && setNum === 2;

            return (
              <div
                key={setNum}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 50px 80px 1fr',
                  padding: '6px 0',
                  alignItems: 'center',
                  background: isMatch
                    ? 'rgba(255, 106, 0, 0.12)'
                    : isMissRefill
                    ? 'rgba(56, 189, 248, 0.1)'
                    : 'transparent',
                  borderLeft: isMatch
                    ? '2px solid #ff6a00'
                    : isMissRefill
                    ? '2px solid #38bdf8'
                    : '2px solid transparent',
                  paddingLeft: '4px'
                }}
              >
                <div style={{ color: '#ff6a00', fontWeight: 600 }}>S{setNum}</div>
                <div>
                  <span
                    style={{
                      padding: '1px 4px',
                      borderRadius: '2px',
                      fontSize: '9px',
                      background: line.valid ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: line.valid ? '#4ade80' : '#f87171'
                    }}
                  >
                    {line.valid ? 'V=1' : 'V=0'}
                  </span>
                </div>
                <div style={{ color: '#d0d7de' }}>{line.tag}</div>
                <div style={{ color: line.valid ? '#ffffff' : '#6e7681', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{line.data}</span>
                  {isMatch && <span style={{ color: '#ff6a00', fontSize: '9px', fontWeight: 700 }}>[MATCH]</span>}
                  {isMissRefill && <span style={{ color: '#38bdf8', fontSize: '9px', fontWeight: 700 }}>[REFILLED]</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Latency Comparison Card */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px'
          }}
        >
          <div
            style={{
              padding: '10px 12px',
              background: 'rgba(255, 106, 0, 0.08)',
              border: '1px solid rgba(255, 106, 0, 0.2)',
              borderRadius: '2px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px'
            }}
          >
            <div style={{ color: '#8b949e', fontSize: '9px' }}>L1 SRAM LATENCY</div>
            <div style={{ color: '#ff6a00', fontWeight: 700, fontSize: '14px' }}>~1.2 ns (1 Cycle)</div>
            <div style={{ color: '#6e7681', fontSize: '9px' }}>High-density 6T SRAM cells</div>
          </div>

          <div
            style={{
              padding: '10px 12px',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '2px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '11px'
            }}
          >
            <div style={{ color: '#8b949e', fontSize: '9px' }}>MAIN DRAM LATENCY</div>
            <div style={{ color: '#f87171', fontWeight: 700, fontSize: '14px' }}>~85 ns (100+ Cycles)</div>
            <div style={{ color: '#6e7681', fontSize: '9px' }}>Capacitor refresh & row buffer penalty</div>
          </div>
        </div>
      </div>
    </div>
  );
};
