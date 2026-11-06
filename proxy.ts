/**
 * Session refresh for every request (Next.js 16: `middleware.ts` was renamed to
 * `proxy.ts` — see node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md).
 *
 * This only keeps Supabase cookies fresh; it is not an authorization layer.
 * Each page and route handler still checks the user it needs.
 *
 * @supabase/ssr asks for Cache-Control: private, no-store on responses that may
 * carry refreshed tokens, so Vercel does not cache them.
 */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Without Supabase the app still works from localStorage, so let it through.
  if (!url || !anonKey) return NextResponse.next({ request });

  // Server Components cannot read the current URL, but the dashboard layout
  // needs it to remember where a signed-out visitor was going. Forward it as a
  // request header; every cookie refresh rebuilds the response, so the header
  // is reapplied from the mutated request.
  const lanjut = () => {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-pathname", request.nextUrl.pathname);
    return NextResponse.next({ request: { headers: requestHeaders } });
  };

  let response = lanjut();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = lanjut();
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  try {
    // getClaims() verifies the token and refreshes it when needed. Must run
    // before the response is generated so refresh cookies reach the browser.
    await supabase.auth.getClaims();
  } catch {
    // A refresh failure must not break the page; the user stays signed out.
  }

  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: [
    // Everything except static assets and images.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
