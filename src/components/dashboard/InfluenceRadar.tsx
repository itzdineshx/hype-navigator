import { useEffect, useMemo, useState } from "react";
import { RefreshCcw } from "lucide-react";
import { fetchJson } from "@/lib/api";

type RadarNode = {
  id: number;
  x: number;
  y: number;
  size: number;
  name?: string;
  handle: string;
  followers?: number;
  category?: string;
  quality_score?: number;
  tier?: "alpha" | "core" | "watch" | "risk" | string;
  impact_score: number;
  trust_score?: number;
  posts_24h: number;
};

const fallbackNodes: RadarNode[] = [
  {
    id: 1,
    x: 50,
    y: 38,
    size: 38,
    name: "Crypto King",
    handle: "CryptoKing",
    followers: 2300000,
    category: "analyst",
    quality_score: 91,
    tier: "alpha",
    impact_score: 94,
    trust_score: 88,
    posts_24h: 142,
  },
  {
    id: 2,
    x: 27,
    y: 24,
    size: 28,
    name: "Degen Trader",
    handle: "DegenTrader",
    followers: 890000,
    category: "trader",
    quality_score: 71,
    tier: "core",
    impact_score: 72,
    trust_score: 65,
    posts_24h: 89,
  },
  {
    id: 3,
    x: 75,
    y: 22,
    size: 32,
    name: "Whale Alert",
    handle: "WhaleAlert",
    followers: 1800000,
    category: "analytics",
    quality_score: 86,
    tier: "alpha",
    impact_score: 88,
    trust_score: 82,
    posts_24h: 201,
  },
  {
    id: 4,
    x: 22,
    y: 70,
    size: 22,
    name: "Meme Hunter",
    handle: "MemeHunter",
    followers: 340000,
    category: "meme",
    quality_score: 57,
    tier: "watch",
    impact_score: 65,
    trust_score: 48,
    posts_24h: 56,
  },
  {
    id: 5,
    x: 78,
    y: 66,
    size: 30,
    name: "Alpha Leaks",
    handle: "AlphaLeaks",
    followers: 1200000,
    category: "news",
    quality_score: 80,
    tier: "core",
    impact_score: 81,
    trust_score: 77,
    posts_24h: 167,
  },
];

const tierColors: Record<string, string> = {
  alpha: "hsl(142, 71%, 45%)",
  core: "hsl(217, 91%, 60%)",
  watch: "hsl(38, 92%, 50%)",
  risk: "hsl(0, 72%, 51%)",
};

const formatCompact = (value: number): string =>
  new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);

