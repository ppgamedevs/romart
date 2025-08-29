"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export function Tooltip({ content, children, position = "top", className }: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [coords, setCoords] = React.useState({ x: 0, y: 0 });

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCoords({ x: rect.left + rect.width / 2, y: rect.top });
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    setIsVisible(false);
  };

  const getPositionClasses = () => {
    switch (position) {
      case "top":
        return "bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 mb-1";
      case "bottom":
        return "top-full left-1/2 transform -translate-x-1/2 translate-y-2 mt-1";
      case "left":
        return "right-full top-1/2 transform -translate-y-1/2 -translate-x-2 mr-1";
      case "right":
        return "left-full top-1/2 transform -translate-y-1/2 translate-x-2 ml-1";
      default:
        return "bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 mb-1";
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case "top":
        return "top-full left-1/2 transform -translate-x-1/2 border-t-border";
      case "bottom":
        return "bottom-full left-1/2 transform -translate-x-1/2 border-b-border";
      case "left":
        return "left-full top-1/2 transform -translate-y-1/2 border-l-border";
      case "right":
        return "right-full top-1/2 transform -translate-y-1/2 border-r-border";
      default:
        return "top-full left-1/2 transform -translate-x-1/2 border-t-border";
    }
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      
      {isVisible && (
        <div
          className={cn(
            "absolute z-50 px-2 py-1 text-xs text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap",
            "transition-opacity duration-200",
            getPositionClasses(),
            className
          )}
          role="tooltip"
        >
          {content}
          <div
            className={cn(
              "absolute w-0 h-0 border-4 border-transparent",
              getArrowClasses()
            )}
          />
        </div>
      )}
    </div>
  );
}
