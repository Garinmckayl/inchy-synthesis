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

interface SubscribeProps {
    onSubscribe: () => void;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;

  }
  
export function SubscribeDialog({ onSubscribe, isOpen, onOpenChange }: SubscribeProps) {
  console.log(onSubscribe)
  // const [isSOpen, setIsOpen] = useState(isOpen);
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
    // setIsOpen(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>

      <DialogTrigger asChild>
        {/* <Button onClick={handleClick}>
          <User className="mr-2 h-4 w-4" />
         Subscribe
        </Button> */}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>You need to subscribe</DialogTitle>
        </DialogHeader>
        {userDetails ? (
          <div className="space-y-4 py-4">


            <Button className="w-full" onClick={onSubscribe}>
              Subscribe
            </Button>
          </div>
        ) : (
          <div className="p-4 text-center">Loading user details...</div>
        )}
      </DialogContent>
    </Dialog>
  );
}