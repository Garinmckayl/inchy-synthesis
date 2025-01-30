import { useMediaQuery } from "@/hooks/use-media-query";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Link, Search, Zap, GraduationCap, Share2, Cloud } from "lucide-react";
import {
  CheckCircle,
  CurrencyDollar,
  Flag,
  GithubLogo,
  Info,
  RoadHorizon,
  SoccerBall,
  TennisBall,
  XLogo,
} from "@phosphor-icons/react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

const FeaturesContent = () => {
  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 p-1">
      <section className="space-y-4 font-syne">
        <h2 className="text-2xl font-medium mt-2">Welcome to Inchy.ai</h2>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
          Inchy.ai is an advanced AI intelligence platform designed specifically
          for the cryptocurrency market. Our mission is to empower both retail
          investors and institutional funds with cutting-edge tools and insights
          to navigate the complex world of digital assets.
        </p>
        <div className="flex flex-row items-center gap-2 h-8">
          <Link
            href="https://x.com/"
            className="inline-flex h-8 items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors no-underline"
          >
            <XLogo className="h-3.5 w-3.5" />
            <span className="font-medium">Follow on X</span>
          </Link>
        </div>
      </section>

      <Separator className="bg-neutral-200 dark:bg-neutral-800" />

      <section className="space-y-4">
        <h3 className="text-xl font-semibold">Core Features</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: Search, text: "24/7 AI Assistance for Crypto Queries" },
            { icon: Zap, text: "Real-time Data from All Crypto Sources" },
            {
              icon: GraduationCap,
              text: "Comprehensive Crypto Research & Due Diligence",
            },
            { icon: Share2, text: "Wallet Analysis & Asset Optimization" },
            {
              icon: Cloud,
              text: "Copilot Trading for Retail Investors to Big Funds",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
            >
              <feature.icon className="h-5 w-5 text-primary" />
              <span className="text-sm text-neutral-600 dark:text-neutral-400">
                {feature.text}
              </span>
            </div>
          ))}
        </div>
      </section>

      <Separator className="bg-neutral-200 dark:bg-neutral-800" />

      <section className="space-y-4">
        <h3 className="text-xl font-semibold">Enterprise</h3>
        <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-primary">→</span>
            Contact as sales@inchy.ai
          </div>
        </div>
      </section>
    </div>
  );
};
const FeaturesButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full w-8 h-8 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
          >
            Features{" "}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[725px] z-[100] max-h-[80vh] overflow-y-auto">
          <FeaturesContent />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="rounded-full w-8 h-8 bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
        >
          Features{" "}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="z-[100]">
        <div className="px-4 my-0 h-[75vh] overflow-y-auto">
          <FeaturesContent />
        </div>
        <DrawerFooter className="pt-2 border-t">
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default FeaturesButton;