const InfluenceRadar = () => {
  const [nodes, setNodes] = useState<RadarNode[]>(fallbackNodes);
  const [hovered, setHovered] = useState<number | null>(null);
  const [selectedTier, setSelectedTier] = useState<string>("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const load = async (silent = false) => {
      try {
        if (!silent && mounted) setLoading(true);
        const payload = await fetchJson<RadarNode[]>("/influence/radar");
        if (mounted && payload.length > 0) {
          setNodes(payload);
        }
      } catch {
        // Keep fallback nodes when backend is unavailable.
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

  const filteredNodes = useMemo(() => {
    if (selectedTier === "all") return nodes;
    return nodes.filter((node) => (node.tier || "watch") === selectedTier);
  }, [nodes, selectedTier]);

  const topNode = useMemo(() => {
    if (filteredNodes.length === 0) return null;
    return [...filteredNodes].sort((a, b) => (b.quality_score || b.impact_score) - (a.quality_score || a.impact_score))[0];
  }, [filteredNodes]);

  const avgTrust = useMemo(() => {
    if (filteredNodes.length === 0) return 0;
    const total = filteredNodes.reduce((sum, node) => sum + (node.trust_score || 0), 0);
    return Math.round(total / filteredNodes.length);
  }, [filteredNodes]);

  const edges = useMemo(() => {
    if (filteredNodes.length < 2) return [] as number[][];
    const sorted = [...filteredNodes].sort((a, b) => (b.quality_score || b.impact_score) - (a.quality_score || a.impact_score));
    const center = sorted[0].id;
    const starEdges = sorted.slice(1).map((node) => [center, node.id]);
    const chainEdges = sorted
      .slice(1)
      .map((node, index) => {
      if (index === 0) return null;
      return [sorted[index].id, node.id];
    })
      .filter((edge): edge is number[] => edge !== null);
    return [...starEdges, ...chainEdges];
  }, [filteredNodes]);

  return (
    <div className="glass rounded-2xl p-6 glow-border-secondary h-full">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">📡 Influence Radar</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Live influencer network and quality clusters</p>
        </div>
        <button
          onClick={() => setSelectedTier("all")}
          className="inline-flex items-center gap-1.5 rounded-md border border-border/70 px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          type="button"
        >
          <RefreshCcw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Refreshing" : "Live"}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4 text-[11px]">
        <div className="rounded-lg border border-border/60 bg-card/40 px-2 py-2">
          <div className="text-muted-foreground">Top Node</div>
          <div className="font-semibold text-foreground truncate">@{topNode?.handle || "-"}</div>
        </div>
        <div className="rounded-lg border border-border/60 bg-card/40 px-2 py-2">
          <div className="text-muted-foreground">Nodes</div>
          <div className="font-semibold text-foreground">{filteredNodes.length}</div>
        </div>
        <div className="rounded-lg border border-border/60 bg-card/40 px-2 py-2">
          <div className="text-muted-foreground">Avg Trust</div>
          <div className="font-semibold text-foreground">{avgTrust}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {["all", "alpha", "core", "watch", "risk"].map((tier) => {
          const active = selectedTier === tier;
          return (
            <button
              key={tier}
              type="button"
              onClick={() => setSelectedTier(tier)}
              className={`rounded-md px-2 py-1 text-[11px] border transition-colors ${
                active ? "border-primary/60 text-primary bg-primary/10" : "border-border/60 text-muted-foreground"
              }`}
            >
              {tier.toUpperCase()}
            </button>
          );
        })}
      </div>

      <div className="relative h-72">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" aria-hidden>
          <circle cx="50" cy="50" r="39" fill="none" stroke="hsl(228, 12%, 16%)" strokeWidth="0.4" />
          <circle cx="50" cy="50" r="29" fill="none" stroke="hsl(228, 12%, 16%)" strokeWidth="0.3" />
          <circle cx="50" cy="50" r="19" fill="none" stroke="hsl(228, 12%, 16%)" strokeWidth="0.3" />
          <line x1="11" y1="50" x2="89" y2="50" stroke="hsl(228, 12%, 16%)" strokeWidth="0.3" />
          <line x1="50" y1="11" x2="50" y2="89" stroke="hsl(228, 12%, 16%)" strokeWidth="0.3" />

          {edges.map(([a, b], i) => {
            const na = filteredNodes.find((n) => n.id === a)!;
            const nb = filteredNodes.find((n) => n.id === b)!;
            const isActive = hovered === a || hovered === b;
            return (
              <line
                key={i}
                x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
                stroke={isActive ? "hsl(217, 91%, 60%)" : "hsl(228, 12%, 20%)"}
                strokeWidth={isActive ? "0.6" : "0.3"}
                strokeOpacity={isActive ? 0.8 : 0.4}
                className="transition-all duration-300"
              />
            );
          })}
        </svg>

        {filteredNodes.map((n) => {
          const tierColor = tierColors[n.tier || "watch"] || "hsl(217, 91%, 60%)";
          const quality = Math.round(n.quality_score || n.impact_score);
          const trust = n.trust_score || 0;
          return (
          <div
            key={n.id}
            className="absolute cursor-pointer group"
            style={{ left: `${n.x}%`, top: `${n.y}%`, transform: "translate(-50%, -50%)" }}
            onMouseEnter={() => setHovered(n.id)}
            onMouseLeave={() => setHovered(null)}
          >
            <div
              className={`rounded-full flex items-center justify-center text-[9px] font-bold text-foreground transition-all duration-300 ${
                hovered === n.id ? "scale-150 glow-secondary" : ""
              }`}
              style={{
                width: n.size,
                height: n.size,
                boxShadow: hovered === n.id ? `0 0 14px ${tierColor}` : "none",
                background: `radial-gradient(circle at 30% 30%, ${tierColor}, hsl(228, 12%, 14%))`,
              }}
            >
              {quality}
            </div>

            {hovered === n.id && (
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 glass-strong rounded-lg px-3 py-2 whitespace-nowrap z-20 animate-fade-in">
                <div className="text-xs font-semibold text-foreground">@{n.handle}</div>
                <div className="text-[10px] text-muted-foreground">{n.name || "Influencer"}</div>
                <div className="text-[10px] text-muted-foreground">Impact: {n.impact_score}/100</div>
                <div className="text-[10px] text-muted-foreground">Trust: {trust}/100</div>
                <div className="text-[10px] text-muted-foreground">{n.posts_24h} posts / {formatCompact(n.followers || 0)} followers</div>
              </div>
            )}
          </div>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
        {Object.entries(tierColors).map(([tier, color]) => (
          <div key={tier} className="flex items-center gap-1.5 text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span>{tier.toUpperCase()}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InfluenceRadar;
