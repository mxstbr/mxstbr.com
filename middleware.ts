import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Check if the request URL contains os=true parameter
  const url = new URL(request.url)
  const isOsMode = url.searchParams.has('os') && url.searchParams.get('os') === 'true'
  
  // Set a custom header that we can read in the layout
  if (isOsMode) {
    response.headers.set('x-os-mode', 'true')
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
