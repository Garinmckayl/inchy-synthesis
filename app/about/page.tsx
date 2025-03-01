"use client";

import { AnimatePresence, motion } from "framer-motion";
import { TextShimmer } from "@/components/core/text-shimmer";
import { BrainIcon, SparklesIcon, ShieldCheckIcon, UsersIcon } from "lucide-react";
import { Navbar } from "@/components/navbar";


const stats = [
  { label: "Active Users", value: "50K+" },
  { label: "Daily Transactions", value: "$100M+" },
  { label: "AI Predictions", value: "99.9%" },
  { label: "Security Rating", value: "A+" },
];

const values = [
  {
    title: "AI-First Approach",
    description: "We leverage cutting-edge artificial intelligence to revolutionize crypto investment strategies.",
    icon: BrainIcon,
  },
  {
    title: "Innovation",
    description: "Continuously pushing boundaries with state-of-the-art technology and novel solutions.",
    icon: SparklesIcon,
  },
  {
    title: "Security",
    description: "Unwavering commitment to protecting our users' assets and data with military-grade security.",
    icon: ShieldCheckIcon,
  },
  {
    title: "Community",
    description: "Building a thriving ecosystem of informed and successful crypto investors.",
    icon: UsersIcon,
  },
];

export default function AboutPage() {
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
            <TextShimmer>About Inchy.ai</TextShimmer>
            <h2 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl text-foreground/90">
              Revolutionizing Crypto Investment with AI
            </h2>
            <p className="mt-6 text-xl leading-8 text-muted-foreground max-w-3xl mx-auto">
              Inchy.ai is at the forefront of combining artificial intelligence with cryptocurrency investment. 
              Our mission is to democratize access to sophisticated AI-powered trading strategies while ensuring 
              security and transparency.
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-2 gap-8 sm:grid-cols-4 mt-16"
        >
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className="bg-card rounded-3xl p-8 text-center border border-border/40 backdrop-blur-xl"
            >
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div className="text-3xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </motion.div>
            </div>
          ))}
        </motion.div>

        <div className="mt-24">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-3xl font-bold text-center mb-16"
          >
            Our Core Values
          </motion.h3>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                className="relative p-8 bg-card rounded-3xl border border-border/40 backdrop-blur-xl hover:bg-accent/5 transition-colors"
              >
                <div className="absolute -inset-px bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl opacity-0 hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <value.icon className="w-8 h-8 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-4 text-foreground">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
          className="mt-24 text-center text-muted-foreground"
        >
          <p className="max-w-3xl mx-auto">
            Founded by a team of AI researchers and crypto experts, Inchy.ai combines deep expertise in 
            artificial intelligence, blockchain technology, and financial markets to create the most 
            sophisticated crypto investment platform available today.
          </p>
        </motion.div>
      </div>
    </div>
    </>
  );
}
