import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const apiUrl = `${process.env.API_URL}/aff/admin/partners/${id}/link`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': 'admin-secret'
      },
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Admin create link proxy failed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create referral link' },
      { status: 500 }
    );
  }
}
