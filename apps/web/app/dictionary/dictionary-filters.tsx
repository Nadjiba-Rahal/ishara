"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent } from "react";
import type { Category } from "../lib/api-client";

export function DictionaryFilters({ categories, initialQuery, initialCategory }: { categories: Category[]; initialQuery: string; initialCategory: string }) {
  const router = useRouter(); const search = useSearchParams();
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data = new FormData(event.currentTarget); const params = new URLSearchParams(search.toString()); const q = String(data.get("q") ?? "").trim(); const category = String(data.get("category") ?? ""); q ? params.set("q", q) : params.delete("q"); category ? params.set("category", category) : params.delete("category"); params.delete("page"); router.push(`/dictionary?${params}`); }
  return <form className="filters" onSubmit={submit}><label className="sr-only" htmlFor="dictionary-query">Search signs</label><input id="dictionary-query" name="q" defaultValue={initialQuery} placeholder="Arabic label or gloss" /><label className="sr-only" htmlFor="dictionary-category">Filter by category</label><select id="dictionary-category" name="category" defaultValue={initialCategory}><option value="">All categories</option>{categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}</select><button type="submit">Search</button></form>;
}