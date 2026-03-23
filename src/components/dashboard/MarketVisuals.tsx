import { useEffect, useMemo, useState } from "react";
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchJson } from "@/lib/api";

type TrendPoint = {
  ts: string;
  mentions: number;
  sentiment: number;
};

type TrendingCoin = {
  symbol: string;
  hype_score: number;
  trust_score: number;
  risk_level: string;
};

type SocialPost = {
  source: string;
  engagement_score?: number;
  sentiment_compound?: number;
};

type MomentumPoint = {
  time: string;
  mentions: number;
  sentiment: number;
};

type RiskSlice = {
  name: string;
  value: number;
  color: string;
};

type SourceBar = {
  source: string;
  posts: number;
  avgEngagement: number;
};

const momentumFallback: MomentumPoint[] = [
  { time: "00:00", mentions: 120, sentiment: 64 },
  { time: "03:00", mentions: 110, sentiment: 61 },
  { time: "06:00", mentions: 150, sentiment: 68 },
  { time: "09:00", mentions: 290, sentiment: 73 },
  { time: "12:00", mentions: 430, sentiment: 58 },
  { time: "15:00", mentions: 390, sentiment: 53 },
  { time: "18:00", mentions: 520, sentiment: 44 },
  { time: "21:00", mentions: 455, sentiment: 60 },
  { time: "Now", mentions: 378, sentiment: 66 },
];

const riskFallback: RiskSlice[] = [
  { name: "Low", value: 4, color: "hsl(142, 71%, 45%)" },
  { name: "Medium", value: 5, color: "hsl(38, 92%, 50%)" },
  { name: "High", value: 3, color: "hsl(0, 72%, 51%)" },
];

const sourceFallback: SourceBar[] = [
  { source: "twitter", posts: 320, avgEngagement: 64 },
  { source: "reddit", posts: 210, avgEngagement: 52 },
  { source: "news", posts: 96, avgEngagement: 38 },
];

const classifyRisk = (riskLevel: string, trust: number): "Low" | "Medium" | "High" => {
  const risk = (riskLevel || "").toLowerCase();
  if (risk.includes("high") || trust < 35) return "High";
  if (risk.includes("medium") || trust < 60) return "Medium";
  return "Low";
};

const InsightTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="glass-strong rounded-lg p-3 text-xs">
      <div className="font-semibold text-foreground mb-1">{label}</div>
      {payload.map((item: any, idx: number) => (
        <div key={idx} className="text-muted-foreground">
          <span style={{ color: item.color }} className="font-medium">{item.name}</span>: {item.value}
        </div>
      ))}
    </div>
  );
};

