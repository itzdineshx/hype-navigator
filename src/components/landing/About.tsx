import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  { name: "Alex K.", role: "DeFi Researcher", text: "TrustScore AI spotted a rug pull 3 hours before it happened. Saved my portfolio." },
  { name: "Sarah M.", role: "Crypto Fund Manager", text: "The influence radar alone is worth the subscription. No other tool maps hype this well." },
  { name: "James W.", role: "Independent Trader", text: "Finally a platform that cuts through the noise. The trust scores are incredibly accurate." },
];

const About = () => (
  <section id="about" className="py-32 relative">
    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/[0.02] to-transparent pointer-events-none" />

    <div className="container mx-auto px-6 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-2xl mx-auto text-center mb-20"
      >
        <motion.span
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="inline-block text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-4"
        >
          Our Mission
        </motion.span>
        <h2 className="text-3xl md:text-5xl font-bold mb-6">
          About <span className="gradient-text">TrustScore AI</span>
        </h2>
        <p className="text-lg text-muted-foreground leading-relaxed mb-12">
          We transform social media noise into actionable crypto intelligence. Our AI analyzes millions of posts, tracks influencer networks, and delivers trust scores — so you can invest with clarity, not chaos.
        </p>

        {/* Stats */}
        <div className="flex items-center justify-center gap-12 text-sm text-muted-foreground">
          {[
            { val: "50M+", label: "Posts analyzed" },
            { val: "12K+", label: "Tokens tracked" },
            { val: "99.2%", label: "Uptime" },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="text-3xl font-bold gradient-text font-mono">{s.val}</div>
              <div className="mt-1 text-xs">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Testimonials */}
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {testimonials.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            className="glass rounded-2xl p-6 glow-border relative"
          >
            <Quote className="w-8 h-8 text-primary/20 mb-3" />
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">{t.text}</p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-xs font-bold text-foreground">
                {t.name[0]}
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default About;
