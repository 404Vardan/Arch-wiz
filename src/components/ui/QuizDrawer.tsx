import React, { useState } from 'react';
import { X, HelpCircle, CheckCircle, XCircle, Award, ArrowRight, RotateCcw } from 'lucide-react';
import { audio } from '../../utils/audio';

interface QuizDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Question {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    question: 'In a 5-stage RISC instruction pipeline, which stage calculates the effective memory address for a LOAD instruction?',
    options: [
      'Instruction Fetch (IF)',
      'Instruction Decode (ID)',
      'Execution / Address Generation (EX)',
      'Memory Access (MEM)'
    ],
    correctIndex: 2,
    explanation: 'The ALU in the EX stage performs arithmetic addition between the base register (Rs1) and the sign-extended immediate offset to determine the effective RAM address.'
  },
  {
    id: 2,
    question: 'What hardware optimization eliminates data hazard stalls by routing calculation results directly to dependent instructions?',
    options: [
      'Branch Prediction Buffer',
      'Hardware Forwarding / Bypass Multiplexers',
      'Instruction Reorder Buffer',
      'Dynamic Register Renaming'
    ],
    correctIndex: 1,
    explanation: 'Forwarding wires the outputs of EX/MEM or MEM/WB pipeline registers directly to the inputs of the ALU multiplexer, removing the need to wait for writeback to the Register File.'
  },
  {
    id: 3,
    question: 'Which cache mapping strategy allows any main memory block to be placed into any arbitrary cache line?',
    options: [
      'Direct-Mapped Cache',
      '2-Way Set Associative Cache',
      'Fully Associative Cache',
      'Sector-Mapped Cache'
    ],
    correctIndex: 2,
    explanation: 'In a Fully Associative Cache, index bits are 0; the entire address (except byte offset) is treated as a TAG and searched in parallel across all cache lines.'
  },
  {
    id: 4,
    question: 'Why does a standard 32-bit RISC Register File feature two read ports and one write port?',
    options: [
      'To allow reading two 32-bit source operands (Rs1, Rs2) in parallel during a single clock cycle',
      'To support 64-bit floating point operations',
      'To maintain backup copies of general-purpose registers',
      'To allow instruction decoding while branching'
    ],
    correctIndex: 0,
    explanation: 'Two read ports enable the datapath to latch both operands for dual-input ALU operations (like ADD R3, R1, R2) concurrently in the Register Read stage.'
  },
  {
    id: 5,
    question: 'In a 32-bit processor without branch delay slots, when is the Program Counter (PC) nominally incremented by 4?',
    options: [
      'During the Instruction Fetch (IF) stage',
      'After the Write Back (WB) stage retires',
      'During the Execution (EX) stage',
      'When the Control Unit issues an interrupt'
    ],
    correctIndex: 0,
    explanation: 'In the IF stage, while the current instruction is being latched from memory into the IR, an adder concurrently increments PC ← PC + 4 to prepare for the subsequent cycle.'
  }
];

