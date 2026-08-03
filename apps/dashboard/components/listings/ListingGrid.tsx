"use client";

import { motion } from "framer-motion";
import type { Listing } from "@vinted-hunter/shared";
import { ListingCard } from "./ListingCard";

export function ListingGrid({ listings }: { listings: Listing[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {listings.map((listing, index) => (
        <motion.div
          key={listing.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(index, 12) * 0.03, duration: 0.2 }}
        >
          <ListingCard listing={listing} />
        </motion.div>
      ))}
    </div>
  );
}
