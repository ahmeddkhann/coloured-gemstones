"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type WishlistItem = {
  gemstoneId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  stock: number;
};

type WishlistContextValue = {
  items: WishlistItem[];
  ready: boolean;
  count: number;
  has: (gemstoneId: string) => boolean;
  toggle: (item: WishlistItem) => void;
  remove: (gemstoneId: string) => void;
};

const STORAGE_KEY = "cg-wishlist";

const WishlistContext = createContext<WishlistContextValue | null>(null);

function readWishlist(): WishlistItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as WishlistItem[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (item) => item && typeof item.gemstoneId === "string",
    );
  } catch {
    return [];
  }
}

function writeWishlist(items: WishlistItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(readWishlist());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }
    writeWishlist(items);
  }, [items, ready]);

  const has = useCallback(
    (gemstoneId: string) => items.some((item) => item.gemstoneId === gemstoneId),
    [items],
  );

  const toggle = useCallback((item: WishlistItem) => {
    setItems((prev) => {
      const exists = prev.some((line) => line.gemstoneId === item.gemstoneId);
      if (exists) {
        return prev.filter((line) => line.gemstoneId !== item.gemstoneId);
      }
      return [...prev, item];
    });
  }, []);

  const remove = useCallback((gemstoneId: string) => {
    setItems((prev) => prev.filter((line) => line.gemstoneId !== gemstoneId));
  }, []);

  const value = useMemo<WishlistContextValue>(
    () => ({
      items,
      ready,
      count: items.length,
      has,
      toggle,
      remove,
    }),
    [items, ready, has, toggle, remove],
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error("useWishlist must be used within WishlistProvider.");
  }
  return ctx;
}
