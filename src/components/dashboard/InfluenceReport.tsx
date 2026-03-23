import { useEffect, useMemo, useState } from "react";
import { Activity, BarChart3, Download, FileJson, FileSpreadsheet, MessageSquare, ShieldCheck, Users } from "lucide-react";
import { fetchJson, formatCompactNumber } from "@/lib/api";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Influencer = {
  handle: string;
  name: string;
  followers: number;
  trust_score: number;
  impact_score: number;
  posts_24h: number;
  category: string;
};

type InfluenceMetric = {
  influencer_handle: string;
  metric: string;
  value: number;
};

type RadarNode = {
  handle: string;
  quality_score?: number;
  tier?: string;
};

type SocialPost = {
  source: string;
  post_id: string;
  author: string;
  context: string;
  text: string;
  coin_symbol: string;
  influencer_handle: string;
  engagement_score: number;
  sentiment_compound: number;
  created_at: string;
};

type ReportRow = {
  rank: number;
  handle: string;
  name: string;
  category: string;
  followers: number;
  trust: number;
  impact: number;
  posts24h: number;
  quality: number;
  tier: string;
  reach: number;
  activity: number;
};

const fallbackInfluencers: Influencer[] = [
  {
    handle: "CryptoKing",
    name: "Crypto King",
    followers: 2300000,
    trust_score: 88,
    impact_score: 94,
    posts_24h: 42,
    category: "analyst",
  },
  {
    handle: "WhaleAlert",
    name: "Whale Alert",
    followers: 1800000,
    trust_score: 82,
    impact_score: 88,
    posts_24h: 201,
    category: "analytics",
  },
  {
    handle: "AlphaLeaks",
    name: "Alpha Leaks",
    followers: 920000,
    trust_score: 77,
    impact_score: 81,
    posts_24h: 57,
    category: "news",
  },
];

const fallbackMetrics: InfluenceMetric[] = [
  { influencer_handle: "CryptoKing", metric: "reach", value: 95 },
  { influencer_handle: "CryptoKing", metric: "activity", value: 70 },
  { influencer_handle: "WhaleAlert", metric: "reach", value: 80 },
  { influencer_handle: "WhaleAlert", metric: "activity", value: 90 },
  { influencer_handle: "AlphaLeaks", metric: "reach", value: 70 },
  { influencer_handle: "AlphaLeaks", metric: "activity", value: 85 },
];

const fallbackRadar: RadarNode[] = [
  { handle: "CryptoKing", quality_score: 90, tier: "alpha" },
  { handle: "WhaleAlert", quality_score: 85, tier: "core" },
  { handle: "AlphaLeaks", quality_score: 80, tier: "core" },
];

const fallbackSocialPosts: SocialPost[] = [
  {
    source: "twitter",
    post_id: "demo-1",
    author: "CryptoKing",
    context: "doge",
    text: "DOGE momentum looks strong today.",
    coin_symbol: "DOGE",
    influencer_handle: "CryptoKing",
    engagement_score: 420,
    sentiment_compound: 0.73,
    created_at: new Date().toISOString(),
  },
  {
    source: "reddit",
    post_id: "demo-2",
    author: "AlphaLeaks",
    context: "CryptoMarkets",
    text: "PEPE discussion volume and sentiment are both increasing.",
    coin_symbol: "PEPE",
    influencer_handle: "AlphaLeaks",
    engagement_score: 150,
    sentiment_compound: 0.44,
    created_at: new Date().toISOString(),
  },
];

const tierClass: Record<string, string> = {
  alpha: "bg-success/15 text-success",
  core: "bg-primary/15 text-primary",
  watch: "bg-warning/15 text-warning",
  risk: "bg-destructive/15 text-destructive",
};

const pieColors = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))"];

