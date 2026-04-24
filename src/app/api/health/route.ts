import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    // Check DB connection
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || "0.1.0",
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Health check failed", { error });
    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        message: "Database connection failed",
      },
      { status: 503 }
    );
  }
}
