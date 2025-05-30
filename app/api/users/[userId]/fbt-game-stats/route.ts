import { type NextRequest, NextResponse } from "next/server"
import { getUserStats, saveUserStats } from "@/lib/moralis"

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params

    // Get user stats from Moralis
    const stats = await getUserStats(userId)

    if (!stats) {
      return NextResponse.json({ error: "User stats not found" }, { status: 404 })
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Error fetching user stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    const { userId } = params
    const body = await request.json()

    const { captures, escapes } = body

    if (typeof captures !== "number" || typeof escapes !== "number") {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 })
    }

    // Save user stats to Moralis
    const result = await saveUserStats(userId, { captures, escapes })

    if (!result.success) {
      return NextResponse.json({ error: "Failed to save user stats" }, { status: 500 })
    }

    return NextResponse.json({ success: true, captures, escapes })
  } catch (error) {
    console.error("Error saving user stats:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
