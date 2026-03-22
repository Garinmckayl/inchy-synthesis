"use client";

import { AnimatePresence, motion } from "framer-motion";
import { TextShimmer } from "@/components/core/text-shimmer";
import { SparklesIcon, ShieldCheckIcon, TrendingUpIcon, BrainIcon, RocketIcon, ChartBarIcon } from "lucide-react";
import { Navbar } from "@/components/navbar";

const features = [
  {
    title: "AI-Powered Portfolio Analysis",
    description: "Advanced machine learning algorithms analyze crypto portfolios in real-time, providing institutional-grade insights and risk assessment.",
    icon: ChartBarIcon,
  },
  {
    title: "Predictive Market Intelligence",
    description: "Harness the power of our proprietary AI models to forecast market trends and identify opportunities before they emerge.",
    icon: TrendingUpIcon,
  },
  {
    title: "Enterprise-Grade Security",
    description: "Bank-level encryption and security protocols ensure your data and assets are protected at all times.",
    icon: ShieldCheckIcon,
  },
  {
    title: "Custom AI Solutions",
    description: "Tailored AI models and solutions designed specifically for your organization's unique needs and objectives.",
    icon: BrainIcon,
  },
  {
    title: "Automated Trading Strategies",
    description: "Deploy sophisticated trading algorithms powered by our advanced AI technology for optimal performance.",
    icon: RocketIcon,
  },
  {
    title: "Smart Risk Management",
    description: "Real-time monitoring and AI-driven risk assessment to protect your investments and ensure compliance.",
    icon: SparklesIcon,
  },
];

export default function EnterprisePage() {
  return (
    <>
    <Navbar/>
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80">
      <div className="container px-4 py-24 mx-auto">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <TextShimmer>Enterprise Solutions</TextShimmer>
            <h2 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl text-foreground/90">
              Transform Your Crypto Operations with AI
            </h2>
            <p className="mt-6 text-xl leading-8 text-muted-foreground">
              Empower your organization with state-of-the-art AI technology designed for the future of finance.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 gap-8 mt-16 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative p-8 bg-card rounded-3xl border border-border/40 backdrop-blur-xl hover:bg-accent/5 transition-colors"
            >
              <div className="absolute -inset-px bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl opacity-0 hover:opacity-100 transition-opacity" />
              <div className="relative">
                <feature.icon className="w-8 h-8 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-4 text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-20 text-center"
        >
          <a
            href="mailto:enterprise@inchy.ai"
            className="inline-flex items-center px-6 py-3 text-lg font-semibold text-white bg-primary rounded-full hover:bg-primary/90 transition-colors"
          >
            Contact Enterprise Sales
            <RocketIcon className="ml-2 w-5 h-5" />
          </a>
        </motion.div>
      </div>
    </div>
    </>
  );
}
