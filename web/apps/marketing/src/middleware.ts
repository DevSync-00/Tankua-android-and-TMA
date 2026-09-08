import { NextRequest, NextResponse } from "next/server";

const unauthorizedResponse = () =>
  new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Tankua Admin Portal"',
      "Cache-Control": "no-store",
    },
  });

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/admin-portal")) {
    return NextResponse.next();
  }

  const username = process.env.ADMIN_PORTAL_USERNAME;
  const password = process.env.ADMIN_PORTAL_PASSWORD;

  // If credentials are not configured, fail closed for safety.
  if (!username || !password) {
    return unauthorizedResponse();
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Basic ")) {
    return unauthorizedResponse();
  }

  const token = authHeader.substring(6);
  const decoded = atob(token);
  const separatorIndex = decoded.indexOf(":");

  if (separatorIndex === -1) {
    return unauthorizedResponse();
  }

  const requestUsername = decoded.slice(0, separatorIndex);
  const requestPassword = decoded.slice(separatorIndex + 1);

  if (requestUsername !== username || requestPassword !== password) {
    return unauthorizedResponse();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin-portal/:path*"],
};
