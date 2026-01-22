function applyConditionalFormatting() {
  const WORKS = CONFIG.myWorks;
  const SHEET_NAME = CONFIG.myExcel;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];

  if (!sheet) {
    throw new Error("No sheet found for conditional formatting");
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


// ───────────────────────────────────────
// --- CONDITIONAL FORMATTING FOR HITS ---
// ─────────────────────────────────────── 

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

//───────────────────────────────────────
// --- CONDITIONAL FORMATTING FOR KUDOS --- 
//───────────────────────────────────────

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
