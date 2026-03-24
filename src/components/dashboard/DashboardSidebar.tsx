import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, TrendingUp, Bell, History, Radio, FileText, FlaskConical, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: TrendingUp, label: "Trends", path: "/trends" },
  { icon: Bell, label: "Alerts", path: "/alerts" },
  { icon: History, label: "Replay", path: "/replay" },
  { icon: Radio, label: "Influence", path: "/influence" },
  { icon: FlaskConical, label: "Playground", path: "/playground" },
  { icon: FileText, label: "Report", path: "/report" },
];

interface Props {
  collapsed: boolean;
  onToggle: () => void;
}

const DashboardSidebar = ({ collapsed, onToggle }: Props) => {
  const location = useLocation();

  return (
    <aside
      className={cn(
        "h-screen sticky top-0 flex flex-col border-r border-border bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-border">
        <Link to="/" className="flex items-center gap-2 overflow-hidden">
          <img
            src="/hypex_logo.png"
            alt="Hypex AI logo"
            className="w-8 h-8 rounded-lg object-contain flex-shrink-0 glow-primary"
          />
          {!collapsed && (
            <span className="text-sm font-bold text-foreground whitespace-nowrap">Hypex AI</span>
          )}
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.label}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                active
                  ? "bg-primary/10 text-primary glow-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse button */}
      <button
        onClick={onToggle}
        className="h-12 flex items-center justify-center border-t border-border text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
      </button>
    </aside>
  );
};

export default DashboardSidebar;
