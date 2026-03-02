function updateAO3Stats() {
  const WORKS = CONFIG.myWorks;
  const EMAIL = CONFIG.myEmail;
  const SHEET_NAME = CONFIG.myExcel;

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
  try {
    if (!sheet) {
      throw new Error ('Sheet not found: $(SHEET_NAME)')
    }

    const lastRow = sheet.getLastRow();
    const today = Utilities.formatDate(
      new Date(),                              // It defines the date format, ex. 14-Nov
      ss.getSpreadsheetTimeZone(),
      "dd-MMM"); 
    const workCount = WORKS.length


      // ─────────────────────────────────────────────
      // Read previous hits (last data row)
      // ─────────────────────────────────────────────

    let prevHits = {};
    let prevKudos = {};

    if (lastRow >= 3) {
      // HITS
      const prevHitsValues = sheet
        .getRange(lastRow, 2 + workCount * 2, 1, workCount)
        .getValues()[0];

      // KUDOS
      const prevKudoValues = sheet
        .getRange(lastRow, 2 + workCount * 3, 1, workCount)
        .getValues()[0];

      WORKS.forEach((work, i) => {
        prevHits[work.name] = Number(prevHitsValues[i] || 0);
        prevKudos[work.name] = Number(prevKudoValues[i] || 0);
      });
    }

    

    // ─────────────────────────────────────────────
    // Fetch AO3 stats (with retry + maintenance check)
    // ─────────────────────────────────────────────
    const hits = [];
    const hitsdelta = [];
    const kudos = [];
    const kudosdelta = [];
    const failedFetch = [];
    const failedFetchReason = {};
    

    for (const work of WORKS) {
      const stats = fetchAO3Stats(work.url);
    
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

      // 🚨 INVALID FETCH DETECTION
      if (stats.hits === 0 && prevHit !== 0) {
        failedFetch.push(work.name);
        failedFetchReason[work.name] = "Hits = 0 (propable fetch error 525)";
      }

      hits.push(stats.hits);
      kudos.push(stats.kudos);
      hitsdelta.push(hitsdiff);
      kudosdelta.push(kudosdiff);

      Logger.log(`${work.name}: hits delta (+${hitsdiff}), kudos delta (+${kudosdiff}), ${stats.hits} hits, ${stats.kudos} kudos`);
      Utilities.sleep(4500);
    }  
      // ─────────────────────────────────────────────
      // Append row ONLY if everything succeeded in your sheet’s structure: 
      // [Date, Hits Delta, Kudos Delta, Hits, Kudos]
      // ─────────────────────────────────────────────
    const newRow = [today].concat( 
      hitsdelta, 
      kudosdelta, 
      hits,
      kudos
      );

      sheet.appendRow(newRow);

      Logger.log("✅ Added new AO3 stats row");  

      if (failedFetch.length === WORKS.length) {
        MailApp.sendEmail(
          EMAIL,
          "K-Pop Demon Hunters - Full Fetch Failure",
          "The following works returned invalid stats (" + today + "):\n\n" +
          failedFetch.map(name => `• ${name}: ${failedFetchReason[name]}`).join("\n") +
          "\n\nStats were still logged to the sheet.\n\n" +
          "This is likely due to AO3 or Cloudflare issues."
        );
      }

      if (failedFetch.length > 0 && failedFetch.length < WORKS.length) {
        MailApp.sendEmail(
          EMAIL,
          "K-Pop Demon Hunters - Partial Fetch Failure",
          "The following works returned invalid stats (" + today + "):\n\n" +
          failedFetch.map(name => `• ${name}: ${failedFetchReason[name]}`).join("\n") +
          "\n\nStats were still logged to the sheet.\n\n" +
          "This is likely due to AO3 or Cloudflare issues."
        );
      }

      if (failedFetch.length === 0) {
        MailApp.sendEmail(
          EMAIL,
          "K-Pop Demon Hunters - Fetch Success",
          "The following was updated: n\n" + newRow
        );
      }

} catch (err) {

  // ────────────────────────────────────────────────────
  //    ───────────── AO3 Maintenance ─────────────
  // ────────────────────────────────────────────────────
    if (err.message === "AO3_MAINTENANCE") {
      MailApp.sendEmail(
        EMAIL,
        "AO3 Maintenance — Stats Not Updated",
        "AO3 is currently down for maintenance.\n\n" +
        "No stats were appended today to avoid invalid data.\n\n" +
        "Status page:\nhttps://archiveofourown.org/status"
      );

      Logger.log("🚧 AO3 maintenance detected — script exited safely");
      return;
    }

    // ───────────── Other fatal errors ─────────────
    MailApp.sendEmail(
      EMAIL,
      "AO3 Stats Script Error",
      `The AO3 stats script failed.\n\nError:\n${err.message}`
    );
  }
}
