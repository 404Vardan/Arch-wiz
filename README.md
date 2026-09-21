# ARCH-VIZ: Interactive 3D CPU Architecture & Performance Analyzer

> **"Don't just read CPU architecture. SEE how the processor works."**

ARCH-VIZ is a cinematic, interactive 3D web application and visual analyzer for **Computer Organization and Architecture (COA)**. Built with React, Three.js / React Three Fiber, and TypeScript, it provides students and engineers with an observable, real-time breakdown of modern processor execution, memory hierarchies, and pipeline dynamics.

---

## ⚡ Key Features

### 1. Cinematic 3D Hardware Teardown (`0.0 → 1.0` Timeline)
- **Unibody CNC Aluminum Laptop**: Smoothly pivots open on a mechanical dual-barrel hinge.
- **Illuminated Screen Texture**: Real-time canvas telemetry displaying Harvard/RISC block diagrams and CPU status.
- **Retractable Keyboard Deck**: Disassembles forward to reveal the motherboard and processor die.
- **Exploded 3D Silicon Package**: 8 modular blocks (`ALU`, `REGISTER FILE`, `CONTROL UNIT`, `PC`, `IR`, `MEMORY`, `CACHE`, `PIPELINE`) separate vertically in 3D space with interactive inspection drawers.

### 2. 5-Stage Datapath Instruction Stepper (`ADD R1, R2`)
- Step or auto-play through the canonical RISC 5 stages:
  - **Fetch (IF)**: Program Counter address latched into Memory Bus $\to$ Instruction Register.
  - **Decode (ID)**: Control Unit decodes opcode and asserts control lines.
  - **Register Read (RR)**: Dual-port read of $R_1$ and $R_2$.
  - **Execute (EX)**: 32-bit parallel ALU adder computes result.
  - **Write Back (WB)**: Destination register latch updated with result ($42$).

### 3. Interactive Architecture Sandbox & 32-Bit Machine Code Encoder
- **Instruction Support**: `ADD`, `SUB`, `AND`, `OR`, `SLT`, `LOAD`, `STORE`, `BEQ`.
- **Custom Operands**: Edit $R_1$, $R_2$, immediate offsets, and target addresses.
- **32-Bit Machine Code Deconstruction**: Live colored bitfield breakdown (`funct7`, `rs2`, `rs1`, `funct3`, `rd`, `opcode`) and hex encoding (e.g. `0x402081B3`).

### 4. Multi-Instruction Program Runner & 16-Register Bank
- **Assembly Routines**: *Accumulator Loop (Sum 1 to 4)*, *Memory Array Load & Store*, *Bitwise Masking & Logic*.
- **Interactive Step Debugger**: Step through assembly routines with live Program Counter ($PC$) tracking and active pointer arrows.
- **Full 16-Register Bank ($R_0 \to R_{15}$)**: Real-time values with writeback pulse highlights.
- **Data Memory Segment**: Visual table of SRAM addresses (`0x1000`, `0x1004`, `0x1008`, `0x100C`).

### 5. Memory Cache Matrix & Address Deconstruction
- **32-Bit Address Breakdown**: Segmented into `TAG [31:16]`, `SET INDEX [15:2]`, and `BYTE OFFSET [1:0]`.
- **Live Cache Line Matrix**: Visualizes sets $S_0$ through $S_3$ with valid bits, tags, and cached data blocks.
- **Hit vs Miss Simulation**: Interactive **Test Cache Miss** (triggers RAM fetch and line refill) and **Test Cache Hit** (instantaneous SRAM match) with real-time hit-rate tracking.

### 6. Pipeline Hazard Analyzer & Forwarding Unit
- **3 Hazard Modes**:
  - `IDEAL`: 1 instruction per cycle ($\text{CPI} = 1.0$).
  - `DATA HAZARD (2 STALLS)`: Visualizes RAW dependency with inserted `NOP` bubbles.
  - `WITH FORWARDING (BYPASS)`: Visualizes hardware bypass multiplexers routing `EX/MEM.ALUOut` directly to ALU inputs at Cycle 4.

### 7. Quantitative Performance Benchmark & Amdahl's Law Calculator
- **Iron Law of Processor Performance**:
  $$\text{Execution Time } T = I \times \text{CPI} \times t_{\text{clk}}$$
- **Side-by-Side Comparison**:
  - Single-Cycle Datapath ($t_{\text{clk}} = 850\,\text{ps}$, $\text{CPI} = 1.00$)
  - Multi-Cycle Datapath ($t_{\text{clk}} = 200\,\text{ps}$, $\text{CPI} = 4.20$)
  - 5-Stage Pipelined Datapath ($t_{\text{clk}} = 220\,\text{ps}$, $\text{CPI} = 1.75$ with hazard modeling)
- **Tuning Sliders**: Adjust Instruction Count ($I$), Cache Miss Rate ($0\% \to 25\%$), and Branch Misprediction Rate ($0\% \to 30\%$).

### 8. COA Knowledge Mastery Lab (Interactive Quiz)
- Curated conceptual questions covering effective address calculation, forwarding bypass paths, associative cache mapping, and register file architecture with instant feedback.

### 9. Zero-Dependency Web Audio Synthesizer
- Built using native Web Audio API (tactile mechanical clicks, datapath transition sweeps, dual-harmonic ALU chime, and navbar audio mute toggle).

---

## 🛠️ Technology Stack

- **Framework**: [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Bundler**: [Vite 6](https://vitejs.dev/)
- **3D Graphics**: [Three.js](https://threejs.org/) + [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber/) + [@react-three/drei](https://github.com/pmndrs/drei)
- **Styling**: Vanilla CSS with custom CSS variables & glassmorphism
- **Icons**: [Lucide React](https://lucide.dev/)
- **Audio**: Native Web Audio API

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or pnpm

### Installation

```bash
# Clone repository
git clone https://github.com/404Vardan/arch-wiz.git
cd arch-wiz

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
npm run build
npm run preview
```

---

## 📚 Academic Alignment

ARCH-VIZ is built specifically for **Computer Organization and Architecture (COA)** curriculum and Project Based Learning (PBL). It maps directly to core concepts covered in *Computer Organization and Design (Patterson & Hennessy)* and *Computer Architecture: A Quantitative Approach*.

---

## 📄 License

MIT License.
