"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

export default function SuccessPage() {
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get(
      "session_id"
    );

    if (sessionId) {
      // Show success toast or modal
      toast({
        title: "Payment Successful",
        description:
          "Thank you for your purchase! Your payment was successful.",
        variant: "success",
      });

      // Optionally, redirect after a delay
      setTimeout(() => {
        router.push("/"); // Redirect to home or another page
      }, 3000);
    }
  }, [router, toast]);

  return null; // No need to render anything on this page
}
