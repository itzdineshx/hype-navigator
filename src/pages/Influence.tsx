import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Users, Zap, TrendingUp, Eye } from "lucide-react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import TopBar from "@/components/dashboard/TopBar";
import InfluenceRadar from "@/components/dashboard/InfluenceRadar";

const topInfluencers = [
  { name: "CryptoKing", score: 94, posts: 142, reach: "2.4M", trust: 88, impact: "Very High" },
  { name: "WhaleAlert", score: 88, posts: 201, reach: "1.8M", trust: 82, impact: "High" },
  { name: "AlphaLeaks", score: 81, posts: 167, reach: "1.2M", trust: 77, impact: "High" },
  { name: "DeFiDegen", score: 76, posts: 128, reach: "780K", trust: 68, impact: "Medium" },
  { name: "DegenTrader", score: 72, posts: 89, reach: "890K", trust: 65, impact: "Medium" },
  { name: "CryptoNews", score: 71, posts: 312, reach: "3.1M", trust: 79, impact: "High" },
];

const radarData = [
  { metric: "Reach", CryptoKing: 95, WhaleAlert: 80, AlphaLeaks: 70 },
  { metric: "Trust", CryptoKing: 88, WhaleAlert: 82, AlphaLeaks: 77 },
  { metric: "Activity", CryptoKing: 70, WhaleAlert: 90, AlphaLeaks: 85 },
  { metric: "Impact", CryptoKing: 94, WhaleAlert: 88, AlphaLeaks: 81 },
  { metric: "Accuracy", CryptoKing: 82, WhaleAlert: 78, AlphaLeaks: 72 },
  { metric: "Consistency", CryptoKing: 75, WhaleAlert: 85, AlphaLeaks: 68 },
];

const activityData = [
  { hour: "00", posts: 12 }, { hour: "04", posts: 8 }, { hour: "08", posts: 34 },
  { hour: "12", posts: 56 }, { hour: "16", posts: 48 }, { hour: "20", posts: 38 },
];


const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="glass-strong rounded-lg p-3 text-xs space-y-1">
      <div className="font-semibold text-foreground">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
};

const Influence = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [timeFilter, setTimeFilter] = useState("24h");
  const [search, setSearch] = useState("");

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <TopBar search={search} onSearchChange={setSearch} timeFilter={timeFilter} onTimeFilterChange={setTimeFilter} onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Stats */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Tracked Influencers", value: "248", icon: Users, color: "text-primary" },
              { label: "Avg Impact Score", value: "72", icon: Zap, color: "text-secondary" },
              { label: "Active Networks", value: "18", icon: TrendingUp, color: "text-success" },
              { label: "Bot Accounts", value: "34", icon: Eye, color: "text-destructive" },
            ].map((s) => (
              <div key={s.label} className="metric-card group">
                <s.icon className={`w-5 h-5 ${s.color} mb-3`} />
                <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
                <span className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</span>
              </div>
            ))}
          </motion.div>

          {/* Network graph */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <InfluenceRadar />
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Radar comparison */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass rounded-2xl p-6 glow-border">
              <h3 className="text-sm font-semibold text-foreground mb-1">🎯 Influencer Comparison</h3>
              <p className="text-xs text-muted-foreground mb-5">Top 3 influencers across key metrics</p>
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="hsl(228, 12%, 20%)" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "hsl(215, 20%, 55%)" }} />
                  <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
                  <Radar name="CryptoKing" dataKey="CryptoKing" stroke="hsl(217, 91%, 60%)" fill="hsl(217, 91%, 60%)" fillOpacity={0.15} strokeWidth={2} />
                  <Radar name="WhaleAlert" dataKey="WhaleAlert" stroke="hsl(270, 70%, 60%)" fill="hsl(270, 70%, 60%)" fillOpacity={0.1} strokeWidth={2} />
                  <Radar name="AlphaLeaks" dataKey="AlphaLeaks" stroke="hsl(142, 71%, 45%)" fill="hsl(142, 71%, 45%)" fillOpacity={0.1} strokeWidth={2} />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-2">
                {[{ name: "CryptoKing", color: "bg-primary" }, { name: "WhaleAlert", color: "bg-secondary" }, { name: "AlphaLeaks", color: "bg-success" }].map((l) => (
                  <div key={l.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className={`w-2 h-2 rounded-full ${l.color}`} />{l.name}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Activity heatmap */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass rounded-2xl p-6 glow-border-secondary">
              <h3 className="text-sm font-semibold text-foreground mb-1">🕐 Activity Timeline</h3>
              <p className="text-xs text-muted-foreground mb-5">Influencer posting activity by hour</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(228, 12%, 16%)" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "hsl(215, 20%, 55%)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(215, 20%, 55%)" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="posts" name="Posts" fill="hsl(270, 70%, 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Leaderboard */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-2xl p-6 glow-border">
            <h3 className="text-sm font-semibold text-foreground mb-1">🏆 Influencer Leaderboard</h3>
            <p className="text-xs text-muted-foreground mb-5">Ranked by impact score</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">#</th>
                    <th className="text-left py-3 px-2 text-muted-foreground font-medium">Influencer</th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">Score</th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">Posts</th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">Reach</th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">Trust</th>
                    <th className="text-right py-3 px-2 text-muted-foreground font-medium">Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {topInfluencers.map((inf, i) => (
                    <tr key={inf.name} className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer">
                      <td className="py-3 px-2 font-mono text-muted-foreground">{i + 1}</td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-[10px] font-bold text-foreground">{inf.name[0]}</div>
                          <span className="font-semibold text-foreground">@{inf.name}</span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-2 font-mono text-primary">{inf.score}</td>
                      <td className="text-right py-3 px-2 font-mono text-foreground">{inf.posts}</td>
                      <td className="text-right py-3 px-2 font-mono text-foreground">{inf.reach}</td>
                      <td className="text-right py-3 px-2">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-success" style={{ width: `${inf.trust}%` }} />
                          </div>
                          <span className="font-mono text-foreground w-5 text-right">{inf.trust}</span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          inf.impact === 'Very High' ? 'bg-primary/10 text-primary' : inf.impact === 'High' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                        }`}>{inf.impact}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Influence;
