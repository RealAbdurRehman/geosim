export async function fetchWikidataHeights(
  qids: string[],
): Promise<Record<string, number>> {
  if (qids.length === 0) return {};

  try {
    const values = qids.map((qid) => `wd:${qid}`).join(" ");
    const query = `
    SELECT ?item ?height WHERE {
      VALUES ?item { ${values} }
      ?item p:P2048 ?statement.
      ?statement ps:P2048 ?height.
      ?statement wikibase:rank ?rank.
      FILTER(?rank = wikibase:PreferredRank || ?rank = wikibase:NormalRank)
    }
  `;

    const url = `https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: { Accept: "application/sparql-results+json" },
    });
    if (!res.ok) return {};

    const data = await res.json();
    const heights: Record<string, number> = {};

    for (const row of data.results.bindings) {
      const qid = row.item.value.split("/").pop();
      const value = Number.parseFloat(row.height.value);

      if (!Number.isFinite(value) || value <= 0 || value > 450) {
        console.warn("Rejected implausible Wikidata height", qid, value);
        continue;
      }
      if (heights[qid] !== undefined && Math.abs(heights[qid] - value) > 5) {
        console.warn(
          "Conflicting Wikidata heights for",
          qid,
          heights[qid],
          "vs",
          value,
          "— keeping first",
        );
        continue;
      }

      heights[qid] = value;
    }

    return heights;
  } catch (err) {
    console.warn("Failed to fetch building heights from Wikidata:", err);
    return {};
  }
}
