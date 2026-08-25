"use client";

import Link from "next/link";
import { useAuth } from "../lib/auth-context";

export function SiteHeader() {
  const { session, isLoading, logout } = useAuth();

  return (
    <header className="site-header">
      <Link href="/" className="site-brand">
        <span className="logo-frame"><img className="logo-mark" src="/logo.png" alt="ISHARA" /></span>
        <span className="brand-name">ISHARA</span>
      </Link>
      <nav className="site-nav" aria-label="Main navigation">
        <Link href="/dictionary">Dictionary</Link>
        <Link href="/translate">Translate</Link>
        <Link href="/practice">Practice</Link>
        <Link href="/about">About</Link>
        {!isLoading && session ? (
          <>
            <Link href="/dashboard">{session.displayName}</Link>
            <button type="button" className="btn-link" onClick={() => logout()}>
              Log out
            </button>
          </>
        ) : !isLoading ? (
          <Link href="/auth/login">Log in</Link>
        ) : null}
      </nav>
    </header>
  );
}
