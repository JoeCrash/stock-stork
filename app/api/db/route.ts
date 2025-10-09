import { NextResponse } from "next/server";
import { connectToDatabase } from "@/database/mongoose";

export const runtime = "nodejs";

export async function GET() {
  try {
    const mongoose = await connectToDatabase();
    const connection = mongoose.connection;

    return NextResponse.json({
      ok: true,
      driver: "mongoose",
      host: connection.host,
      name: connection.name,
      readyState: connection.readyState,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
