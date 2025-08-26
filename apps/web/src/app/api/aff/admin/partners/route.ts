import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const kind = searchParams.get('kind');
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');
    
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (kind) params.append('kind', kind);
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
    
    const apiUrl = `${process.env.API_URL}/aff/admin/partners?${params}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'x-admin-token': 'admin-secret'
      }
    });
    
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Admin partners proxy failed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch partners' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const apiUrl = `${process.env.API_URL}/aff/admin/partners`;
    
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
    console.error('Admin create partner proxy failed:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create partner' },
      { status: 500 }
    );
  }
}
