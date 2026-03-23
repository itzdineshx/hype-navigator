import { motion } from "framer-motion";
import { Play, Pause, SkipBack, Zap, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const HypeReplayPreview = () => {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const dataPoints = [20, 25, 22, 30, 45, 80, 95, 72, 55, 40, 35, 50, 68, 85, 60];

  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) { setPlaying(false); return 100; }
        return p + 2;
      });
    }, 80);
    return () => clearInterval(interval);
  }, [playing]);

  return (
    <div className="glass rounded-2xl p-6 glow-border relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-foreground">$PEPE Hype Timeline</h4>
          <span className="text-xs font-mono text-muted-foreground glass rounded-full px-2 py-0.5">Jan 15 – Feb 12, 2026</span>
        </div>
        {/* Chart area */}
        <div className="h-36 flex items-end gap-1.5 mb-5">
          {dataPoints.map((h, i) => {
            const active = i <= Math.floor((progress / 100) * dataPoints.length);
            return (
              <motion.div
                key={i}
                className="flex-1 rounded-t-md relative group cursor-pointer"
                style={{
                  background: active
                    ? `linear-gradient(to top, hsl(var(--primary)), hsl(var(--secondary)))`
                    : "hsl(var(--muted))",
                  opacity: active ? 1 : 0.2,
                }}
                initial={{ height: 0 }}
                whileInView={{ height: `${h}%` }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04, duration: 0.4 }}
                whileHover={{ opacity: 1, scale: 1.1 }}
              >
                {/* Tooltip */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity glass rounded-md px-2 py-1 whitespace-nowrap z-20">
                  <span className="text-[10px] font-mono text-foreground">{h}%</span>
                </div>
              </motion.div>
            );
          })}
        </div>
        {/* Controls */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="w-8 h-8 hover:text-primary" onClick={() => { setProgress(0); setPlaying(false); }}>
            <SkipBack className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="w-8 h-8 hover:text-primary" onClick={() => setPlaying(!playing)}>
            {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </Button>
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div className="h-full gradient-primary rounded-full" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-xs font-mono text-muted-foreground w-8 text-right">{progress}%</span>
        </div>
      </div>
    </div>
  );
};

const InfluenceRadarPreview = () => {
  const nodes = [
    { x: 50, y: 50, size: 32, label: "CryptoKing", score: 94 },
    { x: 22, y: 28, size: 20, label: "DegenTrader", score: 72 },
    { x: 78, y: 22, size: 24, label: "WhaleAlert", score: 88 },
    { x: 28, y: 78, size: 16, label: "MemeHunter", score: 65 },
    { x: 80, y: 72, size: 22, label: "AlphaLeaks", score: 81 },
    { x: 52, y: 18, size: 14, label: "ShibArmy", score: 45 },
    { x: 18, y: 55, size: 16, label: "NFTGuru", score: 58 },
  ];

  return (
    <div className="glass rounded-2xl p-6 glow-border-secondary relative overflow-hidden">
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-secondary/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="relative z-10">
        <h4 className="text-sm font-semibold text-foreground mb-4">Influence Network</h4>
        <div className="relative h-64">
          {/* Pulsing rings */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            {[80, 140, 200].map((s, i) => (
              <motion.div
                key={s}
                className="absolute rounded-full border border-secondary/10"
                style={{ width: s, height: s, left: -s / 2, top: -s / 2 }}
                animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 3, delay: i * 0.5, repeat: Infinity }}
              />
            ))}
          </div>

          {/* Connection lines */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {nodes.slice(1).map((n, i) => (
              <motion.line
                key={i}
                x1={nodes[0].x} y1={nodes[0].y}
                x2={n.x} y2={n.y}
                stroke="hsl(var(--secondary))"
                strokeWidth="0.3"
                initial={{ strokeOpacity: 0 }}
                whileInView={{ strokeOpacity: 0.4 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 + 0.5 }}
              />
            ))}
          </svg>

          {/* Nodes */}
          {nodes.map((n, i) => (
            <motion.div
              key={n.label}
              className="absolute group cursor-pointer"
              style={{ left: `${n.x}%`, top: `${n.y}%`, transform: "translate(-50%, -50%)" }}
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, type: "spring" }}
              whileHover={{ scale: 1.3 }}
            >
              <div
                className="rounded-full flex items-center justify-center gradient-primary text-[9px] font-bold text-foreground shadow-lg"
                style={{ width: n.size, height: n.size, boxShadow: `0 0 ${n.size / 2}px hsla(var(--primary) / 0.3)` }}
              >
                {n.score}
              </div>
              <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity glass rounded-lg px-3 py-2 whitespace-nowrap z-10 shadow-xl">
                <div className="text-[11px] font-semibold text-foreground">@{n.label}</div>
                <div className="text-[10px] text-muted-foreground">Impact: {n.score}/100</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

const WowFeatures = () => (
  <section id="wow" className="py-32 relative gradient-bg-subtle">
    <div className="container mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-20"
      >
        <motion.span
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-secondary mb-4"
        >
          Breakthrough Tools
        </motion.span>
        <h2 className="text-3xl md:text-5xl font-bold mb-5">
          <span className="gradient-text">Wow</span> Features
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto text-base">
          Groundbreaking tools that redefine crypto intelligence.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-10 max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-5 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0 glow-primary">
              <Zap className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground mb-1">Hype Replay</h3>
              <p className="text-sm text-muted-foreground">Travel back in time and replay how hype evolved around any token.</p>
            </div>
          </div>
          <HypeReplayPreview />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-5 flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center flex-shrink-0 glow-secondary">
              <Users className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground mb-1">Influence Radar</h3>
              <p className="text-sm text-muted-foreground">Map the network of influencers driving meme coin hype.</p>
            </div>
          </div>
          <InfluenceRadarPreview />
        </motion.div>
      </div>
    </div>
  </section>
);

export default WowFeatures;
