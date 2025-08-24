"use client";

import NextImage, { ImageProps as NextImageProps } from "next/image";
import { cn } from "@/lib/utils";

interface ImageProps extends Omit<NextImageProps, "fill"> {
  fill?: boolean;
  className?: string;
}

export function Image({ 
  className, 
  fill = false,
  ...props 
}: ImageProps) {
  if (fill) {
    return (
      <NextImage
        fill
        className={cn("object-cover", className)}
        {...props}
      />
    );
  }

  return (
    <NextImage
      className={cn("object-cover", className)}
      {...props}
    />
  );
}
