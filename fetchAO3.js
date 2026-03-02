function fetchAO3Stats(url) {
  const response = UrlFetchApp.fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; AO3-Stats-Tracker/1.0; personal use)"
    },
    muteHttpExceptions: true
  });

  const html = response.getContentText();

  
    // ────────────────────────
    // 🚨 MAINTENANCE CHECK
    // ────────────────────────
  if (isAO3MaintenancePage(html)) {
    throw new Error("AO3_MAINTENANCE");
  }

  // ────────────────────────
  // 📦 Extract stats block
  // ────────────────────────
  const statsBlockMatch = html.match(
    /<dl\s+class=["']stats["'][^>]*>([\s\S]*?)<\/dl>/i
  );

  if (!statsBlockMatch) {
    // Page loaded but stats are missing (throttle, partial load, etc.)
    return { hits: 0, kudos: 0 };
  }

  const statsBlock = statsBlockMatch[1];


  // Normalize whitespace
  //const clean = html.replace(/\s+/g, " ");

  // Match numbers after "Hits:" and "Kudos:"
  const hitsMatch = statsBlock.match(/<dd\s+class=["']hits["'][^>]*>([\s\S]*?)<\/dd>/i);
  const kudosMatch = statsBlock.match(/<dd\s+class=["']kudos["'][^>]*>([\s\S]*?)<\/dd>/i);

  const hits = hitsMatch ? parseInt(hitsMatch[1].replace(/,/g, ""), 10) : 0;
  const kudos = kudosMatch ? parseInt(kudosMatch[1].replace(/,/g, ""), 10) : 0;

  return { hits, kudos };
}

  // ────────────────────────────────────────────────────
  // ─────────── IF HITS AND KUDOS ARE NULL ─────────────
  // ────────────────────────────────────────────────────
function isAO3MaintenancePage(html) {
  const lower = html.toLowerCase();

  return (
    lower.includes("down for maintenance") ||
    lower.includes("maintenance") &&
    lower.includes("archiveofourown") ||
    lower.includes("/status")
  );
}

function fetchAO3StatsSafe(work) {
  try {
    const stats = fetchAO3Stats(work.url);

    if (stats.hits === 0 && stats.kudos === 0) {
      return {
        work,
        status: "INVALID_ZERO_STATS"
      };
    }

    return {
      work,
      status: "OK",
      stats
    };

  } catch (err) {
    if (err.message === "AO3_MAINTENANCE") {
      throw err; // global fatal
    }

    return {
      work,
      status: "FAILED",
      error: err.message
    };
  }
}
