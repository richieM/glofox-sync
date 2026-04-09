# Glofox Sync

Google Sheets → Glofox lead sync for Prospect Park Yoga's mailing list.

## What this does

When someone signs up on the website, their info lands in a Google Sheet. This Apps Script runs every 5 minutes, picks up new rows, and creates a "lead" in Glofox (our CRM). Glofox then automatically triggers an email sequence to the new lead.

Replaces a paid Zapier integration with a free Google Apps Script.

## Setup

1. Open the Google Sheet (the one connected to the website signup form)
2. Extensions → Apps Script
3. Paste the contents of `sync_leads.gs`
4. Credentials are already filled in (see `credentials_*.csv` for raw values)
5. Select `install` from the function dropdown → Run → authorize
6. Done. Runs every 5 minutes automatically.

## Getting API credentials

Email **apiactivation@abcfitness.com** — request API Key, API Token, and Branch ID. Requires Elite plan (which we have).

## How it works

- Checks for rows where column D ("Synced") is empty
- Splits the Name field: everything before the last space = first name, last word = last name
- POSTs to `https://gf-api.aws.glofox.com/prod/2.1/branches/{BRANCH_ID}/leads`
- Marks the row with a timestamp on success, or "ERROR: ..." on failure
- Duplicate leads (already in Glofox) are treated as success
- Uses a lock to prevent double-processing from overlapping triggers

## Sheet columns

| A | B | C | D |
|---|---|---|---|
| Submitted On | Email | Name | Synced (added by script) |

## Testing

Run `testWithFirstRow` in Apps Script to dry-run without calling the API. Uncomment one line in that function to do a real test.

## Files

- `sync_leads.gs` — the Apps Script to paste into Google Sheets
- `NOTES.md` — API details, working curl commands, status enums, and current blockers
- `credentials_*.csv` — API credentials (gitignored)
