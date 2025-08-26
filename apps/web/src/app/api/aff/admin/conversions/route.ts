import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const partnerId = searchParams.get('partnerId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');
    
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (partnerId) params.append('partnerId', partnerId);
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    
    const apiUrl = `${process.env.API_URL}/aff/admin/conversions?${params}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'x-admin-token': 'admin-secret'
      }
    });
    
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Admin conversions proxy failed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch conversions' },
      { status: 500 }
    );
  }
}
