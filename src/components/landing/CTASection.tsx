import { motion } from "framer-motion";
import { ArrowRight, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const CTASection = () => (
  <section className="py-32 relative overflow-hidden">
    {/* Background effects */}
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-primary/10 rounded-full blur-[150px]" />
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[300px] bg-secondary/8 rounded-full blur-[120px]" />
    </div>

    <div className="container mx-auto px-6 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="max-w-3xl mx-auto text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-8 glow-primary"
        >
          <Shield className="w-8 h-8 text-foreground" />
        </motion.div>

        <h2 className="text-3xl md:text-5xl font-bold mb-6">
          Ready to trade with{" "}
          <span className="gradient-text text-glow">intelligence?</span>
        </h2>
        <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
          Join thousands of traders who use TrustScore AI to navigate the meme coin market with confidence.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button variant="hero" size="lg" asChild className="text-base px-10 py-6 group">
            <Link to="/dashboard">
              Get Started Free
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button variant="hero-outline" size="lg" asChild className="text-base px-10 py-6">
            <a href="#features">Learn More</a>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground mt-6">No credit card required • Free tier available</p>
      </motion.div>
    </div>
  </section>
);

export default CTASection;
