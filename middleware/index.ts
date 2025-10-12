import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
    const sessionCookie = getSessionCookie(request);

    // Check cookie presence - prevents obviously unauthorized users
    /* JMM 10/12/25 - Better-Auth recommends using this pattern so the sign-in page doesn't get blocked. However, I need
    to review against attack vectors attempting to re-use old sessions/ forged cookies, possibly hardening by validating integrity,
    signature or expiration. */
    if (!sessionCookie) {
        return NextResponse.redirect(new URL('/sign-in', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|sign-in|sign-up|assets).*)',
    ],
};


