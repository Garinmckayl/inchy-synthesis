"use client";

import { useChat } from "ai/react";
import { useEffect } from "react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronRight,
  Sparkles,
  Twitter,
  Send,
  MessageSquare,
  Crown,
} from "lucide-react";
import { SuggestedQuestions } from "@/components/suggested-questions";
import { Navbar } from "@/components/navbar";
import { PriceChart } from "@/components/price-chart";
import { ResizableSidebar } from "@/components/resizable-sidebar";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";

// Generate mock historical data
const generateMockData = () => {
  const data: [string, number][] = [];
  let currentPrice = 2000;
  const now = new Date();

  for (let i = 365; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    currentPrice = currentPrice * (1 + (Math.random() - 0.5) * 0.02);
    data.push([date.toISOString(), currentPrice]);
  }
  return data;
};

const mockMessages = [
  {
    id: "1",
    role: "user",
    content: "How has ETH's price changed over the past year?",
  },
  {
    id: "2",
    role: "assistant",
    content:
      "Here's Ethereum's price chart over the past year. The current price is $2,245.67, showing a significant increase of +102.47% from last year. The chart shows several key movements:",
    chart: {
      symbol: "ETH",
      data: generateMockData(),
    },
  },
];

export default function Home() {
  const {
    isLoading,
    input,
    messages,
    setInput,
    append,
    handleSubmit,
    handleInputChange,
    setMessages,
    reload,
    stop,
  } = useChat({
    maxSteps: 8,
    body: {
      group: "crypto",
    },
    onFinish: async (message, { finishReason }) => {
      console.log("[finish reason]:", finishReason);
      if (
        (message.content && finishReason === "stop") ||
        finishReason === "length"
      ) {
        // const newHistory = [
        //   ...messages,
        //   { role: "user", content: lastSubmittedQueryRef.current },
        //   { role: "assistant", content: message.content },
        // ];
        // const { questions } = await suggestQuestions(newHistory);
        // setSuggestedQuestions(questions);
      }
    },
    onError: (error) => {
      console.error("Chat error:", error.cause, error.message);
      // toast.error("An error occurred.", {
      //   description: `Oops! An error occurred while processing your request. ${error.message}`,
      // });
    },
  });

  const { toast } = useToast();

  const handleSubscribe = async () => {
    try {
      const response = await fetch("/api/create-checkout", {
        method: "POST",
      });
      const { sessionId } = await response.json();

      const stripe = await loadStripe(
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
      );
      await stripe?.redirectToCheckout({ sessionId });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start checkout process. Please try again.",
        variant: "destructive",
      });
    }
  };

  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <SidebarProvider>
        <AppSidebar onSubscribe={handleSubscribe} />
        <SidebarInset>
          <div className="container flex flex-1 gap-4 py-4">
            {/* <div className="p-4">
              <div className="mb-8">
                <h2 className="mb-2 text-lg font-semibold">Inchy Token</h2>
                <div className="rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 p-4 text-white">
                  <div className="text-2xl font-bold">$0.00123</div>
                  <div className="text-sm">+15.7% (24h)</div>
                </div>
              </div>
              <div className="space-y-2">
                <Button
                  variant="gradient"
                  className="w-full"
                  onClick={handleSubscribe}
                >
                  <Crown className="mr-2 h-4 w-4" />
                  Subscribe Now
                </Button>
                <Button variant="ghost" className="w-full justify-start">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Premium Features
                </Button>
                <Link href="https://twitter.com/inchy_ai" target="_blank">
                  <Button variant="ghost" className="w-full justify-start">
                    <Twitter className="mr-2 h-4 w-4" />
                    Twitter
                  </Button>
                </Link>
                <Link href="https://t.me/inchy_ai" target="_blank">
                  <Button variant="ghost" className="w-full justify-start">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Telegram
                  </Button>
                </Link>
              </div>
            </div> */}

            {/* Chat Area */}
            <Card className="flex flex-1 flex-col">
              <ScrollArea className="flex-1">
                <div className="space-y-4 p-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          message.role === "user"
                            ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white"
                            : "bg-muted"
                        }`}
                      >
                        <div>{message.content}</div>
                        {message.role === "assistant" && "chart" in message && (
                          <div className="mt-4">
                            <PriceChart
                              data={(message as any).chart.data}
                              symbol={(message as any).chart.symbol}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="border-t p-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={input}
                      onChange={handleInputChange}
                      placeholder="Ask about crypto markets..."
                      className="flex-1"
                    />
                    <Button type="submit">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <SuggestedQuestions onSelectQuestion={setInput} />
                </form>
              </div>
            </Card>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
