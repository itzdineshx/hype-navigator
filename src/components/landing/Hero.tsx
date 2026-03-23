import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";

const AnimatedCounter = ({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => {
    if (target >= 1000) return `${(v / 1000).toFixed(1)}K`;
    if (target < 1) return `${(v * 100).toFixed(0)}%`;
    return Math.round(v).toString();
  });
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(count, target, { duration: 2, ease: "easeOut" });
    return controls.stop;
  }, [target, count]);

  useEffect(() => {
    const unsubscribe = rounded.on("change", (v) => {
      if (ref.current) ref.current.textContent = `${prefix}${v}${suffix}`;
    });
    return unsubscribe;
  }, [rounded, prefix, suffix]);

  return <span ref={ref}>{prefix}0{suffix}</span>;
};

const FloatingOrb = ({ delay, x, y, size, color }: { delay: number; x: string; y: string; size: string; color: string }) => (
  <motion.div
    className={`absolute rounded-full blur-[120px] ${color}`}
    style={{ left: x, top: y, width: size, height: size }}
    animate={{
      scale: [1, 1.2, 1],
      opacity: [0.3, 0.6, 0.3],
    }}
    transition={{ duration: 4, delay, repeat: Infinity, ease: "easeInOut" }}
  />
);

const ParticleGrid = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <FloatingOrb delay={0} x="15%" y="20%" size="600px" color="bg-primary/8" />
    <FloatingOrb delay={1.5} x="65%" y="10%" size="500px" color="bg-secondary/6" />
    <FloatingOrb delay={3} x="40%" y="60%" size="400px" color="bg-primary/5" />
    {/* Grid lines */}
    <div className="absolute inset-0 opacity-[0.03]" style={{
      backgroundImage: `linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)`,
      backgroundSize: "60px 60px",
    }} />
    {/* Floating dots */}
    {Array.from({ length: 20 }).map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 rounded-full bg-primary/30"
        style={{
          left: `${10 + Math.random() * 80}%`,
          top: `${10 + Math.random() * 80}%`,
        }}
        animate={{
          y: [0, -20, 0],
          opacity: [0.2, 0.8, 0.2],
        }}
        transition={{
          duration: 3 + Math.random() * 3,
          delay: Math.random() * 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    ))}
  </div>
);

const Hero = () => (
  <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
    <ParticleGrid />
    <div className="container mx-auto px-6 pt-20 relative z-10">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 glass rounded-full px-5 py-2 mb-8 text-xs font-medium text-muted-foreground border border-primary/20">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Live • Analyzing 12,847 tokens in real-time
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.02] mb-6"
        >
          Don't Follow
          <br />
          Crypto Hype.{" "}
          <span className="gradient-text text-glow">Understand It.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed"
        >
          AI-powered platform to detect trends, identify manipulation, and analyze meme coin markets in real time.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button variant="hero" size="lg" asChild className="text-base px-8 py-6 group">
            <Link to="/dashboard">
              Explore Dashboard
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button variant="hero-outline" size="lg" asChild className="text-base px-8 py-6 group">
            <Link to="/dashboard">
              <Play className="w-4 h-4 mr-1 group-hover:scale-110 transition-transform" />
              View Live Trends
            </Link>
          </Button>
        </motion.div>

        {/* Animated metric preview */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="mt-20 grid grid-cols-3 gap-4 max-w-xl mx-auto"
        >
          {[
            { label: "Trust Score", value: 87, suffix: "%", color: "text-success" },
            { label: "Tokens Tracked", value: 12800, suffix: "", color: "text-primary" },
            { label: "Alerts Today", value: 24, suffix: "", color: "text-warning" },
          ].map((m, i) => (
            <motion.div
              key={m.label}
              className="glass rounded-xl p-4 text-center glow-border group hover:scale-105 transition-transform duration-300 cursor-default"
              whileHover={{ y: -4 }}
            >
              <div className={`text-2xl md:text-3xl font-bold font-mono ${m.color}`}>
                <AnimatedCounter target={m.value} suffix={m.suffix} />
              </div>
              <div className="text-xs text-muted-foreground mt-1">{m.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-16 flex justify-center"
        >
          <motion.div
            className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-1.5"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              className="w-1.5 h-1.5 rounded-full bg-primary"
              animate={{ y: [0, 16, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>
      </div>
    </div>
  </section>
);

export default Hero;
