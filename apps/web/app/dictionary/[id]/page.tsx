import Link from "next/link";
import { notFound } from "next/navigation";
import { getSign } from "../../lib/api-client";

export default async function SignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sign = await getSign(id);

  if (!sign) {
    notFound();
  }

  return (
    <div className="page-shell">
      <Link href="/dictionary" className="back-link">
        ← Back to dictionary
      </Link>

      <section className="page-header">
        <p className="eyebrow">{sign.category ?? "Uncategorized"}</p>
        <h1 lang="ar" dir="rtl">
          {sign.arabicLabel}
        </h1>
        {sign.gloss ? <p className="hero-copy">Gloss: {sign.gloss}</p> : null}
      </section>

      <div className="detail-grid">
        <section className="card">
          <h2>Available representations</h2>
          <ul className="rep-list">
            <li>
              <span>SigML (3D avatar data)</span>
              <span className={sign.hasSigml ? "tag tag-ok" : "tag"}>
                {sign.hasSigml ? "Available" : "Not imported"}
              </span>
            </li>
            <li>
              <span>HamNoSys notation</span>
              <span className={sign.hasHamNoSys ? "tag tag-ok" : "tag"}>
                {sign.hasHamNoSys ? "Available" : "Not imported"}
              </span>
            </li>
            <li>
              <span>Media</span>
              <span className={sign.hasMedia ? "tag tag-ok" : "tag"}>
                {sign.hasMedia ? "Available" : "Not imported"}
              </span>
            </li>
          </ul>
          {sign.hasSigml ? (
            <p className="muted">Avatar playback from this SigML data is planned and isn&apos;t built yet.</p>
          ) : null}
        </section>

        <section className="card">
          <h2>Source</h2>
          <ul className="rep-list">
            <li>
              <span>Dataset</span>
              <span>{sign.sourceName}</span>
            </li>
            <li>
              <span>Source record ID</span>
              <span>{sign.sourceRecordId}</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
