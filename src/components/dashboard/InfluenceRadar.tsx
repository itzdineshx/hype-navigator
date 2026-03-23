import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Bot, Minus, Plus, RefreshCcw } from "lucide-react";
import { fetchJson, formatCompactNumber } from "@/lib/api";

type InfluenceRadarProps = {
  variant?: "compact" | "immersive";
};

type RadarNode = {
  id: number;
  name?: string;
  handle: string;
  followers?: number;
  category?: string;
  quality_score?: number;
  impact_score: number;
  trust_score?: number;
  tier?: "alpha" | "core" | "watch" | "risk" | string;
  posts_24h: number;
};

type SocialPost = {
  source: string;
  author: string;
  influencer_handle: string;
  text: string;
};

type GraphNode = RadarNode & {
  x: number;
  y: number;
  size: number;
  influence: number;
  trustBand: "high" | "medium" | "low";
  group: "core" | "support" | "risk";
  samplePost: string;
  synthetic?: boolean;
  parentId?: number;
};

type GraphEdge = {
  from: number;
  to: number;
  strength: number;
  risk: boolean;
};

const fallbackNodes: RadarNode[] = [
  { id: 1, name: "Crypto King", handle: "CryptoKing", followers: 2300000, category: "analyst", quality_score: 92, impact_score: 94, trust_score: 86, tier: "alpha", posts_24h: 142 },
  { id: 2, name: "Degen Trader", handle: "DegenTrader", followers: 890000, category: "trader", quality_score: 73, impact_score: 72, trust_score: 66, tier: "core", posts_24h: 89 },
  { id: 3, name: "Whale Alert", handle: "WhaleAlert", followers: 1800000, category: "analytics", quality_score: 88, impact_score: 88, trust_score: 82, tier: "alpha", posts_24h: 201 },
  { id: 4, name: "Meme Hunter", handle: "MemeHunter", followers: 340000, category: "meme", quality_score: 57, impact_score: 65, trust_score: 44, tier: "watch", posts_24h: 56 },
  { id: 5, name: "Alpha Leaks", handle: "AlphaLeaks", followers: 1200000, category: "news", quality_score: 81, impact_score: 81, trust_score: 75, tier: "core", posts_24h: 167 },
  { id: 6, name: "Pump Scanner", handle: "PumpScanner", followers: 250000, category: "botwatch", quality_score: 45, impact_score: 49, trust_score: 28, tier: "risk", posts_24h: 98 },
  { id: 7, name: "Meme Oracle", handle: "MemeOracle", followers: 470000, category: "signals", quality_score: 64, impact_score: 66, trust_score: 58, tier: "watch", posts_24h: 113 },
  { id: 8, name: "Chain Pulse", handle: "ChainPulse", followers: 710000, category: "onchain", quality_score: 69, impact_score: 71, trust_score: 63, tier: "core", posts_24h: 126 },
  { id: 9, name: "Risk Hunter", handle: "RiskHunter", followers: 190000, category: "alerts", quality_score: 40, impact_score: 43, trust_score: 22, tier: "risk", posts_24h: 74 },
];

const fallbackPosts: SocialPost[] = [
  { source: "twitter", author: "CryptoKing", influencer_handle: "CryptoKing", text: "Large meme basket rotation detected. Liquidity has shifted into high-beta names." },
  { source: "reddit", author: "u/whalealert", influencer_handle: "WhaleAlert", text: "Abnormal transfer behavior suggests clustered speculative flow around PEPE and FLOKI." },
  { source: "twitter", author: "PumpScanner", influencer_handle: "PumpScanner", text: "Low-float coins showing high velocity. Treat this setup as high risk until confirmation." },
];

const COLORS = {
  bg1: "#031229",
  cyan: "#00c2ff",
  cyanSoft: "rgba(0, 194, 255, 0.45)",
  risk: "#ff3366",
  medium: "#f59e0b",
  clean: "#00e5a8",
};

