"use client";

import { billSchema, type Bill } from "@repo/core";
import { useSyncExternalStore } from "react";
import { z } from "zod";

const STORAGE_KEY = "saysorted:bills";

const savedBillsSchema = z.array(billSchema.extend({ id: z.string() }));

export type SavedBill = z.infer<typeof savedBillsSchema>[number];

const noBills: SavedBill[] = [];
const listeners = new Set<() => void>();
let cache: SavedBill[] | null = null;

function read(): SavedBill[] {
  if (cache) return cache;
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    const result = savedBillsSchema.safeParse(stored);
    cache = result.success ? result.data : [];
  } catch {
    cache = [];
  }
  return cache;
}

function write(bills: SavedBill[]) {
  cache = bills;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bills));
  } catch {}
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSavedBills() {
  const bills = useSyncExternalStore(subscribe, read, () => noBills);
  return {
    bills,
    add: (bill: Bill) =>
      write([...read(), { id: crypto.randomUUID(), ...bill }]),
    remove: (id: string) => write(read().filter((bill) => bill.id !== id)),
  };
}
