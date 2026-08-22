import Link from "next/link";
import type { Metadata } from "next";
import { getCategories, getSigns } from "../lib/api-client";
import { DictionaryFilters } from "./dictionary-filters";

export const metadata: Metadata = { title: "Dictionary" };

const PAGE_SIZE = 12;

type SearchParams = {
  q?: string;
  category?: string;
  page?: string;
};

export default async function DictionaryPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const [categories, results] = await Promise.all([
    getCategories(),
    getSigns({ q: params.q, category: params.category, page, pageSize: PAGE_SIZE })
  ]);

  const totalPages = Math.max(1, Math.ceil(results.totalCount / PAGE_SIZE));

  return (
    <div className="page-shell">
      <section className="page-header">
        <p className="eyebrow">ALSL dictionary</p>
        <h1>Sign dictionary</h1>
        <p className="hero-copy">
          Search verified Algerian Sign Language entries. Results come directly from the backend — this page has no
          hardcoded signs.
        </p>
      </section>

      <div className="dictionary-layout">
        <DictionaryFilters categories={categories} initialQuery={params.q ?? ""} initialCategory={params.category ?? ""} />

        <section aria-label="Dictionary results">
          <div className="results-header">
            <h2>Results</h2>
            <span>{results.totalCount} records</span>
          </div>

          {results.items.length === 0 ? (
            <div className="empty-state" role="status">
              <h3>No signs found</h3>
              <p>
                {params.q || params.category
                  ? "No entries match this search yet. Try a different term or clear the filters."
                  : "The dictionary is empty until a lawful 3DZSignDB import is performed against the backend. See the About page for dataset details."}
              </p>
            </div>
          ) : (
            <>
              <ul className="sign-list" aria-label="Signs">
                {results.items.map((sign) => (
                  <li key={sign.id}>
                    <Link href={`/dictionary/${sign.id}`} className="sign-card">
                      <span lang="ar" dir="rtl">
                        {sign.arabicLabel}
                      </span>
                      {sign.gloss ? <small>{sign.gloss}</small> : null}
                      <small className="muted">{sign.category ?? "Uncategorized"}</small>
                    </Link>
                  </li>
                ))}
              </ul>

              {totalPages > 1 ? (
                <nav className="pagination" aria-label="Dictionary pagination">
                  {page > 1 ? (
                    <Link href={buildPageHref(params, page - 1)} rel="prev">
                      ← Previous
                    </Link>
                  ) : (
                    <span aria-hidden="true" />
                  )}
                  <span aria-current="page">
                    Page {page} of {totalPages}
                  </span>
                  {page < totalPages ? (
                    <Link href={buildPageHref(params, page + 1)} rel="next">
                      Next →
                    </Link>
                  ) : (
                    <span aria-hidden="true" />
                  )}
                </nav>
              ) : null}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function buildPageHref(params: SearchParams, page: number): string {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.category) search.set("category", params.category);
  search.set("page", String(page));
  return `/dictionary?${search.toString()}`;
}