function csvEscape(value: string | number): string {
  const raw = String(value ?? "");
  const escaped = raw.replace(/"/g, '""');
  return `"${escaped}"`;
}

function downloadBlob(content: string, fileName: string, contentType: string): void {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

const InfluenceReport = () => {
  const [influencers, setInfluencers] = useState<Influencer[]>(fallbackInfluencers);
  const [metrics, setMetrics] = useState<InfluenceMetric[]>(fallbackMetrics);
  const [radarNodes, setRadarNodes] = useState<RadarNode[]>(fallbackRadar);
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>(fallbackSocialPosts);
  const [lastRefreshed, setLastRefreshed] = useState<string>(new Date().toISOString());

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const [topResult, metricResult, radarResult, socialResult] = await Promise.allSettled([
          fetchJson<Influencer[]>("/influence/top?limit=20"),
          fetchJson<InfluenceMetric[]>("/influence/metrics"),
          fetchJson<RadarNode[]>("/influence/radar"),
          fetchJson<SocialPost[]>("/social/posts?limit=250"),
        ]);

        if (!mounted) return;

        if (topResult.status === "fulfilled" && topResult.value.length > 0) {
          setInfluencers(topResult.value);
        }
        if (metricResult.status === "fulfilled" && metricResult.value.length > 0) {
          setMetrics(metricResult.value);
        }
        if (radarResult.status === "fulfilled" && radarResult.value.length > 0) {
          setRadarNodes(radarResult.value);
        }
        if (socialResult.status === "fulfilled" && socialResult.value.length > 0) {
          setSocialPosts(socialResult.value);
        }
        setLastRefreshed(new Date().toISOString());
      } catch {
        // Keep fallback values if backend calls fail.
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  const reportRows = useMemo<ReportRow[]>(() => {
    const metricIndex = new Map<string, { reach: number; activity: number }>();
    for (const metric of metrics) {
      if (!metricIndex.has(metric.influencer_handle)) {
        metricIndex.set(metric.influencer_handle, { reach: 0, activity: 0 });
      }
      const row = metricIndex.get(metric.influencer_handle)!;
      if (metric.metric === "reach") row.reach = metric.value;
      if (metric.metric === "activity") row.activity = metric.value;
    }

    const radarIndex = new Map<string, { quality: number; tier: string }>();
    for (const node of radarNodes) {
      radarIndex.set(node.handle, {
        quality: Math.round(node.quality_score ?? 0),
        tier: (node.tier || "watch").toLowerCase(),
      });
    }

    return influencers
      .map((influencer, idx) => {
        const metricRow = metricIndex.get(influencer.handle) || { reach: 0, activity: 0 };
        const radarRow = radarIndex.get(influencer.handle) || {
          quality: Math.round((influencer.impact_score * 0.6) + (influencer.trust_score * 0.4)),
          tier: "watch",
        };

        return {
          rank: idx + 1,
          handle: influencer.handle,
          name: influencer.name,
          category: influencer.category,
          followers: influencer.followers,
          trust: influencer.trust_score,
          impact: influencer.impact_score,
          posts24h: influencer.posts_24h,
          quality: radarRow.quality,
          tier: radarRow.tier,
          reach: metricRow.reach,
          activity: metricRow.activity,
        };
      })
      .sort((a, b) => b.quality - a.quality);
  }, [influencers, metrics, radarNodes]);

  const summary = useMemo(() => {
    if (reportRows.length === 0) {
      return {
        tracked: 0,
        totalReach: 0,
        avgTrust: 0,
        avgImpact: 0,
      };
    }

    const tracked = reportRows.length;
    const totalReach = reportRows.reduce((sum, row) => sum + row.followers, 0);
    const avgTrust = Math.round(reportRows.reduce((sum, row) => sum + row.trust, 0) / tracked);
    const avgImpact = Math.round(reportRows.reduce((sum, row) => sum + row.impact, 0) / tracked);

    return {
      tracked,
      totalReach,
      avgTrust,
      avgImpact,
    };
  }, [reportRows]);

  const socialSummary = useMemo(() => {
    if (socialPosts.length === 0) {
      return {
        total: 0,
        twitter: 0,
        reddit: 0,
        bullish: 0,
        neutral: 0,
        bearish: 0,
        avgSentiment: 0,
        topCoins: [] as Array<{ symbol: string; count: number }>,
        topAccounts: [] as Array<{ handle: string; count: number }>,
      };
    }

    let twitter = 0;
    let reddit = 0;
    let bullish = 0;
    let neutral = 0;
    let bearish = 0;
    let sentimentTotal = 0;
    const coinCount = new Map<string, number>();
    const accountCount = new Map<string, number>();

    for (const post of socialPosts) {
      const source = (post.source || "").toLowerCase();
      if (source === "twitter") twitter += 1;
      if (source === "reddit") reddit += 1;

      sentimentTotal += post.sentiment_compound;
      if (post.sentiment_compound > 0.2) bullish += 1;
      else if (post.sentiment_compound < -0.2) bearish += 1;
      else neutral += 1;

      const coin = (post.coin_symbol || "").toUpperCase().trim();
      if (coin) {
        coinCount.set(coin, (coinCount.get(coin) || 0) + 1);
      }

      const handle = (post.influencer_handle || post.author || "").trim();
      if (handle) {
        accountCount.set(handle, (accountCount.get(handle) || 0) + 1);
      }
    }

    const topCoins = Array.from(coinCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([symbol, count]) => ({ symbol, count }));

    const topAccounts = Array.from(accountCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([handle, count]) => ({ handle, count }));

    return {
      total: socialPosts.length,
      twitter,
      reddit,
      bullish,
      neutral,
      bearish,
      avgSentiment: sentimentTotal / socialPosts.length,
      topCoins,
      topAccounts,
    };
  }, [socialPosts]);

  const insights = useMemo(() => {
    const highQuality = reportRows.filter((row) => row.quality >= 80).length;
    const highTrust = reportRows.filter((row) => row.trust >= 80).length;
    const alphaTier = reportRows.filter((row) => row.tier === "alpha").length;
    const sentimentLabel =
      socialSummary.avgSentiment > 0.2 ? "Bullish" : socialSummary.avgSentiment < -0.2 ? "Bearish" : "Neutral";

    return [
      `${highQuality}/${reportRows.length || 1} influencers are in high-quality range (80+).`,
      `${highTrust} influencers currently hold trust score >= 80, indicating credible signal coverage.`,
      `${alphaTier} influencers are ranked in Alpha tier for highest expected market-moving impact.`,
      `Social pulse is ${sentimentLabel} with average compound sentiment ${socialSummary.avgSentiment.toFixed(2)}.`,
    ];
  }, [reportRows, socialSummary.avgSentiment]);

  const tierDistributionData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of reportRows) {
      counts.set(row.tier, (counts.get(row.tier) || 0) + 1);
    }
    return Array.from(counts.entries()).map(([tier, count]) => ({ tier: tier.toUpperCase(), count }));
  }, [reportRows]);

  const trustImpactData = useMemo(() => {
    return [...reportRows]
      .sort((a, b) => b.quality - a.quality)
      .slice(0, 8)
      .map((row) => ({ handle: row.handle, trust: row.trust, impact: row.impact, quality: row.quality }));
  }, [reportRows]);

  const sentimentTrendData = useMemo(() => {
    const buckets = new Map<string, { sentimentTotal: number; count: number }>();
    for (const post of socialPosts) {
      const date = new Date(post.created_at);
      if (Number.isNaN(date.getTime())) continue;
      const label = `${date.getMonth() + 1}/${date.getDate()}`;
      const current = buckets.get(label) || { sentimentTotal: 0, count: 0 };
      current.sentimentTotal += post.sentiment_compound;
      current.count += 1;
      buckets.set(label, current);
    }

    return Array.from(buckets.entries()).map(([day, value]) => ({
      day,
      avgSentiment: value.count > 0 ? Number((value.sentimentTotal / value.count).toFixed(2)) : 0,
    }));
  }, [socialPosts]);

  const sourceMixData = useMemo(() => {
    return [
      { source: "Twitter", count: socialSummary.twitter },
      { source: "Reddit", count: socialSummary.reddit },
    ];
  }, [socialSummary.reddit, socialSummary.twitter]);

  const coinMentionsData = useMemo(() => {
    return socialSummary.topCoins.map((coin) => ({ symbol: coin.symbol, count: coin.count }));
  }, [socialSummary.topCoins]);

  const downloadInfluencerCsv = () => {
    const headers = ["rank", "handle", "name", "category", "followers", "trust", "impact", "posts24h", "reach", "activity", "quality", "tier"];
    const rows = reportRows.map((row) =>
      [
        row.rank,
        row.handle,
        row.name,
        row.category,
        row.followers,
        row.trust,
        row.impact,
        row.posts24h,
        row.reach,
        row.activity,
        row.quality,
        row.tier,
      ]
        .map(csvEscape)
        .join(",")
    );

    const csv = [headers.map(csvEscape).join(","), ...rows].join("\n");
    downloadBlob(csv, `influence_report_${Date.now()}.csv`, "text/csv;charset=utf-8");
  };

  const downloadSocialCsv = () => {
    const headers = ["source", "post_id", "author", "context", "coin_symbol", "engagement_score", "sentiment_compound", "created_at", "text"];
    const rows = socialPosts.map((post) =>
      [
        post.source,
        post.post_id,
        post.author,
        post.context,
        post.coin_symbol,
        post.engagement_score,
        post.sentiment_compound,
        post.created_at,
        post.text,
      ]
        .map(csvEscape)
        .join(",")
    );
    const csv = [headers.map(csvEscape).join(","), ...rows].join("\n");
    downloadBlob(csv, `social_posts_${Date.now()}.csv`, "text/csv;charset=utf-8");
  };

  const downloadFullJson = () => {
    const payload = {
      generated_at: new Date().toISOString(),
      summary,
      social_summary: socialSummary,
      insights,
      influencers: reportRows,
      social_posts: socialPosts,
      charts: {
        tier_distribution: tierDistributionData,
        trust_impact: trustImpactData,
        sentiment_trend: sentimentTrendData,
        source_mix: sourceMixData,
        coin_mentions: coinMentionsData,
      },
    };
    downloadBlob(JSON.stringify(payload, null, 2), `complete_analysis_report_${Date.now()}.json`, "application/json;charset=utf-8");
  };

  return (
    <section className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card/70 to-card p-6 glow-border space-y-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Complete Influence Analysis Report</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Separate analysis section with influencer quality, trust, activity, and social sentiment intelligence</p>
        </div>
        <div className="text-[11px] text-muted-foreground">
          Last refreshed: {new Date(lastRefreshed).toLocaleString()}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={downloadInfluencerCsv}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card/60 px-3 py-1.5 text-[11px] font-semibold text-foreground hover:bg-card"
        >
          <FileSpreadsheet className="h-3.5 w-3.5 text-success" />
          Download Influencer CSV
        </button>
        <button
          onClick={downloadSocialCsv}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card/60 px-3 py-1.5 text-[11px] font-semibold text-foreground hover:bg-card"
        >
          <Download className="h-3.5 w-3.5 text-primary" />
          Download Social CSV
        </button>
        <button
          onClick={downloadFullJson}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card/60 px-3 py-1.5 text-[11px] font-semibold text-foreground hover:bg-card"
        >
          <FileJson className="h-3.5 w-3.5 text-secondary" />
          Download Full JSON Report
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border/60 bg-card/40 p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-[11px] mb-1">
            <Users className="w-3.5 h-3.5" />
            Tracked Influencers
          </div>
          <div className="text-lg font-semibold text-foreground font-mono">{summary.tracked}</div>
        </div>
        <div className="rounded-xl border border-border/60 bg-card/40 p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-[11px] mb-1">
            <BarChart3 className="w-3.5 h-3.5" />
            Total Reach
          </div>
          <div className="text-lg font-semibold text-foreground font-mono">{formatCompactNumber(summary.totalReach)}</div>
        </div>
        <div className="rounded-xl border border-border/60 bg-card/40 p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-[11px] mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            Avg Trust
          </div>
          <div className="text-lg font-semibold text-success font-mono">{summary.avgTrust}</div>
        </div>
        <div className="rounded-xl border border-border/60 bg-card/40 p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-[11px] mb-1">
            <Activity className="w-3.5 h-3.5" />
            Avg Impact
          </div>
          <div className="text-lg font-semibold text-primary font-mono">{summary.avgImpact}</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border/60 bg-card/50 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <MessageSquare className="w-3.5 h-3.5 text-primary" />
            Social Intelligence Breakdown
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg bg-muted/30 p-2">
              <div className="text-muted-foreground">Total Posts</div>
              <div className="font-mono font-semibold text-foreground">{socialSummary.total}</div>
            </div>
            <div className="rounded-lg bg-muted/30 p-2">
              <div className="text-muted-foreground">Avg Sentiment</div>
              <div className="font-mono font-semibold text-foreground">{socialSummary.avgSentiment.toFixed(2)}</div>
            </div>
            <div className="rounded-lg bg-muted/30 p-2">
              <div className="text-muted-foreground">Twitter / Reddit</div>
              <div className="font-mono font-semibold text-foreground">{socialSummary.twitter} / {socialSummary.reddit}</div>
            </div>
            <div className="rounded-lg bg-muted/30 p-2">
              <div className="text-muted-foreground">Bull / Neutral / Bear</div>
              <div className="font-mono font-semibold text-foreground">{socialSummary.bullish} / {socialSummary.neutral} / {socialSummary.bearish}</div>
            </div>
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground mb-1">Top Coin Mentions</div>
            <div className="flex flex-wrap gap-2">
              {socialSummary.topCoins.length > 0 ? socialSummary.topCoins.map((coin) => (
                <span key={coin.symbol} className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold bg-primary/15 text-primary">
                  {coin.symbol} ({coin.count})
                </span>
              )) : <span className="text-[11px] text-muted-foreground">No coin mentions yet</span>}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card/50 p-4 space-y-3">
          <div className="text-xs font-semibold text-foreground">Executive Insights</div>
          <div className="space-y-2">
            {insights.map((insight) => (
              <div key={insight} className="rounded-lg bg-muted/30 p-2 text-[11px] text-foreground/90">
                {insight}
              </div>
            ))}
          </div>
          <div>
            <div className="text-[11px] text-muted-foreground mb-1">Most Active Accounts</div>
            <div className="space-y-1">
              {socialSummary.topAccounts.length > 0 ? socialSummary.topAccounts.map((account) => (
                <div key={account.handle} className="flex items-center justify-between text-[11px]">
                  <span className="text-foreground">@{account.handle}</span>
                  <span className="font-mono text-muted-foreground">{account.count} posts</span>
                </div>
              )) : <div className="text-[11px] text-muted-foreground">No account activity yet</div>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-border/60 bg-card/50 p-4">
          <div className="text-xs font-semibold text-foreground mb-3">Tier Distribution</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={tierDistributionData} dataKey="count" nameKey="tier" outerRadius={80} label>
                {tierDistributionData.map((entry, index) => (
                  <Cell key={`tier-${entry.tier}`} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border/60 bg-card/50 p-4">
          <div className="text-xs font-semibold text-foreground mb-3">Trust vs Impact (Top Influencers)</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={trustImpactData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="handle" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="trust" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="impact" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border/60 bg-card/50 p-4 lg:col-span-2">
          <div className="text-xs font-semibold text-foreground mb-3">Sentiment Trend by Day</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={sentimentTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 10 }} />
              <YAxis domain={[-1, 1]} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="avgSentiment" stroke="hsl(var(--secondary))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border/60 bg-card/50 p-4">
          <div className="text-xs font-semibold text-foreground mb-3">Source Mix</div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={sourceMixData} dataKey="count" nameKey="source" outerRadius={70} label>
                {sourceMixData.map((entry, index) => (
                  <Cell key={`source-${entry.source}`} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card/50 p-4">
        <div className="text-xs font-semibold text-foreground mb-3">Top Coin Mentions</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={coinMentionsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="symbol" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="count" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-2 text-muted-foreground font-medium">#</th>
              <th className="text-left py-2 px-2 text-muted-foreground font-medium">Handle</th>
              <th className="text-left py-2 px-2 text-muted-foreground font-medium">Category</th>
              <th className="text-right py-2 px-2 text-muted-foreground font-medium">Followers</th>
              <th className="text-right py-2 px-2 text-muted-foreground font-medium">Trust</th>
              <th className="text-right py-2 px-2 text-muted-foreground font-medium">Impact</th>
              <th className="text-right py-2 px-2 text-muted-foreground font-medium">Posts/24h</th>
              <th className="text-right py-2 px-2 text-muted-foreground font-medium">Reach</th>
              <th className="text-right py-2 px-2 text-muted-foreground font-medium">Activity</th>
              <th className="text-right py-2 px-2 text-muted-foreground font-medium">Quality</th>
              <th className="text-right py-2 px-2 text-muted-foreground font-medium">Tier</th>
            </tr>
          </thead>
          <tbody>
            {reportRows.map((row) => (
              <tr key={row.handle} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                <td className="py-2.5 px-2 font-mono text-muted-foreground">{row.rank}</td>
                <td className="py-2.5 px-2">
                  <div className="font-semibold text-foreground">@{row.handle}</div>
                  <div className="text-[10px] text-muted-foreground">{row.name}</div>
                </td>
                <td className="py-2.5 px-2 text-muted-foreground capitalize">{row.category}</td>
                <td className="py-2.5 px-2 text-right font-mono text-foreground">{formatCompactNumber(row.followers)}</td>
                <td className="py-2.5 px-2 text-right font-mono text-success">{row.trust}</td>
                <td className="py-2.5 px-2 text-right font-mono text-primary">{row.impact}</td>
                <td className="py-2.5 px-2 text-right font-mono text-foreground">{row.posts24h}</td>
                <td className="py-2.5 px-2 text-right font-mono text-foreground">{row.reach}</td>
                <td className="py-2.5 px-2 text-right font-mono text-foreground">{row.activity}</td>
                <td className="py-2.5 px-2 text-right font-mono text-secondary">{row.quality}</td>
                <td className="py-2.5 px-2 text-right">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${tierClass[row.tier] || "bg-muted text-foreground"}`}>
                    {row.tier.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default InfluenceReport;