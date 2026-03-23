import { useState } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Sparkles, Rocket, MessagesSquare, Coins } from "lucide-react";

import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import TopBar from "@/components/dashboard/TopBar";
import { formatCompactNumber, formatPercent, formatPrice, postJson } from "@/lib/api";

type SimPoint = {
  day: number;
  price: number;
  hype: number;
  mentions: number;
  marketCap: number;
};

type SourceShare = {
  source: string;
  mentions: number;
};

type SimulationResponse = {
  points: SimPoint[];
  source_share: SourceShare[];
  model_name: string;
  model_used: boolean;
  confidence: number;
  summary: {
    final_price: number;
    peak_price: number;
    growth_pct: number;
    max_drawdown_pct: number;
  };
};

type SimulationSummary = SimulationResponse["summary"];

type CoinDraft = {
  name: string;
  symbol: string;
  supply: number;
  launchPrice: number;
};

type Scenario = {
  mentionsBase: number;
  sentiment: number;
  influencerPower: number;
  memeVirality: number;
  communityConsistency: number;
};

const sourceColors = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--success))", "hsl(var(--warning))"];

const initialCoin: CoinDraft = {
  name: "HypeFrog",
  symbol: "HFRG",
  supply: 1_000_000_000,
  launchPrice: 0.000012,
};

const initialScenario: Scenario = {
  mentionsBase: 4200,
  sentiment: 68,
  influencerPower: 72,
  memeVirality: 84,
  communityConsistency: 62,
};

