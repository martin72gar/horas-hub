import NextAuth from 'next-auth';
import { NextResponse, type NextRequest } from 'next/server';
import { authConfig } from './auth.config';
import { getTenantSlug } from './lib/tenant-slug';

const authProxy = NextAuth(authConfig).auth;

export default function proxy(request: NextRequest) {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'localhost:3000';
  const slug = getTenantSlug(request.headers.get('host'), rootDomain);

  // Pengunjung subdomain tenant = publik. Rewrite dan jangan lewati gate login.
  // ponytail: slug tidak diverifikasi ke DB di sini; halaman /sites/[slug]
  // yang melakukan lookup + notFound(), supaya middleware tetap murah di edge.
  if (slug) {
    const url = request.nextUrl.clone();
    url.pathname = `/sites/${slug}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  return (authProxy as unknown as (req: NextRequest) => ReturnType<typeof NextResponse.next>)(request);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
