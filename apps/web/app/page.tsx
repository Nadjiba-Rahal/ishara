import Link from "next/link";

export default function Home() {
  return (
    <div className="page-shell">
      <section className="hero">
        <div className="hero-copy-block">
          <p className="eyebrow">ALSL communication, made clearer</p>
          <h1>Understand every gesture.</h1>
          <p className="hero-copy">
            ISHARA brings Algerian Sign Language into one calm, useful place: look up signs, translate with your camera, and practice at your own pace.
          </p>
          <div className="hero-actions">
            <Link href="/translate" className="btn btn-primary btn-lg">
              Try live translation
            </Link>
            <Link href="/dictionary" className="btn btn-ghost btn-lg">
              Explore the dictionary
            </Link>
          </div>
        </div>
        <div className="hero-illustration" aria-label="A hand sign translation preview">
          <div className="illustration-topline"><span>TRANSLATION PREVIEW</span><span className="preview-badge">BROWSER-LOCAL</span></div>
          <div className="sign-figure" aria-hidden="true">&#9995;</div>
          <div className="gesture-label"><span className="mini-mark">I</span><span><strong>Recognition ready</strong><small>Plug in your trained model to begin</small></span><b>LOCAL</b></div>
          <div className="gesture-trail"><span lang="ar" dir="rtl">إشارة</span><span>meaning</span><span>conversation</span></div>
        </div>
      </section>

      <section className="feature-grid" aria-label="What ISHARA offers">
        <article className="feature-card">
          <span className="feature-icon icon-book" aria-hidden="true">✦</span>
          <h2>Sign dictionary</h2>
          <p>
            Search real ALSL entries sourced from 3DZSignDB, with categories, HamNoSys notation, and SigML
            availability shown honestly per entry.
          </p>
          <Link href="/dictionary">Open dictionary →</Link>
        </article>

        <article className="feature-card">
          <span className="feature-icon icon-camera" aria-hidden="true">◉</span>
          <h2>Live translation</h2>
          <p>
             Use your camera for local landmark tracking and connect your trained ONNX model when it is ready.
          </p>
          <Link href="/translate">Open translator →</Link>
        </article>

        <article className="feature-card">
          <span className="feature-icon icon-practice" aria-hidden="true">↗</span>
          <h2>Learn by doing</h2>
          <p>Review dictionary entries and quiz yourself on labels and glosses as a first, honest practice mode.</p>
          <Link href="/practice">Start practicing →</Link>
        </article>
      </section>

      <section className="honesty-strip" aria-label="Project honesty commitment">
          <h2>Useful now. Honest about what comes next.</h2>
        <p>
          ISHARA never fabricates ALSL signs, translations, model accuracy, or user statistics. Features that
          aren&apos;t implemented yet are labeled &ldquo;not connected yet&rdquo; instead of faked. See the{" "}
          <Link href="/about">about page</Link> for what&apos;s real today versus planned.
        </p>
      </section>
    </div>
  );
}
