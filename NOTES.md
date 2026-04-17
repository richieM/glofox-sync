# Glofox Sync — Working Notes

## Status (2026-04-15)

**Unblocked.** The `INVALID_USER_TYPE` error was NOT a permissions issue — we were using the deprecated `/2.1/branches/{id}/leads` endpoint. Glofox support (Ola) confirmed the correct endpoint is `POST /2.0/register` with `no_password: true` and `leads: { marketing_source: "..." }` nested structure. Script updated.

## API Details

### Credentials
- Stored in `credentials_20260409_133415.csv` (gitignored)
- Integrator name: "Prospect Park Yoga - LIVE"
- Contact: apiactivation@abcfitness.com

### Endpoints

**Base URL:** `https://gf-api.aws.glofox.com/prod/2.1`

**Create lead (what we need):**
```
POST /branches/693363a49d4d6475b8021c15/leads

Headers:
  x-glofox-api-token: <token>
  x-api-key: <key>
  x-glofox-branch-id: 693363a49d4d6475b8021c15
  Content-Type: application/json

Body:
{
  "first_name": "Test",
  "last_name": "User",
  "email": "test@test.com",
  "marketing_source": "Landing Page",
  "lead_status": "LEAD"
}
```

**List leads (confirmed working):**
```
GET /branches/693363a49d4d6475b8021c15/leads?page=1
(same headers, returns paginated results)
```

### Auth Headers (learned the hard way)
- Token goes in `x-glofox-api-token` (NOT `Authorization: Bearer`)
- API key goes in `x-api-key`
- Branch ID goes in `x-glofox-branch-id` AND in the URL path

### Valid Lead Statuses
Discovered via browser dev tools — the dashboard calls `/2.3/branches/{id}/leads/lead-statuses`:
| Value | Key |
|-------|-----|
| LEAD | STATUS_TK_LEAD |
| COLD | STATUS_TK_COLD |
| TOUR | STATUS_TK_TOUR |
| NO_SALE_TOUR | STATUS_TK_NO_SALE_TOUR |
| TRIAL | STATUS_TK_TRIAL |
| NO_SALE_TRIAL | STATUS_TK_NO_SALE_TRIAL |
| MEMBER | STATUS_TK_MEMBER |

### Valid Marketing Sources
From the Glofox dashboard:
- Contact Us Form
- Facebook Ads
- Google Ads
- Instagram Ads
- Landing Page
- Other
- TikTok Ads

### API Quirks
- The dashboard uses `app.glofox.com` with v2.3 paths, but the public API gateway is `gf-api.aws.glofox.com` with v2.1
- There's also a `horus.glofox.com` service for lead filtering/metadata (used by dashboard only)
- The API docs portal (`apidocs-plat.aws.glofox.com`) requires separate access — we don't have it
- Lead status and marketing source accept specific enum values, not free text

## Architecture

```
Website signup form
       ↓
  Google Sheet (columns: Submitted On, Email, Name)
       ↓
  Google Apps Script (every 5 min, sync_leads.gs)
       ↓
  Glofox API → creates lead → triggers email sequence
```

## Next Steps
1. ~~Get confirmation from ABC Fitness that write permissions are enabled~~ ✅ Resolved — was using wrong endpoint
2. Test POST to /2.0/register with a test lead
3. Paste updated script into Google Apps Script, run `install`
4. Verify with a real signup on the website

## Endpoint Change (2026-04-15)
Old (deprecated, returns INVALID_USER_TYPE):
```
POST /2.1/branches/{id}/leads
```

New (recommended by Glofox support):
```
POST /2.0/register
Headers: x-glofox-branch-id: {branch_id}

Body:
{
  "first_name": "Test",
  "last_name": "User",
  "email": "test@test.com",
  "no_password": true,
  "lead_status": "LEAD",
  "leads": {
    "marketing_source": "Landing Page"
  }
}
```
Note: `no_password: true` is required since these are leads, not full member signups.
