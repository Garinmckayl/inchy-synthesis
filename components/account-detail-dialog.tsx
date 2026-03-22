"use client";

import { useState, useEffect } from "react";
import { usePrivy, User as PrivyUser } from "@privy-io/react-auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, User, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

const itemVariants = {
  initial: { rotateX: 0, opacity: 1 },
  hover: { rotateX: -90, opacity: 0 },
}

const backVariants = {
  initial: { rotateX: 90, opacity: 0 },
  hover: { rotateX: 0, opacity: 1 },
}

const glowVariants = {
  initial: { opacity: 0, scale: 0.8 },
  hover: {
    opacity: 1,
    scale: 2,
    transition: {
      opacity: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
      scale: { duration: 0.5, type: "spring", stiffness: 300, damping: 25 },
    },
  },
}

const navGlowVariants = {
  initial: { opacity: 0 },
  hover: {
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1],
    },
  },
}

const sharedTransition = {
  type: "spring",
  stiffness: 100,
  damping: 20,
  duration: 0.5,
}

export function AccountDetailtDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const { authenticated, login, logout, user } = usePrivy();
  const [userDetails, setUserDetails] = useState<PrivyUser | null>(null);

  useEffect(() => {
    if (authenticated && user) {
      setUserDetails(user);
    }
  }, [authenticated, user]);

  const handleClick = () => {
    if (!authenticated) {
      login();
      return;
    }
    setIsOpen(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <motion.li className="relative" onClick={handleClick}>
            <motion.div
              className="block rounded-xl overflow-visible group relative"
              style={{ perspective: "600px" }}
              whileHover="hover"
              initial="initial"
            >
              <motion.div
                className="absolute inset-0 z-0 pointer-events-none"
                variants={glowVariants}
                style={{
                  background: "radial-gradient(circle, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.06) 50%, rgba(185,28,28,0) 100%)",
                  opacity: 0,
                  borderRadius: "16px",
                }}
              />
              <motion.a
                // href={}
                className="flex items-center gap-2 px-4 py-2 relative z-10 bg-transparent text-muted-foreground group-hover:text-foreground transition-colors rounded-xl"
                variants={itemVariants}
                transition={sharedTransition}
                style={{ transformStyle: "preserve-3d", transformOrigin: "center bottom" }}
              >
                <span className={`transition-colors duration-300 group-hover:text-red-500 text-foreground`}>
                <User className="h-5 w-5" />
                </span>
                <span>Account</span>
              </motion.a>
              <motion.a
                // href={}
                className="flex items-center gap-2 px-4 py-2 absolute inset-0 z-10 bg-transparent text-muted-foreground group-hover:text-foreground transition-colors rounded-xl"
                variants={backVariants}
                transition={sharedTransition}
                style={{ transformStyle: "preserve-3d", transformOrigin: "center top", rotateX: 90 }}
              >
                <span className={`transition-colors duration-300 group-hover:text-red-500 text-foreground`}>
                  <User className="h-5 w-5" />
                </span>
                <span>Account</span>
              </motion.a>
            </motion.div>
          </motion.li>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Account Details</DialogTitle>
        </DialogHeader>
        {userDetails ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={user?.email ? user.email.address : "None"}
                readOnly
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Wallet</Label>
              <Input
                id="name"
                value={user?.wallet ? user.wallet.address : "None"}
                readOnly
              />
            </div>

            <Button className="w-full" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        ) : (
          <div className="p-4 text-center">Loading user details...</div>
        )}
      </DialogContent>
    </Dialog>
  );
}