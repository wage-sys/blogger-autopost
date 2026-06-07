import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'

    const res = await fetch(
      `${baseUrl}/api/autopost?secret=${process.env.CRON_SECRET}`,
      { method: 'POST' }
    )

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}