const tierGroup = (tier?: string): "core" | "support" | "risk" => {
  const value = (tier || "watch").toLowerCase();
  if (value === "risk") return "risk";
  if (value === "alpha" || value === "core") return "core";
  return "support";
};

const trustBand = (trust: number): "high" | "medium" | "low" => {
  if (trust >= 75) return "high";
  if (trust >= 50) return "medium";
  return "low";
};

const pointFromPolar = (angleDeg: number, radius: number) => {
  const r = (angleDeg * Math.PI) / 180;
  return { x: 50 + Math.cos(r) * radius, y: 50 + Math.sin(r) * radius };
};

const distance = (a: GraphNode, b: GraphNode): number => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const spread = (count: number, start: number, end: number): number[] => {
  if (count <= 0) return [];
  if (count === 1) return [(start + end) / 2];
  const step = (end - start) / (count - 1);
  return Array.from({ length: count }, (_, idx) => start + idx * step);
};

const samplePost = (posts: SocialPost[], handle: string): string => {
  const key = handle.toLowerCase();
  const hit = posts.find(
    (post) =>
      (post.influencer_handle || "").toLowerCase() === key ||
      (post.author || "").toLowerCase().includes(key)
  );
  if (!hit) return "No recent sample post available.";
  return hit.text.length > 170 ? `${hit.text.slice(0, 167)}...` : hit.text;
};

const buildNodes = (rawNodes: RadarNode[], posts: SocialPost[]): GraphNode[] => {
  if (rawNodes.length === 0) return [];

  const sorted = [...rawNodes].sort(
    (a, b) => (b.quality_score || b.impact_score) - (a.quality_score || a.impact_score)
  );

  const center = sorted[0];
  const rest = sorted.slice(1);

  const core = rest.filter((n) => tierGroup(n.tier) === "core");
  const support = rest.filter((n) => tierGroup(n.tier) === "support");
  const risk = rest.filter((n) => tierGroup(n.tier) === "risk");

  const coreAngles = spread(core.length, 210, 330);
  const supportAngles = spread(support.length, 145, 395);
  const riskAngles = spread(risk.length, 35, 145);

  return sorted.map((node, index) => {
    const trust = node.trust_score || 0;
    const group = tierGroup(node.tier);
    const influence = Math.round(node.quality_score || node.impact_score || 0);

    if (index === 0) {
      return {
        ...center,
        x: 50,
        y: 50,
        size: 54,
        influence,
        trustBand: trustBand(trust),
        group,
        samplePost: samplePost(posts, node.handle),
      };
    }

    if (group === "core") {
      const idx = core.findIndex((item) => item.id === node.id);
      const pt = pointFromPolar(coreAngles[idx] ?? 270, 23);
      return {
        ...node,
        x: pt.x,
        y: pt.y,
        size: Math.max(18, Math.min(40, 14 + influence * 0.23)),
        influence,
        trustBand: trustBand(trust),
        group,
        samplePost: samplePost(posts, node.handle),
      };
    }

    if (group === "support") {
      const idx = support.findIndex((item) => item.id === node.id);
      const pt = pointFromPolar(supportAngles[idx] ?? 180, 34);
      return {
        ...node,
        x: pt.x,
        y: pt.y,
        size: Math.max(15, Math.min(32, 12 + influence * 0.2)),
        influence,
        trustBand: trustBand(trust),
        group,
        samplePost: samplePost(posts, node.handle),
      };
    }

    const idx = risk.findIndex((item) => item.id === node.id);
    const pt = pointFromPolar(riskAngles[idx] ?? 90, 43);
    return {
      ...node,
      x: pt.x,
      y: pt.y,
      size: Math.max(14, Math.min(26, 10 + influence * 0.16)),
      influence,
      trustBand: trustBand(trust),
      group,
      samplePost: samplePost(posts, node.handle),
    };
  });
};

