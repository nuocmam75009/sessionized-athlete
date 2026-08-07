import { NextRequest, NextResponse } from 'next/server'

export function proxy(request: NextRequest) {
  const token = request.cookies.get('sessionized_token')
  if (!token) return NextResponse.redirect(new URL('/login', request.url))
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/activities/:path*', '/plan/:path*', '/profile/:path*'],
}
