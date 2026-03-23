import { Zap } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-border py-16 relative">
    <div className="container mx-auto px-6">
      <div className="grid md:grid-cols-4 gap-10 mb-12">
        {/* Brand */}
        <div className="md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-foreground" />
            </div>
            <span className="text-sm font-bold text-foreground">Hypex AI</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            AI-powered crypto intelligence for smarter trading decisions.
          </p>
        </div>

        {/* Product */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-4">Product</h4>
          <ul className="space-y-2.5">
            {["Dashboard", "Trends", "Alerts", "Replay"].map((item) => (
              <li key={item}>
                <Link to={`/${item.toLowerCase()}`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-4">Company</h4>
          <ul className="space-y-2.5">
            {["About", "Blog", "Careers", "Contact"].map((item) => (
              <li key={item}>
                <a href={`#${item.toLowerCase()}`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-4">Legal</h4>
          <ul className="space-y-2.5">
            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((item) => (
              <li key={item}>
                <a href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">© 2026 Hypex AI. All rights reserved.</p>
        <div className="flex items-center gap-6">
          {["Twitter", "Discord", "GitHub"].map((s) => (
            <a key={s} href="#" className="text-xs text-muted-foreground hover:text-foreground transition-colors">{s}</a>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
