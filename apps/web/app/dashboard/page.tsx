"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "../lib/auth-context";

export default function DashboardPage() {
  const router = useRouter();
  const { session, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace("/auth/login");
    }
  }, [isLoading, session, router]);

  if (isLoading || !session) {
    return (
      <div className="page-shell">
        <p className="muted">Loading your account…</p>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <section className="page-header">
        <p className="eyebrow">Account</p>
        <h1>Welcome, {session.displayName}</h1>
        <p className="hero-copy">{session.email}</p>
      </section>

      <div className="detail-grid">
        <section className="card">
          <h2>Your role</h2>
          <p className="muted">{session.role}</p>
        </section>

        <section className="card">
          <h2>Keep learning</h2>
          <p className="muted">Jump back into the dictionary or a practice quiz.</p>
          <div className="hero-actions">
            <Link href="/practice" className="btn btn-primary">
              Practice
            </Link>
            <Link href="/dictionary" className="btn btn-ghost">
              Dictionary
            </Link>
          </div>
        </section>

        <section className="card">
          <button
            type="button"
            onClick={async () => {
              await logout();
              router.replace("/");
            }}
          >
            Log out
          </button>
        </section>
      </div>
    </div>
  );
}
