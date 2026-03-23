import { useState } from "react";
import { motion } from "framer-motion";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import TopBar from "@/components/dashboard/TopBar";
import InfluenceReport from "@/components/dashboard/InfluenceReport";

const Report = () => {
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
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="space-y-3"
          >
            <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
              <h1 className="text-sm font-semibold text-foreground">Complete Analysis Report</h1>
              <p className="text-xs text-muted-foreground">
                Dedicated section for influencer ranking, social sentiment intelligence, source split, and executive insights.
              </p>
            </div>
            <InfluenceReport />
          </motion.section>
        </main>
      </div>
    </div>
  );
};

export default Report;
