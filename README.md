# Glofox Sync

Google Sheets → Glofox lead sync for the yoga studio mailing list.

## What this does

When someone signs up on the website, their info lands in a Google Sheet. This Apps Script runs every 5 minutes, picks up new rows, and creates a "lead" in Glofox (our CRM). Glofox then automatically triggers an email sequence to the new lead.

Replaces a paid Zapier integration with a free Google Apps Script.

## Setup

1. Open the Google Sheet (the one connected to the website signup form)
2. Extensions → Apps Script
3. Paste the contents of `sync_leads.gs`
4. Fill in `GLOFOX_API_KEY`, `GLOFOX_API_TOKEN`, and `GLOFOX_BRANCH_ID` at the top
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

## Sheet columns

| A | B | C | D |
|---|---|---|---|
| Submitted On | Email | Name | Synced (added by script) |

## Testing

Run `testWithFirstRow` in Apps Script to dry-run without calling the API. Uncomment one line in that function to do a real test.
