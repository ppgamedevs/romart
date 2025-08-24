import { NextRequest, NextResponse } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shipmentId: string }> }
) {
  try {
    const { shipmentId } = await params
    const body = await request.json()
    
    const response = await fetch(`${process.env.API_URL}/shipping/${shipmentId}/manual-label/finalize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Label finalize proxy failed:", error)
    return NextResponse.json(
      { success: false, error: "Failed to finalize label upload" },
      { status: 500 }
    )
  }
}
