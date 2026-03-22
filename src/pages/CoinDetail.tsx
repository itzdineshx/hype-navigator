import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, TrendingDown, Activity, ShieldCheck, AlertTriangle, Zap, ExternalLink, Users, MessageSquare, BarChart3, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

const coinData: Record<string, any> = {
  DOGE: { name: "Dogecoin", symbol: "$DOGE", hype: 78, trust: 87, risk: "Medium", prediction: "Up", confidence: 73, change: "+12.4%", price: "$0.1823", volume: "$2.4B", marketCap: "$24.1B", sentiment: 72 },
  PEPE: { name: "Pepe", symbol: "$PEPE", hype: 92, trust: 45, risk: "High", prediction: "Down", confidence: 61, change: "-8.2%", price: "$0.0000124", volume: "$890M", marketCap: "$5.2B", sentiment: 38 },
  SHIB: { name: "Shiba Inu", symbol: "$SHIB", hype: 65, trust: 71, risk: "Low", prediction: "Up", confidence: 68, change: "+5.1%", price: "$0.0000281", volume: "$1.1B", marketCap: "$16.5B", sentiment: 65 },
  WIF: { name: "dogwifhat", symbol: "$WIF", hype: 88, trust: 52, risk: "Medium", prediction: "Up", confidence: 55, change: "+22.7%", price: "$2.41", volume: "$540M", marketCap: "$2.4B", sentiment: 58 },
  BONK: { name: "Bonk", symbol: "$BONK", hype: 71, trust: 23, risk: "Critical", prediction: "Down", confidence: 82, change: "-15.3%", price: "$0.0000312", volume: "$320M", marketCap: "$2.1B", sentiment: 25 },
};

const priceHistory = [
  { time: "Mon", price: 0.152, mentions: 320 }, { time: "Tue", price: 0.158, mentions: 410 },
  { time: "Wed", price: 0.171, mentions: 580 }, { time: "Thu", price: 0.165, mentions: 720 },
  { time: "Fri", price: 0.179, mentions: 890 }, { time: "Sat", price: 0.185, mentions: 650 },
  { time: "Sun", price: 0.182, mentions: 540 },
];

const sentimentBreakdown = [
  { name: "Bullish", value: 45, color: "hsl(142, 71%, 45%)" },
  { name: "Neutral", value: 30, color: "hsl(215, 20%, 55%)" },
  { name: "Bearish", value: 25, color: "hsl(0, 72%, 51%)" },
];

const socialVolume = [
  { platform: "Twitter", volume: 4200 }, { platform: "Reddit", volume: 2800 },
  { platform: "Telegram", volume: 1900 }, { platform: "Discord", volume: 1400 },
  { platform: "YouTube", volume: 620 },
];

const topInfluencers = [
  { name: "CryptoKing", followers: "2.4M", sentiment: "Bullish", impact: 94, posts: 12 },
  { name: "WhaleAlert", followers: "1.8M", sentiment: "Neutral", impact: 88, posts: 8 },
  { name: "AlphaLeaks", followers: "890K", sentiment: "Bullish", impact: 81, posts: 15 },
  { name: "DegenTrader", followers: "650K", sentiment: "Bearish", impact: 72, posts: 6 },
  { name: "MemeHunter", followers: "420K", sentiment: "Bullish", impact: 65, posts: 9 },
];

const recentAlerts = [
  { type: "warning", title: "Volume spike detected", time: "12 min ago", detail: "Social mentions surged 180% in the last hour" },
  { type: "info", title: "Whale accumulation", time: "1h ago", detail: "3 whale wallets added positions in the last 4 hours" },
  { type: "danger", title: "Bot activity flagged", time: "3h ago", detail: "22% of recent mentions traced to coordinated bot networks" },
  { type: "info", title: "Trending on Twitter", time: "5h ago", detail: "Entered top 10 crypto trending topics globally" },
];

