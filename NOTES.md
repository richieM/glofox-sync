# Glofox Sync — Working Notes

## Status (2026-04-09)

**Blocked: waiting on ABC Fitness to fix API write permissions.**

GET requests work, POST to create leads returns `INVALID_USER_TYPE`. Email sent to apiactivation@abcfitness.com asking them to enable lead creation on our integrator account.

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
1. Get confirmation from ABC Fitness that write permissions are enabled
2. Test POST to create a lead (use Testy McTesterson / testy@test.com)
3. Paste script into Google Apps Script, run `install`
4. Verify with a real signup on the website
