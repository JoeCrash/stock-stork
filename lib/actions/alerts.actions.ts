"use server";

import connectToDatabase from "@/database/mongoose";
import { Alerts } from "@/database/models/alerts.model";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const getUserAlertsMap = async (): Promise<Record<string, AlertFormValues>> => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) redirect("/sign-in");

    await connectToDatabase();

    const rows = await Alerts.find({ userId: session.user.id }).lean();
    const map: Record<string, AlertFormValues> = {};
    for (const row of rows) {
      const symbol = (row as any).symbol as string;
      if (!symbol) continue;
      map[symbol] = {
        alertPrice: Number((row as any).alertPrice || 0),
        lesserGreaterEqual: (row as any).lesserGreaterEqual,
        alertFrequency: (row as any).alertFrequency,
      } as AlertFormValues;
    }
    return map;
  } catch (err) {
    console.error("getUserAlertsMap failed", err);
    return {};
  }
};

export const upsertAlert = async (
  symbol: string,
  company: string,
  values: AlertFormValues
) => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) redirect("/sign-in");

    await connectToDatabase();

    const cleanSymbol = symbol.trim().toUpperCase();
    await Alerts.findOneAndUpdate(
      { userId: session.user.id, symbol: cleanSymbol },
      {
        $set: {
          userId: session.user.id,
          symbol: cleanSymbol,
          company: company?.trim() || undefined,
          alertPrice: values.alertPrice,
          lesserGreaterEqual: values.lesserGreaterEqual,
          alertFrequency: values.alertFrequency,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    revalidatePath("/watchlist");
    return { success: true } as const;
  } catch (err) {
    console.error("upsertAlert failed", err);
    return { success: false, error: "Failed to save alert" } as const;
  }
};

export const removeAlert = async (symbol: string) => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) redirect("/sign-in");

    await connectToDatabase();
    const cleanSymbol = symbol.trim().toUpperCase();
    await Alerts.deleteOne({ userId: session.user.id, symbol: cleanSymbol });
    revalidatePath("/watchlist");
    return { success: true } as const;
  } catch (err) {
    console.error("removeAlert failed", err);
    return { success: false, error: "Failed to remove alert" } as const;
  }
};
