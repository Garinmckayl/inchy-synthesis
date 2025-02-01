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
        <Button onClick={handleClick}>
          <User className="mr-2 h-4 w-4" />
          Account Details
        </Button>
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