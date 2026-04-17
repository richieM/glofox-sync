# Glofox Sync

Google Sheets → Glofox lead sync for Prospect Park Yoga's mailing list.

## What this does

When someone signs up on the website, their info lands in a Google Sheet. This Apps Script runs every 5 minutes, picks up new rows, and creates a "lead" in Glofox (the CRM). Glofox then automatically triggers an email sequence to the new lead.

Replaces a paid Zapier integration with a free Google Apps Script.

## Setup (step by step)

1. Open the Google Sheet (the one connected to the website signup form)
2. For any existing rows you've already manually added to Glofox, type `manually` in column D so the script skips them
3. Click **Extensions → Apps Script**
4. Delete everything in the default `Code.gs` file
5. Paste the entire contents of `sync_leads.gs` (credentials are already filled in)
6. In the function dropdown at the top, select **`install`**
7. Click the **Run** button (▶️)
8. Google will ask to authorize — click through:
   - "Review permissions" → choose your account
   - "Google hasn't verified this app" → click "Advanced" → "Go to ... (unsafe)"
   - Click "Allow"
9. Done. Check the execution log — should say "Installed: syncing every 5 minutes."

## How it works

- Runs every 5 minutes automatically
- Checks for rows where column D ("Migrated") is empty
- Splits the Name field into first/last name
- POSTs to Glofox `/2.0/register` endpoint to create a lead
- On success: writes `✓ 4/15/2026 5:30:00 PM` in column D
- On failure: writes `ERROR: ...` in column D
- Duplicate leads (already in Glofox) are treated as success
- Any non-empty value in column D means "skip this row"

## Sheet columns

| A | B | C | D |
|---|---|---|---|
| Submitted On | Email Address | Name | Migrated (added by script) |

Column D values:
- Empty → will be synced on next run
- `✓ <timestamp>` → synced by script
- `ERROR: ...` → sync failed (check the error)
- `manually` → you handled this one yourself
- Any other text → skipped

## API details

- **Endpoint:** `POST https://gf-api.aws.glofox.com/prod/2.0/register`
- **Auth headers:** `x-api-key`, `x-glofox-api-token`, `x-glofox-branch-id`
- **Payload:** `{ first_name, last_name, email, no_password: true, lead_status: "LEAD", leads: { marketing_source: "Landing Page" } }`
- The older `/2.1/branches/{id}/leads` endpoint is deprecated and returns `INVALID_USER_TYPE`

## Testing

- Run `testWithFirstRow` in Apps Script to dry-run without calling the API
- Uncomment one line in that function to do a real test with row 2
- To test the full sync: add a fake row with a blank column D, wait 5 minutes

## To stop

Go to Extensions → Apps Script → select `uninstall` from the dropdown → Run

## Getting API credentials

Email **apiactivation@abcfitness.com** — request API Key, API Token, and Branch ID. Requires Elite plan.

## Files

- `sync_leads.gs` — the Apps Script (paste into Google Sheets)
- `NOTES.md` — API details, endpoint history, working curl commands
- `credentials_*.csv` — API credentials (gitignored)
