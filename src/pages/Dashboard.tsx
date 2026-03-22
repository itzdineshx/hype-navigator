import { useState } from "react";
import { motion } from "framer-motion";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import TopBar from "@/components/dashboard/TopBar";
import MetricCards from "@/components/dashboard/MetricCards";
import TrendChart from "@/components/dashboard/TrendChart";
import HypeReplay from "@/components/dashboard/HypeReplay";
import InfluenceRadar from "@/components/dashboard/InfluenceRadar";
import AlertPanel from "@/components/dashboard/AlertPanel";

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
        
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}>
            <MetricCards />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <TrendChart />
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <HypeReplay />
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <InfluenceRadar />
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <AlertPanel />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
