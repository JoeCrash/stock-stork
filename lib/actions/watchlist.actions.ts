"use server";

import connectToDatabase from "@/database/mongoose";
import { Watchlist } from "@/database/models/watchlist.model";

export const getWatchlistSymbolsByEmail = async (email: string): Promise<string[]> => {
  try {
    if (!email || typeof email !== "string") return [];

    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error("MongoDB connection not established");

    // Better Auth user collection is named 'user'
    const user = await db.collection("user").findOne<{ _id?: unknown; id?: string; email?: string }>({ email });
    if (!user) return [];

    const userId = (user.id as string) || String(user._id?.toString() || "");
    if (!userId) return [];

    const items = await Watchlist.find({ userId }).select("symbol").lean();
    if (!items || items.length === 0) return [];

    return items
      .map((i) => (typeof (i as any).symbol === "string" ? (i as any).symbol : ""))
      .filter((s): s is string => Boolean(s))
      .map((s) => s.trim().toUpperCase());
  } catch (err) {
    console.error("getWatchlistSymbolsByEmail failed", err);
    return [];
  }
};