function seededNoise(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function runSimulation(coin: CoinDraft, scenario: Scenario, days = 30): SimPoint[] {
  const points: SimPoint[] = [];
  let price = coin.launchPrice;

  for (let day = 0; day <= days; day += 1) {
    const wave = Math.sin((day / days) * Math.PI * 2) * (scenario.memeVirality / 10);
    const burst = seededNoise(day + scenario.influencerPower) * (scenario.influencerPower / 4);
    const sentimentFactor = (scenario.sentiment - 50) / 50;
    const consistencyFactor = (scenario.communityConsistency - 50) / 50;

    const mentions = Math.max(
      100,
      Math.round(
        scenario.mentionsBase *
          (1 + day * 0.03 + wave * 0.02 + burst * 0.04 + consistencyFactor * 0.2)
      )
    );

    const hype = clamp(
      50 +
        (mentions / scenario.mentionsBase - 1) * 30 +
        sentimentFactor * 22 +
        (scenario.influencerPower - 50) * 0.35 +
        burst * 0.9,
      0,
      100
    );

    const dailyDrift = (hype - 50) / 320 + sentimentFactor / 100 + consistencyFactor / 180;
    const volatility = (seededNoise(day * 17 + scenario.memeVirality) - 0.5) * 0.09;
    price = Math.max(0.0000001, price * (1 + dailyDrift + volatility));

    points.push({
      day,
      price: Number(price.toFixed(6)),
      hype: Number(hype.toFixed(2)),
      mentions,
      marketCap: Number((price * coin.supply).toFixed(0)),
    });
  }

  return points;
}

function computeSourceShare(points: SimPoint[], scenario: Scenario): SourceShare[] {
  const totalMentions = points.reduce((sum, p) => sum + p.mentions, 0);
  const twitterShare = clamp(0.48 + (scenario.memeVirality - 50) / 250, 0.3, 0.7);
  const redditShare = clamp(0.32 + (scenario.communityConsistency - 50) / 280, 0.15, 0.5);
  const telegramShare = clamp(1 - twitterShare - redditShare, 0.1, 0.4);

  const twitter = Math.round(totalMentions * twitterShare);
  const reddit = Math.round(totalMentions * redditShare);
  const telegram = Math.round(totalMentions * telegramShare);
  const other = Math.max(0, totalMentions - twitter - reddit - telegram);

  return [
    { source: "Twitter/X", mentions: twitter },
    { source: "Reddit", mentions: reddit },
    { source: "Telegram", mentions: telegram },
    { source: "Other", mentions: other },
  ];
}

function computeSummary(points: SimPoint[]): SimulationSummary {
  if (points.length === 0) {
    return {
      final_price: 0,
      peak_price: 0,
      growth_pct: 0,
      max_drawdown_pct: 0,
    };
  }

  const first = points[0].price;
  const final = points[points.length - 1].price;
  const peak = Math.max(...points.map((p) => p.price));
  const trough = Math.min(...points.map((p) => p.price));

  return {
    final_price: Number(final.toFixed(6)),
    peak_price: Number(peak.toFixed(6)),
    growth_pct: Number((((final - first) / Math.max(first, 1e-9)) * 100).toFixed(3)),
    max_drawdown_pct: Number((((peak - trough) / Math.max(peak, 1e-9)) * 100).toFixed(3)),
  };
}

const Playground = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [timeFilter, setTimeFilter] = useState("30d");
  const [search, setSearch] = useState("");

  const [coin, setCoin] = useState<CoinDraft>(initialCoin);
  const [scenario, setScenario] = useState<Scenario>(initialScenario);
  const [simulation, setSimulation] = useState<SimPoint[]>([]);
  const [sourceShare, setSourceShare] = useState<SourceShare[]>([]);
  const [summary, setSummary] = useState<SimulationSummary | null>(null);
  const [hasRun, setHasRun] = useState(false);
  const [runLoading, setRunLoading] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [modelMeta, setModelMeta] = useState({
    modelName: "not-started",
    modelUsed: false,
    confidence: 0,
  });

  const latest = simulation.length > 0 ? simulation[simulation.length - 1] : null;
  const totalMentions = simulation.reduce((sum, point) => sum + point.mentions, 0);

  const launchSimulation = async () => {
    setRunLoading(true);
    setRunError(null);
    setHasRun(true);

    try {
      const response = await postJson<SimulationResponse, Record<string, number | string>>(
        "/models/playground-simulate",
        {
          coin_name: coin.name,
          coin_symbol: coin.symbol,
          supply: coin.supply,
          launch_price: coin.launchPrice,
          mentions_base: scenario.mentionsBase,
          sentiment: scenario.sentiment,
          influencer_power: scenario.influencerPower,
          meme_virality: scenario.memeVirality,
          community_consistency: scenario.communityConsistency,
          days: 30,
        }
      );

      setSimulation(response.points);
      setSourceShare(response.source_share);
      setSummary(response.summary);
      setModelMeta({
        modelName: response.model_name,
        modelUsed: response.model_used,
        confidence: response.confidence,
      });
    } catch {
      const fallbackPoints = runSimulation(coin, scenario, 30);
      setSimulation(fallbackPoints);
      setSourceShare(computeSourceShare(fallbackPoints, scenario));
      setSummary(computeSummary(fallbackPoints));
      setModelMeta({
        modelName: "local-heuristic",
        modelUsed: false,
        confidence: 58,
      });
      setRunError("Backend model unavailable. Showing local simulation fallback.");
    } finally {
      setRunLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex gradient-bg-subtle">
      <DashboardSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <TopBar
          search={search}
          onSearchChange={setSearch}
          timeFilter={timeFilter}
          onTimeFilterChange={setTimeFilter}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-6">
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl border border-secondary/30 bg-gradient-to-r from-secondary/10 via-card/80 to-primary/10 p-6"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-lg font-bold text-foreground">Meme Coin Playground</h1>
                <p className="text-sm text-muted-foreground">
                  Create your own meme coin and visualize how social hype can move its value.
                </p>
              </div>
              <button
                onClick={launchSimulation}
                disabled={runLoading}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
              >
                <Rocket className="h-4 w-4" />
                {runLoading ? "Running Model..." : "Run New Simulation"}
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
              <span className="rounded border border-border/70 bg-card/40 px-2 py-1 text-muted-foreground">
                Engine: <span className="text-foreground font-medium break-all">{modelMeta.modelName}</span>
              </span>
              <span className={`rounded border px-2 py-1 ${modelMeta.modelUsed ? "border-success/50 text-success" : "border-warning/50 text-warning"}`}>
                {modelMeta.modelUsed ? "ML Model Active" : "Fallback Mode"}
              </span>
              <span className="rounded border border-border/70 bg-card/40 px-2 py-1 text-muted-foreground">
                Confidence: <span className="text-foreground font-medium">{modelMeta.confidence.toFixed(1)}%</span>
              </span>
            </div>
            {runError && <p className="mt-2 text-xs text-warning">{runError}</p>}
          </motion.section>

          <div className="grid xl:grid-cols-[340px_minmax(0,1fr)] gap-6 items-start">
            <motion.section
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="xl:col-span-1 glass rounded-2xl p-5 space-y-5 xl:sticky xl:top-6"
            >
              <div>
                <h2 className="text-sm font-semibold text-foreground">Coin Builder</h2>
                <p className="text-xs text-muted-foreground">Define your meme coin profile and social conditions.</p>
              </div>

              <div className="space-y-3">
                <label className="text-xs text-muted-foreground">Coin Name</label>
                <input
                  value={coin.name}
                  onChange={(e) => setCoin((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                />

                <label className="text-xs text-muted-foreground">Ticker Symbol</label>
                <input
                  value={coin.symbol}
                  onChange={(e) => setCoin((prev) => ({ ...prev, symbol: e.target.value.toUpperCase().slice(0, 8) }))}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                />

                <label className="text-xs text-muted-foreground">Total Supply</label>
                <input
                  type="number"
                  value={coin.supply}
                  onChange={(e) => setCoin((prev) => ({ ...prev, supply: Math.max(1, Number(e.target.value) || 1) }))}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                />

                <label className="text-xs text-muted-foreground">Launch Price (USD)</label>
                <input
                  type="number"
                  step="0.000001"
                  value={coin.launchPrice}
                  onChange={(e) => setCoin((prev) => ({ ...prev, launchPrice: Math.max(0.0000001, Number(e.target.value) || 0.0000001) }))}
                  className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm"
                />
              </div>

              <div className="space-y-4">
                {[
                  { key: "mentionsBase", label: "Daily Mentions Base", min: 500, max: 30000 },
                  { key: "sentiment", label: "Social Sentiment", min: 0, max: 100 },
                  { key: "influencerPower", label: "Influencer Power", min: 0, max: 100 },
                  { key: "memeVirality", label: "Meme Virality", min: 0, max: 100 },
                  { key: "communityConsistency", label: "Community Consistency", min: 0, max: 100 },
                ].map((control) => (
                  <div key={control.key}>
                    <div className="mb-1 flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">{control.label}</span>
                      <span className="font-mono text-foreground">{scenario[control.key as keyof Scenario]}</span>
                    </div>
                    <input
                      type="range"
                      min={control.min}
                      max={control.max}
                      value={scenario[control.key as keyof Scenario]}
                      onChange={(e) =>
                        setScenario((prev) => ({
                          ...prev,
                          [control.key]: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-primary"
                    />
                  </div>
                ))}
              </div>
            </motion.section>

            <div className="xl:col-span-1 min-w-0 space-y-6">
              {!hasRun && (
                <motion.section
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.08 }}
                  className="glass rounded-2xl p-6 h-full min-h-[420px] flex items-center justify-center"
                >
                  <div className="text-center max-w-md">
                    <Rocket className="h-10 w-10 mx-auto text-primary mb-3" />
                    <h3 className="text-base font-semibold text-foreground">Simulation Results Will Appear Here</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Fill the coin details on the left and click <strong>Run New Simulation</strong>. The AI model will then generate predictions, metrics, and charts.
                    </p>
                  </div>
                </motion.section>
              )}

              {hasRun && latest && summary && (
                <>
                  <motion.section
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.08 }}
                    className="grid sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4"
                  >
                    <div className="metric-card">
                      <div className="text-xs text-muted-foreground mb-1">Current Price</div>
                      <div className="text-xl font-semibold text-primary font-mono">{formatPrice(latest.price)}</div>
                    </div>
                    <div className="metric-card">
                      <div className="text-xs text-muted-foreground mb-1">Value Growth</div>
                      <div className={`text-xl font-semibold font-mono ${summary.growth_pct >= 0 ? "text-success" : "text-destructive"}`}>
                        {formatPercent(summary.growth_pct)}
                      </div>
                    </div>
                    <div className="metric-card">
                      <div className="text-xs text-muted-foreground mb-1">Peak Price</div>
                      <div className="text-xl font-semibold text-foreground font-mono">{formatPrice(summary.peak_price)}</div>
                    </div>
                    <div className="metric-card">
                      <div className="text-xs text-muted-foreground mb-1">Max Drawdown</div>
                      <div className="text-xl font-semibold text-warning font-mono">{formatPercent(-Math.abs(summary.max_drawdown_pct))}</div>
                    </div>
                    <div className="metric-card">
                      <div className="text-xs text-muted-foreground mb-1">Hype Index</div>
                      <div className="text-xl font-semibold text-secondary font-mono">{latest.hype.toFixed(1)}</div>
                    </div>
                    <div className="metric-card">
                      <div className="text-xs text-muted-foreground mb-1">Mentions Total</div>
                      <div className="text-xl font-semibold text-foreground font-mono">{formatCompactNumber(totalMentions)}</div>
                    </div>
                  </motion.section>

                  <motion.section
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.12 }}
                    className="glass rounded-2xl p-5"
                  >
                    <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Sparkles className="h-4 w-4 text-secondary" />
                      Hype vs Coin Value Projection ({coin.symbol})
                    </div>
                    <div className="w-full overflow-hidden">
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={simulation}>
                        <defs>
                          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                          </linearGradient>
                          <linearGradient id="hypeGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.35} />
                            <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                        <YAxis yAxisId="left" tick={{ fontSize: 10 }} />
                        <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Area yAxisId="left" type="monotone" dataKey="price" stroke="hsl(var(--primary))" fill="url(#priceGradient)" strokeWidth={2} />
                        <Area yAxisId="right" type="monotone" dataKey="hype" stroke="hsl(var(--secondary))" fill="url(#hypeGradient)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                    </div>
                  </motion.section>

                  <div className="grid 2xl:grid-cols-2 gap-6">
                    <motion.section
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.18 }}
                      className="glass rounded-2xl p-5 min-w-0"
                    >
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                        <MessagesSquare className="h-4 w-4 text-warning" />
                        Daily Mentions Momentum
                      </div>
                      <div className="w-full overflow-hidden">
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={simulation}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Bar dataKey="mentions" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                      </div>
                    </motion.section>

                    <motion.section
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.22 }}
                      className="glass rounded-2xl p-5 min-w-0"
                    >
                      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Coins className="h-4 w-4 text-success" />
                        Mention Source Distribution
                      </div>
                      <div className="w-full overflow-hidden">
                      <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                          <Pie data={sourceShare} dataKey="mentions" nameKey="source" outerRadius={84} labelLine={false}>
                            {sourceShare.map((entry, index) => (
                              <Cell key={`source-${entry.source}`} fill={sourceColors[index % sourceColors.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      </div>
                    </motion.section>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Playground;
