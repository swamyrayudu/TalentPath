import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { adminQuestions } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(adminQuestions)
      .where(eq(adminQuestions.isActive, true));

    const totalCount = countResult?.count || 0;

    // Get paginated questions
    const offset = (page - 1) * limit;
    const questions = await db
      .select()
      .from(adminQuestions)
      .where(eq(adminQuestions.isActive, true))
      .limit(limit)
      .offset(offset);

    const hasMore = offset + questions.length < totalCount;

    return NextResponse.json({
      success: true,
      data: {
        questions,
        totalCount,
        hasMore,
        page,
        limit,
      },
    });
  } catch (error: unknown) {
    console.error("Error fetching questions:", error);
    const message = error instanceof Error ? error.message : "Failed to fetch questions";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