export const QuizDrawer: React.FC<QuizDrawerProps> = ({ isOpen, onClose }) => {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState<Record<number, boolean>>({});

  if (!isOpen) return null;

  const currentQ = QUESTIONS[currentIdx];
  const answered = selectedAnswers[currentIdx] !== undefined;
  const isCorrect = answered && selectedAnswers[currentIdx] === currentQ.correctIndex;

  const handleSelect = (optIdx: number) => {
    if (isSubmitted[currentIdx]) return;
    audio.playClick();
    setSelectedAnswers((prev) => ({ ...prev, [currentIdx]: optIdx }));
    setIsSubmitted((prev) => ({ ...prev, [currentIdx]: true }));

    if (optIdx === currentQ.correctIndex) {
      audio.playAluChime();
    } else {
      audio.playCacheMiss();
    }
  };

  const handleNext = () => {
    audio.playClick();
    if (currentIdx < QUESTIONS.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    audio.playClick();
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    }
  };

  const handleReset = () => {
    audio.playClick();
    setCurrentIdx(0);
    setSelectedAnswers({});
    setIsSubmitted({});
  };

  const correctCount = Object.entries(selectedAnswers).filter(
    ([qIdx, ansIdx]) => QUESTIONS[Number(qIdx)].correctIndex === ansIdx
  ).length;

  return (
    <div
      style={{
        position: 'fixed',
        right: '40px',
        bottom: '40px',
        width: '480px',
        maxWidth: 'calc(100vw - 80px)',
        zIndex: 60,
        animation: 'fadeIn 0.3s ease-out'
      }}
    >
      <div
        className="tech-panel"
        style={{
          borderRadius: '6px',
          padding: '22px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          borderLeft: '3px solid #ff6a00',
          boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 25px rgba(255, 106, 0, 0.15)'
        }}
      >
        {/* Header */}
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
              COA MASTERY CHECK
            </div>
            <h3
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '18px',
                fontWeight: 700,
                color: '#ffffff',
                marginTop: '2px'
              }}
            >
              ARCHITECTURE KNOWLEDGE LAB
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '11px',
                color: '#ff6a00',
                background: 'rgba(255, 106, 0, 0.1)',
                padding: '3px 8px',
                borderRadius: '2px',
                fontWeight: 600
              }}
            >
              SCORE: {correctCount}/{QUESTIONS.length}
            </span>

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
                padding: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Question Counter & Text */}
        <div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px',
              color: '#8b949e',
              marginBottom: '6px'
            }}
          >
            QUESTION {currentIdx + 1} OF {QUESTIONS.length}
          </div>
          <p
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '13px',
              fontWeight: 600,
              lineHeight: 1.4,
              color: '#ffffff'
            }}
          >
            {currentQ.question}
          </p>
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {currentQ.options.map((opt, oIdx) => {
            const isUserSelected = selectedAnswers[currentIdx] === oIdx;
            const isSubmittedCurrent = isSubmitted[currentIdx];
            const isTargetCorrect = oIdx === currentQ.correctIndex;

            let bgColor = 'rgba(255, 255, 255, 0.03)';
            let borderColor = 'rgba(255, 255, 255, 0.08)';
            let textColor = '#d0d7de';

            if (isSubmittedCurrent) {
              if (isTargetCorrect) {
                bgColor = 'rgba(34, 197, 94, 0.15)';
                borderColor = '#22c55e';
                textColor = '#4ade80';
              } else if (isUserSelected && !isTargetCorrect) {
                bgColor = 'rgba(239, 68, 68, 0.15)';
                borderColor = '#ef4444';
                textColor = '#f87171';
              }
            }

            return (
              <button
                key={oIdx}
                onClick={() => handleSelect(oIdx)}
                style={{
                  padding: '8px 12px',
                  background: bgColor,
                  border: `1px solid ${borderColor}`,
                  borderRadius: '3px',
                  color: textColor,
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '11px',
                  textAlign: 'left',
                  cursor: isSubmittedCurrent ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>{opt}</span>
                {isSubmittedCurrent && isTargetCorrect && <CheckCircle size={14} color="#22c55e" />}
                {isSubmittedCurrent && isUserSelected && !isTargetCorrect && <XCircle size={14} color="#ef4444" />}
              </button>
            );
          })}
        </div>

        {/* Explanation Banner */}
        {isSubmitted[currentIdx] && (
          <div
            style={{
              padding: '10px 12px',
              background: isCorrect ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
              border: `1px solid ${isCorrect ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
              borderRadius: '3px',
              fontFamily: "'Inter', sans-serif",
              fontSize: '11px',
              lineHeight: 1.4,
              color: '#d0d7de'
            }}
          >
            <strong style={{ color: isCorrect ? '#4ade80' : '#f87171' }}>
              {isCorrect ? '✓ CORRECT!' : '✗ INCORRECT:'}
            </strong>{' '}
            {currentQ.explanation}
          </div>
        )}

        {/* Footer Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
          <button
            onClick={handlePrev}
            disabled={currentIdx === 0}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '10px', opacity: currentIdx === 0 ? 0.4 : 1 }}
          >
            PREVIOUS
          </button>

          <button
            onClick={handleReset}
            className="btn-secondary"
            style={{ padding: '6px 8px' }}
            title="Reset Quiz"
          >
            <RotateCcw size={12} />
          </button>

          <button
            onClick={handleNext}
            disabled={currentIdx === QUESTIONS.length - 1}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '10px', opacity: currentIdx === QUESTIONS.length - 1 ? 0.4 : 1 }}
          >
            NEXT
          </button>
        </div>
      </div>
    </div>
  );
};
