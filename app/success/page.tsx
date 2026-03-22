"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "../../hooks/use-toast";

export default function SuccessPage() {
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get(
      "session_id"
    );

    // if (sessionId) {
    // Show success toast or modal
    <div className="text-center !font-sans">
      <h1 className="font-syne mb-6 text-2xl text-neutral-200  sm:text-4xl"></h1>
      <h1 className="z-2 relative text-center font-sans text-2xl font-bold text-white md:text-5xl lg:text-7xl">
        Payment success
        <br /> thank you!
      </h1>
    </div>;

    // Optionally, redirect after a delay
    setTimeout(() => {
      router.push("/"); // Redirect to home or another page
    }, 3000);
    // }
  }, [router, toast]);

  return (
    <div className="text-center !font-sans">
      <h1 className="font-syne mb-6 text-2xl text-neutral-200  sm:text-4xl"></h1>
      <h1 className="z-2 relative text-center font-sans text-2xl font-bold text-white md:text-5xl lg:text-7xl">
        Payment success
        <br /> thank you!
      </h1>
    </div>
  );

  return null; // No need to render anything on this page
}