const MarketVisuals = () => {
  const [momentumData, setMomentumData] = useState<MomentumPoint[]>(momentumFallback);
  const [riskData, setRiskData] = useState<RiskSlice[]>(riskFallback);
  const [sourceData, setSourceData] = useState<SourceBar[]>(sourceFallback);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const [trendResult, trendingResult, socialResult] = await Promise.allSettled([
          fetchJson<TrendPoint[]>("/dashboard/trend-chart?symbol=DOGE&limit=24"),
          fetchJson<TrendingCoin[]>("/dashboard/trending?limit=20"),
          fetchJson<SocialPost[]>("/social/posts?limit=300"),
        ]);

        if (!mounted) return;

        if (trendResult.status === "fulfilled" && trendResult.value.length > 0) {
          const mapped = trendResult.value
            .slice()
            .reverse()
            .map((point) => ({
              time: new Date(point.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              mentions: point.mentions,
              sentiment: point.sentiment,
            }));
          setMomentumData(mapped);
        }

        if (trendingResult.status === "fulfilled" && trendingResult.value.length > 0) {
          const tally = { Low: 0, Medium: 0, High: 0 };
          for (const coin of trendingResult.value) {
            const bucket = classifyRisk(coin.risk_level, coin.trust_score);
            tally[bucket] += 1;
          }
          setRiskData([
            { name: "Low", value: Math.max(1, tally.Low), color: "hsl(142, 71%, 45%)" },
            { name: "Medium", value: Math.max(1, tally.Medium), color: "hsl(38, 92%, 50%)" },
            { name: "High", value: Math.max(1, tally.High), color: "hsl(0, 72%, 51%)" },
          ]);
        }

        if (socialResult.status === "fulfilled" && socialResult.value.length > 0) {
          const grouped = new Map<string, { posts: number; engagement: number }>();
          for (const post of socialResult.value) {
            const key = (post.source || "unknown").toLowerCase();
            const current = grouped.get(key) || { posts: 0, engagement: 0 };
            current.posts += 1;
            current.engagement += post.engagement_score || 0;
            grouped.set(key, current);
          }

          const normalized = Array.from(grouped.entries())
            .map(([source, stats]) => ({
              source,
              posts: stats.posts,
              avgEngagement: stats.posts ? Math.round(stats.engagement / stats.posts) : 0,
            }))
            .sort((a, b) => b.posts - a.posts)
            .slice(0, 4);

          if (normalized.length > 0) {
            setSourceData(normalized);
          }
        }
      } catch {
        // Keep fallback visuals when backend is not available.
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const netMomentum = useMemo(() => {
    if (momentumData.length < 2) return 0;
    const first = momentumData[0].mentions;
    const last = momentumData[momentumData.length - 1].mentions;
    if (first === 0) return 0;
    return Math.round(((last - first) / first) * 100);
  }, [momentumData]);

  return (
    <div className="glass rounded-2xl p-6 glow-border-secondary">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Visual Intelligence</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Momentum, risk distribution, and social source quality</p>
        </div>
        <div className="text-xs rounded-lg border border-border/60 bg-card/50 px-3 py-2">
          <span className="text-muted-foreground">Net Momentum:</span>
          <span className={`ml-2 font-semibold ${netMomentum >= 0 ? "text-success" : "text-destructive"}`}>
            {netMomentum >= 0 ? "+" : ""}{netMomentum}%
          </span>
        </div>
      </div>

      <div className="grid xl:grid-cols-[1.4fr_1fr] gap-5">
        <div className="rounded-xl border border-border/60 bg-card/35 p-4">
          <div className="text-xs font-medium text-foreground mb-3">Mentions vs Sentiment Momentum</div>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={momentumData}>
              <defs>
                <linearGradient id="vizMentions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(228, 12%, 16%)" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: "hsl(215, 20%, 55%)" }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "hsl(215, 20%, 55%)" }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "hsl(215, 20%, 55%)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<InsightTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area yAxisId="left" type="monotone" dataKey="mentions" name="Mentions" stroke="hsl(217, 91%, 60%)" fill="url(#vizMentions)" strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="sentiment" name="Sentiment" stroke="hsl(270, 70%, 60%)" strokeWidth={2.2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="grid gap-5">
          <div className="rounded-xl border border-border/60 bg-card/35 p-4">
            <div className="text-xs font-medium text-foreground mb-3">Risk Composition</div>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={riskData} dataKey="value" nameKey="name" innerRadius={36} outerRadius={60} paddingAngle={3}>
                  {riskData.map((slice) => (
                    <Cell key={slice.name} fill={slice.color} />
                  ))}
                </Pie>
                <Tooltip content={<InsightTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {riskData.map((slice) => (
                <div key={slice.name} className="text-[11px] text-center rounded-md border border-border/60 py-1.5">
                  <div className="font-semibold" style={{ color: slice.color }}>{slice.value}</div>
                  <div className="text-muted-foreground">{slice.name}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-card/35 p-4">
            <div className="text-xs font-medium text-foreground mb-3">Source Activity Quality</div>
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={sourceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(228, 12%, 16%)" />
                <XAxis dataKey="source" tick={{ fontSize: 11, fill: "hsl(215, 20%, 55%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(215, 20%, 55%)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<InsightTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="posts" name="Posts" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgEngagement" name="Avg Engagement" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketVisuals;
