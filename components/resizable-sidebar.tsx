"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ResizableSidebarProps {
  children: React.ReactNode;
  className?: string;
}

export function ResizableSidebar({
  children,
  className,
}: ResizableSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [width, setWidth] = useState(256); // Default width
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = e.clientX;
      if (newWidth > 150 && newWidth < 480) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  return (
    <div className="relative hidden lg:block">
      <Card
        ref={sidebarRef}
        className={cn(
          "transition-all duration-300 ease-in-out",
          isCollapsed ? "w-16" : `w-[${width}px]`,
          className
        )}
      >
        <div
          className={cn(
            "absolute -right-3 top-1/2 z-20 flex h-8 w-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md border bg-background",
            isResizing && "cursor-col-resize"
          )}
        >
          <div
            className="absolute inset-y-0 right-full w-2 cursor-col-resize"
            onMouseDown={() => setIsResizing(true)}
          />
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex h-full w-full items-center justify-center"
          >
            {isCollapsed ? (
              <ChevronRight size={14} />
            ) : (
              <ChevronLeft size={14} />
            )}
          </button>
        </div>
        <div
          className={cn(
            "transition-opacity duration-300",
            isCollapsed && "opacity-0"
          )}
        >
          {children}
        </div>
      </Card>
    </div>
  );
}
