/** ───────────────────────────────────────
    Fetch and parse AO3 stats for one work
 ─────────────────────────────────────── **/

function fetchAO3Stats(url) {
  const response = UrlFetchApp.fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; AO3-Stats-Tracker/1.0; personal use)"
    },
    muteHttpExceptions: true
  });

  const html = response.getContentText();

    // 🚨 MAINTENANCE CHECK
  if (isAO3MaintenancePage(html)) {
    throw new Error("AO3_MAINTENANCE");
  }


  // Normalize whitespace
  const clean = html.replace(/\s+/g, " ");

  // Match numbers after "Hits:" and "Kudos:"
  const hitsMatch = clean.match(/<dt[^>]*>\s*Hits:\s*<\/dt>\s*<dd[^>]*>([\d,]+)/i);
  const kudosMatch = clean.match(/<dt[^>]*>\s*Kudos:\s*<\/dt>\s*<dd[^>]*>([\d,]+)/i);

  const hits = hitsMatch ? parseInt(hitsMatch[1].replace(/,/g, ""), 10) : 0;
  const kudos = kudosMatch ? parseInt(kudosMatch[1].replace(/,/g, ""), 10) : 0;

  return { hits, kudos };
}

  // ────────────────────────────────────────────────────
  // ─────────── IF HITS AND KUDOS ARE NULL ─────────────
  // ────────────────────────────────────────────────────

function fetchAO3StatsWithRetry(url, retries = 5) {

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return fetchAO3Stats(url);
    } catch (err) {
      if (err.message === "AO3_MAINTENANCE") {
        throw err; // stop immediately, no retries
      }

      Logger.log(`⚠️ Fetch failed (attempt ${attempt}) for ${url}`);
    }
  }

  throw new Error(`FAILED_FETCH`);
}

function isAO3MaintenancePage(html) {
  const lower = html.toLowerCase();

  return (
    lower.includes("down for maintenance") ||
    lower.includes("maintenance") &&
    lower.includes("archiveofourown") ||
    lower.includes("/status")
  );
}

