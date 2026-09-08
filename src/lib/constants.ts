import { SiteConfig, FeatureModule, TelemetryMetric, ArchitectureLayer } from "@/types";

export const SITE_CONFIG: SiteConfig = {
  name: "Utopians Core",
  tagline: "The Intelligent Infrastructure Platform",
  description:
    "An enterprise-grade, high-throughput decentralized foundation powering autonomous agents, neural compute pipelines, and verifiable state machines.",
  version: "v1.4.0-alpha",
  status: "Operational",
  navItems: [
    { title: "Overview", href: "#overview" },
    { title: "Telemetry", href: "#telemetry" },
    { title: "Modules", href: "#modules" },
    { title: "Architecture", href: "#architecture" },
    { title: "Docs", href: "https://docs.utopians.network", isExternal: true, badge: "v1.4" },
  ],
  socialLinks: {
    github: "https://github.com/utopians-core",
    docs: "https://docs.utopians.network",
    discord: "https://discord.gg/utopians",
    x: "https://x.com/utopians_core",
  },
};

export const CORE_TELEMETRY: TelemetryMetric[] = [
  {
    id: "tps",
    name: "System Throughput",
    value: "142,850",
    numericValue: 92,
    unit: "tx/sec",
    trend: "up",
    change: "+14.2%",
    status: "optimal",
    description: "Peak validated operations across parallel pipelined nodes",
  },
  {
    id: "latency",
    name: "Consensus Finality",
    value: "18.4",
    numericValue: 95,
    unit: "ms",
    trend: "down",
    change: "-3.1ms",
    status: "optimal",
    description: "Sub-second deterministic state commitment SLA",
  },
  {
    id: "nodes",
    name: "Active Validator Quorum",
    value: "2,048",
    numericValue: 88,
    unit: "nodes",
    trend: "up",
    change: "+128 new",
    status: "nominal",
    description: "Globally partitioned zero-trust validator nodes",
  },
  {
    id: "uptime",
    name: "Uptime Reliability",
    value: "99.998",
    numericValue: 99.998,
    unit: "%",
    trend: "stable",
    change: "0 downtime",
    status: "optimal",
    description: "Continuous self-healing consensus across multi-regions",
  },
];

export const CORE_MODULES: FeatureModule[] = [
  {
    id: "neural-mesh",
    title: "Neural Mesh Compute",
    tagline: "Autonomous Agent Orchestration",
    description:
      "Distributed tensor compute virtualization for multi-agent autonomous swarms with deterministic execution checkpoints.",
    category: "Architecture",
    icon: "Cpu",
    metrics: { label: "Inference Latency", value: "< 4.2ms" },
    badge: "Core V2",
  },
  {
    id: "quantum-vault",
    title: "Quantum-Resistant Vault",
    tagline: "Post-Quantum State Cryptography",
    description:
      "Hardware-isolated cryptographic primitives utilizing lattice-based cryptography for long-term verifiable secrecy.",
    category: "Security",
    icon: "ShieldCheck",
    metrics: { label: "Encryption Standard", value: "ML-KEM / Dilithium" },
    badge: "Hardened",
  },
  {
    id: "synapse-pipeline",
    title: "Synapse Data Stream",
    tagline: "Real-Time Event Processing",
    description:
      "Zero-copy streaming memory engine designed for multi-gigabit telemetry aggregation and low-jitter state synchronization.",
    category: "Performance",
    icon: "Zap",
    metrics: { label: "Bandwidth Cap", value: "100 Gbps/node" },
  },
  {
    id: "hyper-consensus",
    title: "Adaptive Hyper-Consensus",
    tagline: "Dynamic DAG BFT Engine",
    description:
      "Asynchronous Byzantine Fault Tolerant state replication engine adjusting gas economics and throughput dynamically.",
    category: "Ecosystem",
    icon: "Layers",
    metrics: { label: "Finality Window", value: "1 Block" },
    badge: "Patent-Pending",
  },
];

export const ARCHITECTURE_LAYERS: ArchitectureLayer[] = [
  {
    id: "application",
    title: "Application & Agent Runtime",
    subtitle: "Layer 4: Intelligent Compute",
    description:
      "Wasm and native microkernel runtime for decentralized autonomous agents, smart workflows, and multi-tenant sandboxes.",
    technologies: ["Wasm MicroVM", "Neural Interlink", "JSON-RPC 3.0", "gRPC Mesh"],
    status: "active",
    latency: "1.2ms",
  },
  {
    id: "consensus",
    title: "Asynchronous BFT Consensus",
    subtitle: "Layer 3: Verifiable Trust",
    description:
      "Deterministic pipelined consensus engine capable of leaderless ordering and instant transaction execution.",
    technologies: ["DAG Pipeline", "Threshold BLS", "Slashing Engine", "Fast Path BFT"],
    status: "active",
    latency: "18.4ms",
  },
  {
    id: "data",
    title: "Verifiable Storage & State Tree",
    subtitle: "Layer 2: Memory & State",
    description:
      "Sparse Merkle Tree combined with NVMe-optimized tiered append-only storage and cryptographic zero-knowledge proofs.",
    technologies: ["Sparse Merkle DAG", "Tiered NVMe Engine", "ZK-Rollup Provers"],
    status: "active",
    latency: "0.8ms",
  },
  {
    id: "network",
    title: "Multipath P2P Fabric",
    subtitle: "Layer 1: Global Connectivity",
    description:
      "Encrypted QUIC protocol mesh with active topology optimization, DDoS packet scrubbers, and peer discovery.",
    technologies: ["libp2p QUIC", "WireGuard Protocol", "DHT Routing", "Anti-Sybil Mesh"],
    status: "active",
    latency: "4.5ms",
  },
];
