import { motion } from "framer-motion";
import { TrendingUp, ShieldCheck, AlertTriangle, ArrowUpRight } from "lucide-react";

const features = [
  {
    icon: TrendingUp,
    title: "Trend Detection",
    description: "Identify emerging meme coin trends from social signals before the crowd catches on.",
    stat: "2.4s",
    statLabel: "Avg detection time",
  },
  {
    icon: ShieldCheck,
    title: "Trust Score",
    description: "Evaluate the reliability of hype using AI-driven scoring across multiple data sources.",
    stat: "97.3%",
    statLabel: "Accuracy rate",
  },
  {
    icon: AlertTriangle,
    title: "Risk Alerts",
    description: "Detect pump-and-dump patterns and market manipulation in real time.",
    stat: "< 30s",
    statLabel: "Alert latency",
  },
];

const Features = () => (
  <section id="features" className="py-32 relative">
    {/* Subtle background gradient */}
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent pointer-events-none" />

    <div className="container mx-auto px-6 relative z-10">
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
          className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-4"
        >
          Core Intelligence
        </motion.span>
        <h2 className="text-3xl md:text-5xl font-bold mb-5">
          Intelligence at <span className="gradient-text">Every Layer</span>
        </h2>
        <p className="text-muted-foreground max-w-lg mx-auto text-base">
          Three pillars of crypto intelligence, powered by cutting-edge AI.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            whileHover={{ y: -8, transition: { duration: 0.3 } }}
            className="glass rounded-2xl p-8 group hover:glow-border transition-all duration-500 relative overflow-hidden cursor-default"
          >
            {/* Hover glow */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center group-hover:scale-110 transition-transform duration-300 glow-primary">
                  <f.icon className="w-6 h-6 text-foreground" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
              </div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">{f.description}</p>

              {/* Stat badge */}
              <div className="pt-4 border-t border-border">
                <span className="text-xl font-bold font-mono gradient-text">{f.stat}</span>
                <span className="text-xs text-muted-foreground ml-2">{f.statLabel}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Features;
