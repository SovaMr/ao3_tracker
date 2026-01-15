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
  { name: "Void", url: "https://archiveofourown.org/works/77684251"},
  { name: "Glowing", url: "https://archiveofourown.org/works/77444221" },
  { name: "No Lying", url: "https://archiveofourown.org/works/77164386"},
  { name: "Little Bit", url: "https://archiveofourown.org/works/49061737" }
];

/**
 * Main function: fetch AO3 stats and append one new row, and apply defined conditional formatting
 */
function updateAO3Stats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Story Stats - AO3") || ss.getSheets()[0];
  const lastRow = sheet.getLastRow();
  const today = Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), "dd-MMM"); // It defines the date format, ex. 14-Nov
  const numberOfWorks = WORKS.length

  // Read previous hits from the last data row (row 3+)
  let prevHits = {};
  if (lastRow >= 3) {
    const prevHitsValues = sheet.getRange(lastRow, 2 + numberOfWorks * 2, 1, numberOfWorks).getValues()[0];
    WORKS.forEach((work, i) => prevHits[work.name] = parseInt(prevHitsValues[i] || 0, 10));
  }

  // Read previous kudos from the last data row (row 3+)
  let prevKudos = {};
  if (lastRow >= 3) {
    const prevKudoValues = sheet.getRange(lastRow, 2 + numberOfWorks * 3, 1, numberOfWorks).getValues()[0];
    WORKS.forEach((work, i) => prevKudos[work.name] = parseInt(prevKudoValues[i] || 0, 10));
  }

  const hits = [];
  const hitsdelta = [];
  const kudos = [];
  const kudosdelta = [];

  for (const work of WORKS) {
    const stats = fetchAO3Stats(work.url);
    hits.push(stats.hits);
    kudos.push(stats.kudos);
    let hitsdiff = 0;
    let kudosdiff = 0;

    // --- HIT DELTA ---
const prevHit = prevHits[work.name];

if (!prevHit || prevHit === 0) {
  // First recorded day or missing data
  hitsdiff = stats.hits;
} else {
  hitsdiff = stats.hits - prevHit;
}

    // --- KUDOS DELTA ---
const prevKudo = prevKudos[work.name];

if (!prevKudo || prevKudo === 0) {
  // First recorded day or missing data
  kudosdiff = stats.kudos;
} else {
  kudosdiff = stats.kudos - prevKudo;
}


    hitsdelta.push(hitsdiff);
    kudosdelta.push(kudosdiff);
    Logger.log(`${work.name}: hits delta (+${hitsdiff}), kudos delta (+${kudosdiff}), ${stats.hits} hits, ${stats.kudos} kudos`);

  }

  // Build row in your sheet’s structure: [Date, Hits Delta, Kudos Delta, Hits, Kudos]
  const newRow = [today].concat( 
    hitsdelta, 
    kudosdelta, 
    hits,
    kudos);

  sheet.appendRow(newRow);
  Logger.log("✅ Added new AO3 stats row");

  // Apply conditional formatting AFTER data is written
  applyConditionalFormatting();
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

function applyConditionalFormatting() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Story Stats - AO3") || ss.getSheets()[0];

  if (!sheet) {
    throw new Error("Sheet not found for conditional formatting");
  }

  const rules = sheet.getConditionalFormatRules();
  const storyCount = WORKS.length;
  const currentRow = sheet.getLastRow();

  const hitDeltaRange = sheet.getRange(
    currentRow, 
    2,
    1,
    storyCount 
    );

  const kudosDeltaRange = sheet.getRange(
    currentRow,
    2 + storyCount,
    1,
    storyCount
    );

// --- CONDITIONAL FORMATTING FOR HITS --- 
  // Positive delta → fuchsia
  const positiveHitRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberGreaterThan(200)
    .setBackground("#FF0BF8")
    .setRanges([hitDeltaRange])
    .build();

  // Medium delta → yellow
  const medHitRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberBetween(100,199)
    .setBackground("#FBBC04")
    .setRanges([hitDeltaRange])
    .build();

  // Minimum delta → green
  const minHitRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberBetween(50,99)
    .setBackground("#34A853")
    .setRanges([hitDeltaRange])
    .build();

// Low delta → violet
  const zeroHitRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberBetween(25,49)
    .setBackground("#8E7CBF")
    .setRanges([hitDeltaRange])
    .build();

// --- CONDITIONAL FORMATTING FOR KUDOS --- 
  // Positive delta → fuchsia
  const positiveKudoRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberGreaterThan(20)
    .setBackground("#FF0BF8")
    .setRanges([kudosDeltaRange])
    .build();

  // Medium delta → yellow
  const medKudoRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberBetween(10,19)
    .setBackground("#FBBC04")
    .setRanges([kudosDeltaRange])
    .build();

  // Minimum delta → green
  const minKudoRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberBetween(2,9)
    .setBackground("#34A853")
    .setRanges([kudosDeltaRange])
    .build();

// Low delta → violet
  const zeroKudoRule = SpreadsheetApp.newConditionalFormatRule()
    .whenNumberEqualTo(1)
    .setBackground("#8E7CBF")
    .setRanges([kudosDeltaRange])
    .build();

  sheet.setConditionalFormatRules([
    ...rules,
    positiveHitRule,
    medHitRule,
    minHitRule,
    zeroHitRule,
    positiveKudoRule,
    medKudoRule,
    minKudoRule,
    zeroKudoRule
  ]);
}
