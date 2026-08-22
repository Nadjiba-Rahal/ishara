import type { Metadata } from "next";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="page-shell">
      <section className="page-header">
        <p className="eyebrow">About ISHARA</p>
        <h1>What&apos;s real today, and what&apos;s still planned</h1>
        <p className="hero-copy">
          ISHARA is a dictionary, translation workspace, and practice space for Algerian Sign Language (ALSL).
          This page is deliberately plain about what is implemented versus planned — no invented statistics, no
          faked accuracy numbers.
        </p>
      </section>

      <div className="detail-grid">
        <section className="card">
          <h2>Working today</h2>
          <ul className="checklist">
            <li>Sign dictionary search backed by the live API — no hardcoded entries.</li>
            <li>Real-time camera translation running entirely in your browser via ONNX Runtime Web.</li>
            <li>The same recognition model exposed through the backend API for other clients.</li>
            <li>Account registration and login secured with JWT access and refresh tokens.</li>
            <li>Gloss-matching practice quizzes built from real dictionary entries.</li>
          </ul>
        </section>

        <section className="card">
          <h2>Planned, not built yet</h2>
          <ul className="checklist">
            <li>3D avatar playback of SigML entries.</li>
            <li>Camera-based practice with live model feedback.</li>
            <li>Community contributions and moderation workflow.</li>
          </ul>
        </section>

        <section className="card">
          <h2>Data and model</h2>
          <p className="muted">
            Dictionary entries are sourced from 3DZSignDB imports. The recognition model (IsharaFinal) is trained
            on the VDzSL dataset using pose and hand landmarks captured over 16 frames per sign.
          </p>
        </section>
      </div>
    </div>
  );
}