const alertColors: Record<string, string> = {
  danger: "border-destructive/30 bg-destructive/5 text-destructive",
  warning: "border-warning/30 bg-warning/5 text-warning",
  info: "border-primary/30 bg-primary/5 text-primary",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="glass-strong rounded-lg p-3 text-xs space-y-1">
      <div className="font-semibold text-foreground">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="text-muted-foreground">{p.name}: {typeof p.value === 'number' && p.value < 1 ? `$${p.value}` : p.value?.toLocaleString()}</div>
      ))}
    </div>
  );
};

const ScoreRing = ({ value, size = 80, strokeWidth = 6, color }: { value: number; size?: number; strokeWidth?: number; color: string }) => {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000" />
    </svg>
  );
};

const CoinDetail = () => {
  const { coinId } = useParams();
  const coin = coinData[coinId?.toUpperCase() || "DOGE"] || coinData.DOGE;
  const isUp = coin.prediction === "Up";
  const riskColors: Record<string, string> = { Low: "text-success", Medium: "text-warning", High: "text-destructive", Critical: "text-destructive" };

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="h-14 border-b border-border glass-strong flex items-center px-6 gap-4 sticky top-0 z-30">
        <Link to="/dashboard">
          <Button variant="ghost" size="icon" className="w-8 h-8"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center glow-primary">
            <span className="text-xs font-bold text-foreground">{coinId?.charAt(0)}</span>
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground">{coin.name} <span className="text-muted-foreground font-normal">{coin.symbol}</span></h1>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-mono text-foreground">{coin.price}</span>
              <span className={isUp ? "text-success" : "text-destructive"}>{coin.change}</span>
            </div>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-xs gap-1"><ExternalLink className="w-3 h-3" />CoinGecko</Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Score cards row */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Hype Score", value: coin.hype, icon: Activity, color: "hsl(var(--primary))" },
            { label: "Trust Score", value: coin.trust, icon: ShieldCheck, color: coin.trust > 60 ? "hsl(var(--success))" : "hsl(var(--destructive))" },
            { label: "Risk Level", value: coin.risk === "Low" ? 25 : coin.risk === "Medium" ? 55 : coin.risk === "High" ? 75 : 90, icon: AlertTriangle, color: coin.risk === "Low" ? "hsl(var(--success))" : coin.risk === "Medium" ? "hsl(var(--warning))" : "hsl(var(--destructive))" },
            { label: "Prediction", value: coin.confidence, icon: isUp ? TrendingUp : TrendingDown, color: isUp ? "hsl(var(--success))" : "hsl(var(--destructive))" },
          ].map((m) => (
            <div key={m.label} className="metric-card flex items-center gap-4">
              <div className="relative">
                <ScoreRing value={m.value} size={64} strokeWidth={5} color={m.color} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <m.icon className="w-4 h-4" style={{ color: m.color }} />
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{m.label}</div>
                <div className="text-xl font-bold font-mono" style={{ color: m.color }}>
                  {m.label === "Risk Level" ? coin.risk : m.label === "Prediction" ? `${isUp ? "↑" : "↓"} ${coin.confidence}%` : `${m.value}`}
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Price + Mentions chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-2xl p-6 glow-border">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Price & Social Correlation</h3>
              <p className="text-xs text-muted-foreground mt-0.5">7-day price action vs social mentions</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" />Price</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-secondary" />Mentions</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={priceHistory}>
              <defs>
                <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="mentionsGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(270, 70%, 60%)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="hsl(270, 70%, 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(228, 12%, 16%)" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: "hsl(215, 20%, 55%)" }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="price" tick={{ fontSize: 11, fill: "hsl(215, 20%, 55%)" }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="mentions" orientation="right" tick={{ fontSize: 11, fill: "hsl(215, 20%, 55%)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area yAxisId="price" type="monotone" dataKey="price" stroke="hsl(217, 91%, 60%)" fill="url(#priceGrad)" strokeWidth={2} name="Price" />
              <Area yAxisId="mentions" type="monotone" dataKey="mentions" stroke="hsl(270, 70%, 60%)" fill="url(#mentionsGrad2)" strokeWidth={2} name="Mentions" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sentiment pie */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-6 glow-border">
            <h3 className="text-sm font-semibold text-foreground mb-1">Sentiment Breakdown</h3>
            <p className="text-xs text-muted-foreground mb-4">Community mood analysis</p>
            <div className="flex items-center justify-center">
              <PieChart width={180} height={180}>
                <Pie data={sentimentBreakdown} cx={90} cy={90} innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                  {sentimentBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
                </Pie>
              </PieChart>
            </div>
            <div className="flex justify-center gap-4 mt-3">
              {sentimentBreakdown.map((s) => (
                <div key={s.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                  <span className="text-muted-foreground">{s.name} {s.value}%</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Social volume bars */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass rounded-2xl p-6 glow-border">
            <h3 className="text-sm font-semibold text-foreground mb-1">Social Volume</h3>
            <p className="text-xs text-muted-foreground mb-4">Mentions by platform (24h)</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={socialVolume} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(215, 20%, 55%)" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="platform" tick={{ fontSize: 11, fill: "hsl(215, 20%, 55%)" }} axisLine={false} tickLine={false} width={70} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="volume" fill="hsl(217, 91%, 60%)" radius={[0, 4, 4, 0]} barSize={16} name="Mentions" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Key stats */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-2xl p-6 glow-border">
            <h3 className="text-sm font-semibold text-foreground mb-1">Key Stats</h3>
            <p className="text-xs text-muted-foreground mb-4">Market overview</p>
            <div className="space-y-4">
              {[
                { label: "Market Cap", value: coin.marketCap, icon: BarChart3 },
                { label: "24h Volume", value: coin.volume, icon: Activity },
                { label: "Sentiment Score", value: `${coin.sentiment}/100`, icon: MessageSquare },
                { label: "Active Influencers", value: "23", icon: Users },
                { label: "Avg Post Frequency", value: "4.2/hr", icon: Clock },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <s.icon className="w-3.5 h-3.5" />{s.label}
                  </div>
                  <span className="text-xs font-mono font-semibold text-foreground">{s.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Influencers table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass rounded-2xl p-6 glow-border">
          <h3 className="text-sm font-semibold text-foreground mb-1">Top Influencers</h3>
          <p className="text-xs text-muted-foreground mb-4">Key opinion leaders discussing {coin.symbol}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium">Influencer</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Followers</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Sentiment</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Impact</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Posts (7d)</th>
                </tr>
              </thead>
              <tbody>
                {topInfluencers.map((inf) => (
                  <tr key={inf.name} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="py-3 font-semibold text-foreground">@{inf.name}</td>
                    <td className="py-3 text-muted-foreground">{inf.followers}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        inf.sentiment === "Bullish" ? "bg-success/10 text-success" :
                        inf.sentiment === "Bearish" ? "bg-destructive/10 text-destructive" :
                        "bg-muted text-muted-foreground"
                      }`}>{inf.sentiment}</span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full gradient-primary" style={{ width: `${inf.impact}%` }} />
                        </div>
                        <span className="text-muted-foreground">{inf.impact}</span>
                      </div>
                    </td>
                    <td className="py-3 text-right font-mono text-muted-foreground">{inf.posts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Recent alerts */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass rounded-2xl p-6 glow-border">
          <h3 className="text-sm font-semibold text-foreground mb-1">🚨 Recent Alerts</h3>
          <p className="text-xs text-muted-foreground mb-4">Activity signals for {coin.symbol}</p>
          <div className="space-y-3">
            {recentAlerts.map((a, i) => (
              <div key={i} className={`p-3 rounded-xl border ${alertColors[a.type]} transition-all hover:scale-[1.01]`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold">{a.title}</span>
                  <span className="text-[10px] text-muted-foreground">{a.time}</span>
                </div>
                <p className="text-xs text-muted-foreground">{a.detail}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default CoinDetail;
