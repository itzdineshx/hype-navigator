import { Link } from "react-router-dom";
import { TrendingUp, TrendingDown, ChevronRight } from "lucide-react";

const coins = [
  { id: "DOGE", name: "Dogecoin", symbol: "$DOGE", price: "$0.1823", change: "+12.4%", hype: 78, trust: 87, up: true },
  { id: "PEPE", name: "Pepe", symbol: "$PEPE", price: "$0.0000124", change: "-8.2%", hype: 92, trust: 45, up: false },
  { id: "SHIB", name: "Shiba Inu", symbol: "$SHIB", price: "$0.0000281", change: "+5.1%", hype: 65, trust: 71, up: true },
  { id: "WIF", name: "dogwifhat", symbol: "$WIF", price: "$2.41", change: "+22.7%", hype: 88, trust: 52, up: true },
  { id: "BONK", name: "Bonk", symbol: "$BONK", price: "$0.0000312", change: "-15.3%", hype: 71, trust: 23, up: false },
];

const TrendingCoins = () => (
  <div className="glass rounded-2xl p-6 glow-border">
    <div className="flex items-center justify-between mb-5">
      <div>
        <h3 className="text-sm font-semibold text-foreground">🔥 Trending Coins</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Click any coin for deep-dive analytics</p>
      </div>
    </div>

    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 text-muted-foreground font-medium">Coin</th>
            <th className="text-right py-2 text-muted-foreground font-medium">Price</th>
            <th className="text-right py-2 text-muted-foreground font-medium">24h</th>
            <th className="text-right py-2 text-muted-foreground font-medium">Hype</th>
            <th className="text-right py-2 text-muted-foreground font-medium">Trust</th>
            <th className="text-right py-2 text-muted-foreground font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {coins.map((c) => (
            <tr key={c.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors group">
              <td className="py-3">
                <Link to={`/coin/${c.id}`} className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-[10px] font-bold text-foreground flex-shrink-0">
                    {c.id.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{c.name}</div>
                    <div className="text-muted-foreground">{c.symbol}</div>
                  </div>
                </Link>
              </td>
              <td className="py-3 text-right font-mono text-foreground">{c.price}</td>
              <td className="py-3 text-right">
                <span className={`inline-flex items-center gap-0.5 ${c.up ? "text-success" : "text-destructive"}`}>
                  {c.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {c.change}
                </span>
              </td>
              <td className="py-3 text-right">
                <div className="inline-flex items-center gap-1.5">
                  <div className="w-10 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${c.hype}%` }} />
                  </div>
                  <span className="text-muted-foreground">{c.hype}</span>
                </div>
              </td>
              <td className="py-3 text-right">
                <span className={c.trust > 60 ? "text-success" : c.trust > 40 ? "text-warning" : "text-destructive"}>
                  {c.trust}%
                </span>
              </td>
              <td className="py-3 text-right">
                <Link to={`/coin/${c.id}`}>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default TrendingCoins;