const densifyNodes = (baseNodes: GraphNode[], variant: "compact" | "immersive"): GraphNode[] => {
  if (baseNodes.length === 0) return baseNodes;

  const immersive = variant === "immersive";

  const augmented: GraphNode[] = [...baseNodes];
  let nextId = Math.max(...baseNodes.map((n) => n.id)) + 1;

  const childCountByGroup: Record<GraphNode["group"], number> = immersive
    ? {
        core: 4,
        support: 3,
        risk: 2,
      }
    : {
        core: 2,
        support: 1,
        risk: 1,
      };

  const maxPrimary = immersive ? 18 : 10;
  const primaryNodes = baseNodes.slice(1, maxPrimary + 1);

  for (const node of primaryNodes) {
    const groupBaseCount = childCountByGroup[node.group];
    const influenceBonus = node.influence > 75 ? 1 : 0;
    const childCount = Math.min(5, groupBaseCount + influenceBonus);

    for (let i = 0; i < childCount; i += 1) {
      const baseAngle = (node.id * 41 + i * 67) % 360;
      const angleJitter = (i % 2 === 0 ? 1 : -1) * (immersive ? 12 : 8);
      const angle = (baseAngle + angleJitter) * (Math.PI / 180);
      const radius = node.group === "risk" ? 4.8 + i * 1.2 : 3.6 + i * (immersive ? 1.3 : 1.05);
      const x = Math.max(6, Math.min(94, node.x + Math.cos(angle) * radius));
      const y = Math.max(6, Math.min(94, node.y + Math.sin(angle) * radius));
      const trust = Math.max(8, Math.min(95, (node.trust_score || 0) - (node.group === "risk" ? 5 : -2) - i * 2));
      const influence = Math.max(10, Math.min(88, node.influence - 6 - i * 4));

      augmented.push({
        ...node,
        id: nextId,
        handle: `${node.handle}_n${i + 1}`,
        name: `${node.name || node.handle} Node ${i + 1}`,
        followers: Math.max(5000, Math.round((node.followers || 50000) * (0.26 - i * 0.05))),
        posts_24h: Math.max(3, Math.round((node.posts_24h || 20) * (0.52 - i * 0.09))),
        trust_score: trust,
        quality_score: influence,
        impact_score: influence,
        influence,
        trustBand: trustBand(trust),
        x,
        y,
        size: Math.max(9, Math.round(node.size * (0.58 - i * 0.07))),
        samplePost: `Amplified from @${node.handle}: ${node.samplePost}`,
        synthetic: true,
        parentId: node.id,
      });

      nextId += 1;
    }
  };

  return augmented;
};

