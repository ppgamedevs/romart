import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('partnerId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');
    
    const params = new URLSearchParams();
    if (partnerId) params.append('partnerId', partnerId);
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    
    const apiUrl = `${process.env.API_URL}/aff/admin/payouts?${params}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'x-admin-token': 'admin-secret'
      }
    });
    
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Admin payouts proxy failed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payouts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const apiUrl = `${process.env.API_URL}/aff/admin/payouts/run`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': 'admin-secret',
        'token': process.env.ADMIN_CRON_TOKEN || 'admin-secret'
      },
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Admin run payouts proxy failed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to run payouts' },
      { status: 500 }
    );
  }
}
