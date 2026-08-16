/**
 * Single source of truth for names.
 * First and last are captured as separate fields; this is the only place that
 * joins them, so the old "Revanthai ai" concatenation cannot resurface.
 */
const collapse = (s: string) => s.replace(/\s+/g, " ").trim();

export function cleanFullName(first: string, last: string): string {
  const f = collapse(first);
  let l = collapse(last);
  if (!f) return l;
  if (!l) return f;
  const fl = f.toLowerCase();
  const ll = l.toLowerCase();
  // Drop a last name that is already contained in / duplicated by the first name
  // (the source of the historic concatenation bug), or a stray 1-char fragment.
  if (ll.length < 2 || fl === ll || fl.endsWith(ll) || fl.startsWith(ll)) l = "";
  return collapse(`${f} ${l}`);
}

export function splitFullName(full?: string | null): { first: string; last: string } {
  const parts = collapse(full ?? "").split(" ").filter(Boolean);
  return { first: parts[0] ?? "", last: parts.slice(1).join(" ") };
}