const buildEdges = (nodes: GraphNode[]): GraphEdge[] => {
  if (nodes.length < 2) return [];

  const center = nodes[0];
  const primary = nodes.filter((n) => !n.synthetic && n.id !== center.id);
  const synthetic = nodes.filter((n) => n.synthetic);

  const centerEdges: GraphEdge[] = primary.map((node) => ({
    from: center.id,
    to: node.id,
    strength: Math.max(0.15, Math.min(0.9, (node.influence + (node.trust_score || 0)) / 200)),
    risk: node.group === "risk" || (node.trust_score || 0) < 40,
  }));

  const grouped: Record<GraphNode["group"], GraphNode[]> = {
    core: primary.filter((n) => n.group === "core").sort((a, b) => b.influence - a.influence),
    support: primary.filter((n) => n.group === "support").sort((a, b) => b.influence - a.influence),
    risk: primary.filter((n) => n.group === "risk").sort((a, b) => b.influence - a.influence),
  };

  const intraGroupEdges: GraphEdge[] = [];
  for (const groupNodes of Object.values(grouped)) {
    for (let i = 1; i < groupNodes.length; i += 1) {
      const prev = groupNodes[i - 1];
      const curr = groupNodes[i];
      intraGroupEdges.push({
        from: prev.id,
        to: curr.id,
        strength: Math.max(0.12, Math.min(0.42, (prev.influence + curr.influence) / 260)),
        risk: prev.group === "risk" || curr.group === "risk",
      });
    }
  }

  const childEdges: GraphEdge[] = synthetic.map((child) => {
    const parent = nodes.find((n) => n.id === child.parentId) || center;
    return {
      from: parent.id,
      to: child.id,
      strength: Math.max(0.12, Math.min(0.38, (child.influence + parent.influence) / 320)),
      risk: child.group === "risk" || (child.trust_score || 0) < 40,
    };
  });

  const relayEdges: GraphEdge[] = [];
  for (let i = 1; i < synthetic.length; i += 2) {
    const a = synthetic[i - 1];
    const b = synthetic[i];
    if (a.group !== b.group) continue;
    relayEdges.push({
      from: a.id,
      to: b.id,
      strength: 0.18,
      risk: a.group === "risk",
    });
  }

  const bridgeEdges: GraphEdge[] = [];
  for (const node of primary) {
    const candidates = primary.filter((item) => item.id !== node.id && item.group !== node.group);
    if (candidates.length === 0) continue;
    const nearest = candidates.sort((a, b) => distance(node, a) - distance(node, b))[0];
    bridgeEdges.push({
      from: node.id,
      to: nearest.id,
      strength: 0.16,
      risk: node.group === "risk" || nearest.group === "risk",
    });
  }

  return [...centerEdges, ...intraGroupEdges, ...childEdges, ...relayEdges, ...bridgeEdges];
};

