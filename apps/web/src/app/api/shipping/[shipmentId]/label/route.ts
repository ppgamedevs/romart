import { NextRequest, NextResponse } from "next/server"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shipmentId: string }> }
) {
  try {
    const { shipmentId } = await params
    
    const response = await fetch(`${process.env.API_URL}/shipping/${shipmentId}/label`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Label download proxy failed:", error)
    return NextResponse.json(
      { success: false, error: "Failed to generate download URL" },
      { status: 500 }
    )
  }
}
