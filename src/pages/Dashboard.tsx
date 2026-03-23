import { useState } from "react";
import { motion } from "framer-motion";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import TopBar from "@/components/dashboard/TopBar";
import MetricCards from "@/components/dashboard/MetricCards";
import TrendChart from "@/components/dashboard/TrendChart";
import HypeReplay from "@/components/dashboard/HypeReplay";
import InfluenceRadar from "@/components/dashboard/InfluenceRadar";
import AlertPanel from "@/components/dashboard/AlertPanel";
import TrendingCoins from "@/components/dashboard/TrendingCoins";
import MarketVisuals from "@/components/dashboard/MarketVisuals";

const Dashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [timeFilter, setTimeFilter] = useState("24h");
  const [search, setSearch] = useState("");

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <TopBar
          search={search}
          onSearchChange={setSearch}
          timeFilter={timeFilter}
          onTimeFilterChange={setTimeFilter}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        
        <main className="flex-1 overflow-y-auto p-6 space-y-6 gradient-bg-subtle">

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="rounded-2xl border border-border/70 bg-card/40 p-5 md:p-6"
          >
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-primary/80 mb-2">Hype Navigator Control Room</p>
                <h1 className="text-2xl md:text-3xl font-extrabold gradient-text">Market Pulse Dashboard</h1>
                <p className="text-sm text-muted-foreground mt-2 max-w-3xl">
                  Unified command center for hype momentum, trust quality, social intensity, and anomaly detection.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-[11px] min-w-[260px]">
                <div className="rounded-lg border border-border/60 bg-card/55 py-2 px-2">
                  <div className="text-muted-foreground">Tracking</div>
                  <div className="font-semibold text-foreground">24h Cycle</div>
                </div>
                <div className="rounded-lg border border-border/60 bg-card/55 py-2 px-2">
                  <div className="text-muted-foreground">Model</div>
                  <div className="font-semibold text-success">Live</div>
                </div>
                <div className="rounded-lg border border-border/60 bg-card/55 py-2 px-2">
                  <div className="text-muted-foreground">Signals</div>
                  <div className="font-semibold text-primary">Realtime</div>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <MetricCards />
          </motion.div>

          <div className="grid xl:grid-cols-[1.7fr_1fr] gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <TrendChart />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
              <AlertPanel />
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <MarketVisuals />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <TrendingCoins />
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <HypeReplay />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <InfluenceRadar />
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