const InfluenceRadar = ({ variant = "compact" }: InfluenceRadarProps) => {
  const immersive = variant === "immersive";

  const [nodes, setNodes] = useState<RadarNode[]>(fallbackNodes);
  const [posts, setPosts] = useState<SocialPost[]>(fallbackPosts);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [trustFilter, setTrustFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [groupFilter, setGroupFilter] = useState<"all" | "core" | "support" | "risk">("all");
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    let mounted = true;

    const load = async (silent = false) => {
      try {
        if (!silent && mounted) setLoading(true);
        const [radarResult, postsResult] = await Promise.allSettled([
          fetchJson<RadarNode[]>("/influence/radar"),
          fetchJson<SocialPost[]>("/social/posts?limit=400"),
        ]);

        if (!mounted) return;

        if (radarResult.status === "fulfilled" && radarResult.value.length > 0) {
          setNodes(radarResult.value);
        }
        if (postsResult.status === "fulfilled" && postsResult.value.length > 0) {
          setPosts(postsResult.value);
        }
      } catch {
        // Keep fallback data.
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();
    const timer = window.setInterval(() => {
      void load(true);
    }, 45000);

    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

  const graphNodes = useMemo(() => {
    const primary = buildNodes(nodes, posts);
    return densifyNodes(primary, variant);
  }, [nodes, posts, variant]);

  const filteredNodes = useMemo(() => {
    return graphNodes.filter((node) => {
      const trustOk = trustFilter === "all" || node.trustBand === trustFilter;
      const groupOk = groupFilter === "all" || node.group === groupFilter;
      return trustOk && groupOk;
    });
  }, [graphNodes, trustFilter, groupFilter]);

  const edges = useMemo(() => buildEdges(filteredNodes), [filteredNodes]);

  const selected = useMemo(() => {
    if (!filteredNodes.length) return null;
    const sorted = [...filteredNodes].sort((a, b) => b.influence - a.influence);
    const fallback = sorted[0];
    return filteredNodes.find((n) => n.id === (selectedId ?? fallback.id)) || fallback;
  }, [filteredNodes, selectedId]);

  const avgTrust = useMemo(() => {
    if (!filteredNodes.length) return 0;
    const total = filteredNodes.reduce((sum, item) => sum + (item.trust_score || 0), 0);
    return Math.round(total / filteredNodes.length);
  }, [filteredNodes]);

  const suspiciousCount = useMemo(
    () => filteredNodes.filter((item) => item.group === "risk" || (item.trust_score || 0) < 35).length,
    [filteredNodes]
  );

  const sideDecision = (selected?.trust_score || 0) < 35 ? "FLAGGED" : (selected?.trust_score || 0) < 65 ? "MEDIUM" : "CLEAN";
  const chartHeight = immersive ? 620 : 420;

  return (
    <div className={immersive ? "rounded-2xl border border-cyan-500/20 bg-[#020817] p-4 md:p-5 shadow-[0_0_36px_rgba(0,194,255,0.08)]" : "glass rounded-2xl p-6 glow-border-secondary h-full"}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Influence Network</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Clean network topology with meaningful parent-child propagation links</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setTrustFilter("all");
            setGroupFilter("all");
            setZoom(1);
          }}
          className="inline-flex items-center gap-1.5 rounded-md border border-cyan-500/30 px-2.5 py-1 text-[11px] text-cyan-300 hover:text-cyan-200 transition-colors"
        >
          <RefreshCcw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Refreshing" : "Live"}
        </button>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2 text-[11px]">
        <div className="rounded-lg border border-cyan-500/20 bg-[#05122a] px-2 py-2">
          <div className="text-cyan-200/80">Tracked Nodes</div>
          <div className="font-semibold text-cyan-100">{filteredNodes.length}</div>
        </div>
        <div className="rounded-lg border border-cyan-500/20 bg-[#05122a] px-2 py-2">
          <div className="text-cyan-200/80">Average Trust</div>
          <div className="font-semibold text-cyan-100">{avgTrust}</div>
        </div>
        <div className="rounded-lg border border-rose-500/30 bg-[#13081a] px-2 py-2">
          <div className="text-rose-200/80">Suspicious Nodes</div>
          <div className="font-semibold text-rose-300">{suspiciousCount}</div>
        </div>
      </div>

      <div className="mb-4 grid sm:grid-cols-2 gap-3">
        <div>
          <div className="text-[11px] text-cyan-200/80 mb-1">Trust Filter</div>
          <div className="flex flex-wrap gap-1.5">
            {(["all", "high", "medium", "low"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setTrustFilter(value)}
                className={`rounded-md px-2 py-1 text-[11px] border transition-colors ${
                  trustFilter === value
                    ? "border-cyan-400/60 bg-cyan-400/20 text-cyan-200"
                    : "border-cyan-700/40 text-cyan-300/80"
                }`}
              >
                {value.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[11px] text-cyan-200/80 mb-1">Node Class</div>
          <div className="flex flex-wrap gap-1.5">
            {(["all", "core", "support", "risk"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setGroupFilter(value)}
                className={`rounded-md px-2 py-1 text-[11px] border transition-colors ${
                  groupFilter === value
                    ? "border-indigo-400/60 bg-indigo-400/20 text-indigo-200"
                    : "border-indigo-700/40 text-indigo-300/80"
                }`}
              >
                {value.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={immersive ? "grid xl:grid-cols-[1.85fr_320px] gap-3" : "grid xl:grid-cols-[1.7fr_1fr] gap-4"}>
        <div className="relative overflow-hidden rounded-xl border border-cyan-500/20 bg-[radial-gradient(circle_at_45%_35%,#03213f_0%,#021124_40%,#010713_100%)]" style={{ height: chartHeight }}>
          <div className="absolute left-3 top-3 z-10 rounded-md border border-cyan-500/30 bg-[#05142d]/90 px-3 py-2 text-[10px] text-cyan-200/90">
            <div className="mb-1 uppercase tracking-wide text-cyan-300/80">Legend</div>
            <div>Red links: suspicious flow</div>
            <div>Blue links: normal flow</div>
            <div>Center: top influence source</div>
          </div>

          <div className="absolute right-3 top-3 z-10 flex items-center gap-1 rounded-md border border-cyan-500/30 bg-[#05142d]/90 p-1">
            <button type="button" className="rounded px-1.5 py-1 text-cyan-200 hover:bg-cyan-400/20" onClick={() => setZoom((z) => Math.min(1.6, Number((z + 0.1).toFixed(2))))}>
              <Plus className="h-3.5 w-3.5" />
            </button>
            <button type="button" className="rounded px-1.5 py-1 text-cyan-200 hover:bg-cyan-400/20" onClick={() => setZoom((z) => Math.max(0.7, Number((z - 0.1).toFixed(2))))}>
              <Minus className="h-3.5 w-3.5" />
            </button>
            <button type="button" className="rounded px-1.5 py-1 text-cyan-200 hover:bg-cyan-400/20" onClick={() => setZoom(1)}>
              <RefreshCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="absolute inset-0" style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}>
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <circle cx="50" cy="50" r="43" fill="none" stroke={COLORS.cyanSoft} strokeWidth="0.2" strokeDasharray="1.5 1.8" />
              <circle cx="50" cy="50" r="31" fill="none" stroke={COLORS.cyanSoft} strokeWidth="0.18" strokeDasharray="1.2 1.8" />
              <circle cx="50" cy="50" r="20" fill="none" stroke={COLORS.cyanSoft} strokeWidth="0.16" strokeDasharray="1.2 1.8" />

              {edges.map((edge, idx) => {
                const from = filteredNodes.find((n) => n.id === edge.from);
                const to = filteredNodes.find((n) => n.id === edge.to);
                if (!from || !to) return null;
                const active = hoveredId === edge.from || hoveredId === edge.to || selected?.id === edge.from || selected?.id === edge.to;
                const stroke = edge.risk ? COLORS.risk : COLORS.cyan;
                const cx = (from.x + to.x) / 2;
                const cy = (from.y + to.y) / 2;
                const dx = to.x - from.x;
                const dy = to.y - from.y;
                const length = Math.max(1, Math.sqrt(dx * dx + dy * dy));
                const curve = Math.min(2.8, length * (edge.strength > 0.5 ? 0.08 : 0.05));
                const ox = (-dy / length) * curve;
                const oy = (dx / length) * curve;
                const path = `M ${from.x} ${from.y} Q ${cx + ox} ${cy + oy} ${to.x} ${to.y}`;

                return (
                  <g key={`${edge.from}-${edge.to}-${idx}`}>
                    <path
                      d={path}
                      fill="none"
                      stroke={stroke}
                      strokeWidth={0.1 + edge.strength * (active ? 0.92 : 0.62)}
                      strokeOpacity={active ? 0.9 : 0.25}
                    />
                    <path
                      d={path}
                      fill="none"
                      stroke={stroke}
                      strokeWidth="0.14"
                      strokeDasharray="1.3 2"
                      strokeOpacity={active ? 0.72 : 0.3}
                    >
                      <animate attributeName="stroke-dashoffset" from="14" to="0" dur="1.8s" repeatCount="indefinite" />
                    </path>
                  </g>
                );
              })}
            </svg>

            {filteredNodes.map((node, idx) => {
              const active = hoveredId === node.id || selected?.id === node.id;
              const nodeColor =
                node.group === "risk"
                  ? COLORS.risk
                  : node.trustBand === "high"
                    ? COLORS.clean
                    : node.trustBand === "medium"
                      ? COLORS.medium
                      : COLORS.cyan;

              return (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{ opacity: 1, scale: active ? 1.1 : 1 }}
                  transition={{ duration: 0.24, delay: idx * 0.012 }}
                  className="absolute cursor-pointer"
                  style={{ left: `${node.x}%`, top: `${node.y}%`, transform: "translate(-50%, -50%)" }}
                  onMouseEnter={() => setHoveredId(node.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => setSelectedId(node.id)}
                >
                  <div
                    className="rounded-full border text-[10px] font-bold text-white flex items-center justify-center"
                    style={{
                      width: node.size,
                      height: node.size,
                      borderColor: `${nodeColor}66`,
                      background: `radial-gradient(circle at 28% 22%, ${nodeColor}, ${COLORS.bg1})`,
                      boxShadow: active ? `0 0 16px ${nodeColor}` : `0 0 8px ${nodeColor}99`,
                    }}
                  >
                    {node.influence}
                  </div>

                  {hoveredId === node.id && (
                    <div className="absolute left-1/2 top-full z-20 mt-2 w-56 -translate-x-1/2 rounded-md border border-cyan-500/30 bg-[#041427]/95 p-2 text-[10px] text-cyan-100 shadow-xl">
                      <div className="text-xs font-semibold">@{node.handle}</div>
                      <div className="text-cyan-200/80">Influence {node.influence} | Trust {node.trust_score || 0}</div>
                      <div className="mt-1 text-cyan-100/80">{node.samplePost}</div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-cyan-500/25 bg-[#031227] p-4 text-cyan-100">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <AlertTriangle className="h-4 w-4 text-rose-400" />
            {selected?.name || selected?.handle || "No selection"}
          </div>

          <div className="mt-3 rounded-md border border-cyan-500/30 bg-[#04152d] p-2 text-[11px]">
            <div className="mb-1 text-cyan-200/80">Risk Score</div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-cyan-950">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(8, selected?.influence || 0)}%`,
                  background: sideDecision === "FLAGGED" ? COLORS.risk : sideDecision === "MEDIUM" ? COLORS.medium : COLORS.clean,
                }}
              />
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-cyan-200/75">Decision: {sideDecision}</span>
              <span className="text-cyan-200/75">{selected?.influence ?? 0}/100</span>
            </div>
          </div>

          <div className="mt-3 space-y-1.5 text-[11px]">
            <div className="flex justify-between"><span className="text-cyan-200/70">Handle</span><span>@{selected?.handle || "-"}</span></div>
            <div className="flex justify-between"><span className="text-cyan-200/70">Trust Score</span><span>{selected?.trust_score ?? 0}</span></div>
            <div className="flex justify-between"><span className="text-cyan-200/70">Followers</span><span>{formatCompactNumber(selected?.followers || 0)}</span></div>
            <div className="flex justify-between"><span className="text-cyan-200/70">Posts / 24h</span><span>{selected?.posts_24h || 0}</span></div>
            <div className="flex justify-between"><span className="text-cyan-200/70">Class</span><span className="uppercase">{selected?.group || "-"}</span></div>
            <div className="flex justify-between"><span className="text-cyan-200/70">Node Type</span><span>{selected?.synthetic ? "Secondary" : "Primary"}</span></div>
          </div>

          <div className="mt-3 rounded-md border border-cyan-500/25 bg-[#04152d] p-2 text-[11px]">
            <div className="mb-1 text-cyan-200/80">Signal Summary</div>
            <ul className="space-y-1 text-cyan-100/85">
              <li>Network footprint: {filteredNodes.length} active nodes.</li>
              <li>Connected links: {edges.length}.</li>
              <li>Suspicious links: {edges.filter((e) => e.risk).length}.</li>
            </ul>
          </div>

          <div className="mt-3 rounded-md border border-cyan-500/25 bg-[#04152d] p-2 text-[11px]">
            <div className="mb-1 text-cyan-200/80">Sample Post</div>
            <p className="leading-relaxed text-cyan-100/85">{selected?.samplePost || "No sample post available."}</p>
          </div>

          <div className="mt-3 text-[10px] text-cyan-200/70">Live updates every 45 seconds.</div>
          <div className="mt-2 text-[10px] text-rose-300/90 flex items-center gap-1">
            <Bot className="h-3.5 w-3.5" />
            Bot-like behavior is flagged when trust falls below 35.
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfluenceRadar;
