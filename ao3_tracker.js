/**
 * AO3 → Google Sheets daily stats tracker
 */

const WORKS = [
  { name: "Glass", url: "https://archiveofourown.org/works/72406296" },
  { name: "Deal", url: "https://archiveofourown.org/works/61070437" },
  { name: "Heart", url: "https://archiveofourown.org/works/57913276" },
  { name: "Light", url: "https://archiveofourown.org/works/55810327"},
  { name: "Home", url: "https://archiveofourown.org/works/53755675"},
  { name: "Entanglement", url: "https://archiveofourown.org/works/48060295" },
  { name: "Little Bit", url: "https://archiveofourown.org/works/49061737" }
];

/**
 * Main entry point: fetch AO3 stats and append one new row
 */
function updateAO3Stats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Story Stats - AO3") || ss.getSheets()[0];
  const lastRow = sheet.getLastRow();
  const today = Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), "dd-MMM"); 

  // Read previous hits from the last data row (row 3+)
  let prevHits = {};
  if (lastRow >= 3) {
    const prevValues = sheet.getRange(lastRow, 2, 1, WORKS.length).getValues()[0];
    WORKS.forEach((work, i) => prevHits[work.name] = parseInt(prevValues[i] || 0));
  }

  const hits = [];
  const deltas = [];
  const kudos = [];

  for (const work of WORKS) {
    const stats = fetchAO3Stats(work.url);
    hits.push(stats.hits);
    kudos.push(stats.kudos);
    let diff = 0;
const prev = prevHits[work.name];

if (!prev || prev === 0) {
  // First recorded day or missing data
  diff = stats.hits;
} else {
  diff = stats.hits - prev;
}


    deltas.push(diff);
    Logger.log(`${work.name}: ${stats.hits} hits (+${diff}), ${stats.kudos} kudos`);
    Utilities.sleep(3000); // polite delay between requests
  }

  // Build row in your sheet’s structure: [Date, Hits..., Deltas..., Kudos...]
  const newRow = [today].concat(hits, deltas, kudos);
  sheet.appendRow(newRow);
  Logger.log("✅ Added new AO3 stats row");
}

/**
 * Fetch and parse AO3 stats for one work
 */
function fetchAO3Stats(url) {
  const response = UrlFetchApp.fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; AO3-Stats-Tracker/1.0; personal use)"
    },
    muteHttpExceptions: true
  });

  const html = response.getContentText();

  // Normalize whitespace
  const clean = html.replace(/\s+/g, " ");

  // Match numbers after "Hits:" and "Kudos:"
  const hitsMatch = clean.match(/<dt[^>]*>\s*Hits:\s*<\/dt>\s*<dd[^>]*>([\d,]+)/i);
  const kudosMatch = clean.match(/<dt[^>]*>\s*Kudos:\s*<\/dt>\s*<dd[^>]*>([\d,]+)/i);

  const hits = hitsMatch ? parseInt(hitsMatch[1].replace(/,/g, ""), 10) : 0;
  const kudos = kudosMatch ? parseInt(kudosMatch[1].replace(/,/g, ""), 10) : 0;

  return { hits, kudos };
}