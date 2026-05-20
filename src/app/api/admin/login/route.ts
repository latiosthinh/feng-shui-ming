import { NextRequest, NextResponse } from 'next/server'
import { createPocketBase } from '@/lib/pocketbase/client'

export async function POST(request: NextRequest) {
  let body: { email: string; password: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.email || !body.password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
  }

  const pb = createPocketBase()
  try {
    const admin = await pb.admins.authWithPassword(body.email, body.password)

    const response = NextResponse.json({ success: true })
    response.cookies.set('pb_auth', JSON.stringify({
      token: admin.token,
      model: { email: admin.record.email },
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }
}
