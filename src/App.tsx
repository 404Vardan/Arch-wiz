import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StudioScene } from './components/3d/StudioScene';
import { Navbar } from './components/ui/Navbar';
import { HeroOverlay } from './components/ui/HeroOverlay';
import { ComponentDetailsModal } from './components/ui/ComponentDetailsModal';
import { ExecutionSection } from './components/ui/ExecutionSection';
import { CacheSection } from './components/ui/CacheSection';
import { PipelineSection } from './components/ui/PipelineSection';
import { FinalSection } from './components/ui/FinalSection';
import { Loader } from './components/ui/Loader';
import { InteractiveSimulatorModal } from './components/ui/InteractiveSimulatorModal';
import { BenchmarkModal } from './components/ui/BenchmarkModal';
import { QuizDrawer } from './components/ui/QuizDrawer';
import { ExecutionTraceOverlay } from './components/ui/ExecutionTraceOverlay';
import { EXECUTION_STAGES } from './data/cpuData';
import { ComponentId, ExecutionStage } from './types';
import { audio } from './utils/audio';
import { scrollStore } from './stores/scrollStore';

export const App: React.FC = () => {
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [targetProgress, setTargetProgress] = useState<number>(0);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [activeComponentId, setActiveComponentId] = useState<ComponentId | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [isBenchmarkOpen, setIsBenchmarkOpen] = useState<boolean>(false);
  const [isQuizOpen, setIsQuizOpen] = useState<boolean>(false);

  // Execution state
  const [currentStageIndex, setCurrentStageIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Scroll height multiplier for deep cinematic control
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Native scroll handler
  useEffect(() => {
    const handleScroll = () => {
      const scrollY =
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;
      const docHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
        document.scrollingElement ? document.scrollingElement.scrollHeight : 0
      );
      const maxScroll = docHeight - window.innerHeight;
      if (maxScroll <= 0) return;
      const progress = Math.min(1, Math.max(0, scrollY / maxScroll));
      scrollStore.setTarget(progress);
      setTargetProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Smooth lerp loop: updates scrollStore at 60fps for Three.js, throttles React state to eliminate DOM lag
  useEffect(() => {
    let animFrame: number;
    let lastReactProgress = 0;
    const lerpLoop = () => {
      const curr = scrollStore.update();
      const diff = Math.abs(curr - lastReactProgress);
      if (diff > 0.005 || (curr <= 0.001 && lastReactProgress !== 0) || (curr >= 0.999 && lastReactProgress !== 1)) {
        lastReactProgress = curr;
        setScrollProgress(curr);
      }
      animFrame = requestAnimationFrame(lerpLoop);
    };
    animFrame = requestAnimationFrame(lerpLoop);
    return () => cancelAnimationFrame(animFrame);
  }, []);

  // Sync scroll with execution stages if user scrolls through the execution zone (0.68 -> 0.82)
  useEffect(() => {
    if (!isPlaying && scrollProgress >= 0.68 && scrollProgress <= 0.82) {
      const execT = (scrollProgress - 0.68) / (0.82 - 0.68);
      const stageIdx = Math.min(
        EXECUTION_STAGES.length - 1,
        Math.max(0, Math.floor(execT * EXECUTION_STAGES.length))
      );
      setCurrentStageIndex(stageIdx);
    }
  }, [scrollProgress, isPlaying]);

  // Autoplay loop for execution demo with audio synchronization
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentStageIndex((prev) => {
        if (prev >= EXECUTION_STAGES.length - 1) {
          setIsPlaying(false);
          audio.playAluChime();
          return prev;
        }
        audio.playStep();
        if (prev + 1 === 3) {
          audio.playAluChime();
        }
        return prev + 1;
      });
    }, 1800);

    return () => clearInterval(interval);
  }, [isPlaying]);

  // Programmatic scroll helper
  const scrollToProgress = useCallback((prog: number) => {
    const docHeight = Math.max(
      document.documentElement.scrollHeight,
      document.body.scrollHeight,
      document.scrollingElement ? document.scrollingElement.scrollHeight : 0
    );
    const maxScroll = docHeight - window.innerHeight;
    const targetY = prog * maxScroll;
    window.scrollTo({
      top: targetY,
      behavior: 'smooth'
    });
  }, []);

  // Current active execution stage
  const currentStage: ExecutionStage = EXECUTION_STAGES[currentStageIndex].id;
  const highlightedComponents = EXECUTION_STAGES[currentStageIndex].activeComponents;

  // Hero opacity: 1.0 from 0 to 0.12, fades out to 0.0 by 0.22
  const heroOpacity = Math.max(0, Math.min(1, 1 - (scrollProgress - 0.08) / (0.20 - 0.08)));

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh' }}>
      {/* 1. Initial Loading Screen */}
      {!isLoaded && <Loader onEnter={() => setIsLoaded(true)} />}

      {/* 2. Sticky Navbar with Audio Controls, Benchmark, Quiz & Simulator trigger */}
      <Navbar
        scrollProgress={scrollProgress}
        onNavigate={scrollToProgress}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        onOpenBenchmark={() => setIsBenchmarkOpen(true)}
        onOpenQuiz={() => setIsQuizOpen(true)}
      />

      {/* 3. 3D Studio Canvas Scene (Fixed Background Viewport) */}
      <StudioScene
        scrollProgress={scrollProgress}
        activeComponentId={activeComponentId}
        onSelectComponent={(id) => setActiveComponentId(id)}
        highlightedComponents={scrollProgress >= 0.65 ? highlightedComponents : []}
        currentStage={scrollProgress >= 0.65 ? currentStage : null}
        currentStageIndex={currentStageIndex}
        isExecuting={isPlaying || scrollProgress >= 0.68}
        isPlaying={isPlaying}
      />

      {/* Real-time Physical Execution Trace HUD Overlay */}
      <ExecutionTraceOverlay
        currentStageIndex={currentStageIndex}
        isPlaying={isPlaying}
        scrollProgress={scrollProgress}
      />

      {/* 4. Section Overlays */}
      {/* Hero Overlay */}
      <HeroOverlay
        opacity={heroOpacity}
        onExplore={() => scrollToProgress(0.60)}
        onViewExecution={() => scrollToProgress(0.74)}
      />

      {/* Component Details Inspection Drawer / Modal */}
      <ComponentDetailsModal
        componentId={activeComponentId}
        onClose={() => setActiveComponentId(null)}
      />

      {/* Interactive Architecture Sandbox / Simulator Modal */}
      <InteractiveSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
      />

      {/* COA Architecture Performance Benchmark Modal */}
      <BenchmarkModal
        isOpen={isBenchmarkOpen}
        onClose={() => setIsBenchmarkOpen(false)}
      />

      {/* COA Knowledge Challenge Drawer */}
      <QuizDrawer
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
      />

      {/* Instruction Execution Section */}
      <ExecutionSection
        currentStageIndex={currentStageIndex}
        isPlaying={isPlaying}
        onPlayToggle={() => setIsPlaying(!isPlaying)}
        onStep={() =>
          setCurrentStageIndex((prev) => (prev + 1) % EXECUTION_STAGES.length)
        }
        onReset={() => {
          setIsPlaying(false);
          setCurrentStageIndex(0);
        }}
        onSelectStage={(idx) => {
          setIsPlaying(false);
          setCurrentStageIndex(idx);
        }}
        scrollProgress={scrollProgress}
      />

      {/* Memory Cache Subsystem Section */}
      <CacheSection scrollProgress={scrollProgress} />

      {/* 5-Stage Pipelining Section */}
      <PipelineSection scrollProgress={scrollProgress} />

      {/* Final Closing Call-to-Action */}
      <FinalSection
        scrollProgress={scrollProgress}
        onExplore={() => scrollToProgress(0.60)}
        onViewExecution={() => scrollToProgress(0.74)}
        onResetToTop={() => scrollToProgress(0)}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
      />

      {/* 5. Virtual Scroll Track (650vh to provide fine-grained physical scroll resolution) */}
      <div
        ref={scrollContainerRef}
        style={{
          width: '100%',
          height: '650vh',
          pointerEvents: 'none',
          position: 'relative'
        }}
      />
    </div>
  );
};

export default App;
