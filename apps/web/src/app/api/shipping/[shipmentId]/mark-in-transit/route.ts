import { NextRequest, NextResponse } from "next/server"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shipmentId: string }> }
) {
  try {
    const { shipmentId } = await params
    
    const response = await fetch(`${process.env.API_URL}/shipping/${shipmentId}/mark-in-transit`, {
      method: "POST",
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
    console.error("Mark in transit proxy failed:", error)
    return NextResponse.json(
      { success: false, error: "Failed to mark shipment as in transit" },
      { status: 500 }
    )
  }
}
