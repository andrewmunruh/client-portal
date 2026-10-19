# client-portal

Static, click-through prototype of a client portal. No backend; all data in `data.js` is fake example data.

## Run locally
    python3 -m http.server 8000
Then open http://localhost:8000/ (deep links like `?role=admin` work).

`screens/` holds screenshots; `shoot.py` regenerates them.

## Checks
    /workspace/.pwvenv/bin/python tests/check_portal.py
Playwright checks (exit 0 = pass): counts match across Dashboard, Weekly summary and Pilot for every tenant, no "Colby" in the Avery demo, no $ on client/demo screens, client-role limits (suggest a change, baseline confirm only, Andy's setup steps read-only), plus the polish items (touch targets, 16px fields, Esc, Undo, example-data banner).

## Data and roles
- All counts derive from each tenant's `leads` in `data.js` (`stats()` in `app.js`); there are no separate count fields.
- Client vs. Andy permissions live in `POLICY` at the top of `app.js`.

## Client-only copies
    node scripts/build_client.js colby
Builds a static copy for one tenant into `c/<slug>/` (slug kept in `scripts/clients.json`). It contains only that tenant's client-safe data plus `app.js`/`extras.js`; `admin.js` (admin views, role switcher, tenant picker, demo mode, revenue tile) is not copied, so `?role=`/`?tenant=` do nothing there. Rebuild after any change to `data.js`, `app.js`, `extras.js` or `styles.css`; `tests/check_portal.py` fails if the committed copy is stale or leaks admin code or other tenants.
Note: the repo is public, so the slug is not a secret.
