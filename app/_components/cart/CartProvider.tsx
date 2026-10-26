"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type CartItem = {
  gemstoneId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  stock: number;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  ready: boolean;
  itemCount: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (gemstoneId: string, quantity: number) => void;
  removeItem: (gemstoneId: string) => void;
  clear: () => void;
};

const STORAGE_KEY = "cg-cart";

const CartContext = createContext<CartContextValue | null>(null);

function readCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(
      (item) =>
        item &&
        typeof item.gemstoneId === "string" &&
        typeof item.quantity === "number" &&
        item.quantity > 0,
    );
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setItems(readCart());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }
    writeCart(items);
  }, [items, ready]);

  const addItem = useCallback(
    (item: Omit<CartItem, "quantity">, quantity = 1) => {
      if (item.stock < 1) {
        return;
      }
      const qty = Math.max(1, Math.floor(quantity));
      setItems((prev) => {
        const existing = prev.find((line) => line.gemstoneId === item.gemstoneId);
        if (existing) {
          const nextQty = Math.min(item.stock, existing.quantity + qty);
          return prev.map((line) =>
            line.gemstoneId === item.gemstoneId
              ? { ...item, quantity: Math.max(1, nextQty) }
              : line,
          );
        }
        const nextQty = Math.min(item.stock, qty);
        if (nextQty < 1) {
          return prev;
        }
        return [...prev, { ...item, quantity: nextQty }];
      });
    },
    [],
  );

  const setQuantity = useCallback((gemstoneId: string, quantity: number) => {
    setItems((prev) =>
      prev
        .map((line) => {
          if (line.gemstoneId !== gemstoneId) {
            return line;
          }
          const next = Math.min(line.stock, Math.max(0, Math.floor(quantity)));
          return { ...line, quantity: next };
        })
        .filter((line) => line.quantity > 0),
    );
  }, []);

  const removeItem = useCallback((gemstoneId: string) => {
    setItems((prev) => prev.filter((line) => line.gemstoneId !== gemstoneId));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((sum, line) => sum + line.quantity, 0);
    const subtotal = items.reduce(
      (sum, line) => sum + line.price * line.quantity,
      0,
    );
    return {
      items,
      ready,
      itemCount,
      subtotal,
      addItem,
      setQuantity,
      removeItem,
      clear,
    };
  }, [items, ready, addItem, setQuantity, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider.");
  }
  return ctx;
}
