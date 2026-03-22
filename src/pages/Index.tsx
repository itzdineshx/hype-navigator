import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import WowFeatures from "@/components/landing/WowFeatures";
import About from "@/components/landing/About";
import Footer from "@/components/landing/Footer";

const Index = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <Hero />
    <Features />
    <WowFeatures />
    <About />
    <Footer />
  </div>
);

export default Index;
