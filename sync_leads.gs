// ============================================================
// Google Sheets → Glofox Lead Sync
//
// Setup:
// 1. Open your Google Sheet
// 2. Extensions → Apps Script
// 3. Paste this entire file
// 4. Fill in the 3 config values below
// 5. Run "install" from the function dropdown, authorize it
// 6. Done — it checks for new rows every 5 minutes
// ============================================================

// ── Config (fill these in) ──────────────────────────────────
var CONFIG = {
  GLOFOX_API_KEY:   "YOUR_API_KEY_HERE",       // see credentials_*.csv
  GLOFOX_API_TOKEN: "YOUR_API_TOKEN_HERE",     // see credentials_*.csv
  GLOFOX_BRANCH_ID: "YOUR_BRANCH_ID_HERE",     // Location ID from Glofox dashboard

  // Column positions (1-indexed) — adjust if your sheet layout differs
  COL_SUBMITTED_ON: 1,   // A
  COL_EMAIL:        2,   // B
  COL_NAME:         3,   // C
  COL_SYNCED:       4,   // D (we'll write to this column)

  HEADER_ROW: 1,
  MARKETING_SOURCE: "Landing Page",
  LEAD_STATUS: "LEAD"
};

// ── Install / Uninstall ─────────────────────────────────────

function install() {
  // Add "Synced" header if missing
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (sheet.getRange(CONFIG.HEADER_ROW, CONFIG.COL_SYNCED).getValue() === "") {
    sheet.getRange(CONFIG.HEADER_ROW, CONFIG.COL_SYNCED).setValue("Synced");
  }

  // Remove any existing triggers to avoid duplicates
  uninstall();

  // Create a 5-minute trigger
  ScriptApp.newTrigger("syncNewLeads")
    .timeBased()
    .everyMinutes(5)
    .create();

  Logger.log("Installed: syncing every 5 minutes.");
}

function uninstall() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "syncNewLeads") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  Logger.log("Uninstalled: all sync triggers removed.");
}

// ── Main sync function ──────────────────────────────────────

function syncNewLeads() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) {
    Logger.log("Another sync is running, skipping.");
    return;
  }

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var lastRow = sheet.getLastRow();

    if (lastRow <= CONFIG.HEADER_ROW) {
      Logger.log("No data rows found.");
      return;
    }

    var dataRange = sheet.getRange(
      CONFIG.HEADER_ROW + 1, 1,
      lastRow - CONFIG.HEADER_ROW, CONFIG.COL_SYNCED
    );
    var rows = dataRange.getValues();
    var synced = 0;
    var errors = 0;

    for (var i = 0; i < rows.length; i++) {
      var syncStatus = rows[i][CONFIG.COL_SYNCED - 1];
      if (syncStatus !== "") continue; // already synced

      var email = (rows[i][CONFIG.COL_EMAIL - 1] || "").toString().trim();
      var fullName = (rows[i][CONFIG.COL_NAME - 1] || "").toString().trim();

      if (email === "") continue; // skip blank rows

      var names = splitName(fullName);
      var rowNum = CONFIG.HEADER_ROW + 1 + i;

      try {
        createGlofoxLead(names.first, names.last, email);
        sheet.getRange(rowNum, CONFIG.COL_SYNCED).setValue(
          "✓ " + new Date().toLocaleString()
        );
        synced++;
      } catch (e) {
        sheet.getRange(rowNum, CONFIG.COL_SYNCED).setValue("ERROR: " + e.message);
        errors++;
        Logger.log("Row " + rowNum + " failed: " + e.message);
      }
    }

    Logger.log("Sync complete. Synced: " + synced + ", Errors: " + errors);
  } finally {
    lock.releaseLock();
  }
}

// ── Glofox API call ─────────────────────────────────────────

function createGlofoxLead(firstName, lastName, email) {
  // Use /2.0/register endpoint (recommended by Glofox support).
  // The older /2.1/branches/{id}/leads route is deprecated and returns
  // INVALID_USER_TYPE for integrator accounts.
  var url = "https://gf-api.aws.glofox.com/prod/2.0/register";

  var payload = {
    first_name: firstName,
    last_name: lastName,
    email: email,
    no_password: true,
    lead_status: CONFIG.LEAD_STATUS,
    leads: {
      marketing_source: CONFIG.MARKETING_SOURCE
    }
  };

  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      "x-glofox-api-token": CONFIG.GLOFOX_API_TOKEN,
      "x-api-key": CONFIG.GLOFOX_API_KEY,
      "x-glofox-branch-id": CONFIG.GLOFOX_BRANCH_ID
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(url, options);
  var code = response.getResponseCode();
  var body = response.getContentText();

  if (code === 200 || code === 201) {
    Logger.log("Created lead: " + email);
    return JSON.parse(body);
  }

  // If duplicate lead, treat as success
  if (code === 409 || (code === 400 && body.indexOf("already exists") > -1)) {
    Logger.log("Lead already exists: " + email);
    return { duplicate: true };
  }

  throw new Error("HTTP " + code + ": " + body);
}

// ── Name splitting ──────────────────────────────────────────

function splitName(fullName) {
  if (!fullName || fullName.trim() === "") {
    return { first: "Unknown", last: "Unknown" };
  }

  var parts = fullName.trim().split(/\s+/);

  if (parts.length === 1) {
    return { first: parts[0], last: "" };
  }

  var last = parts.pop();
  var first = parts.join(" ");
  return { first: first, last: last };
}

// ── Manual test (run this to test with one row) ─────────────

function testWithFirstRow() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var email = sheet.getRange(2, CONFIG.COL_EMAIL).getValue();
  var name = sheet.getRange(2, CONFIG.COL_NAME).getValue();
  var names = splitName(name);

  Logger.log("Would send: " + names.first + " " + names.last + " <" + email + ">");

  // Uncomment the line below to actually call the API:
  // var result = createGlofoxLead(names.first, names.last, email);
  // Logger.log(JSON.stringify(result));
}
