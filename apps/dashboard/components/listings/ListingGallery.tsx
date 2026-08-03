"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "../../utils/cn";

export interface ListingGalleryProps {
  images: string[];
  alt: string;
}

export function ListingGallery({ images, alt }: ListingGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-lg border border-border-default bg-bg-surface text-sm text-text-tertiary">
        No images available
      </div>
    );
  }

  const activeImage = images[activeIndex] ?? images[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-lg border border-border-default bg-bg-surface">
        <AnimatePresence mode="wait">
          <motion.img
            key={activeIndex}
            src={activeImage}
            alt={alt}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="h-full w-full object-cover"
          />
        </AnimatePresence>
      </div>
      {images.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={image}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={cn(
                "h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition-colors",
                index === activeIndex
                  ? "border-accent-primary"
                  : "border-transparent opacity-70 hover:opacity-100",
              )}
            >
                  <img src={image} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
