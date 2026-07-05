# HaulPlan — HOS Trip Planner & ELD Logs

Enter a trip (current location, pickup, dropoff, cycle hours used) and get back the full
picture: the driving route with every mandated stop placed on a map, and FMCSA daily log
sheets drawn for each day of the trip.

Built with Django + DRF on the backend and React + MUI + MapLibre on the frontend.

## How it works

The backend geocodes the three locations (Photon), fetches the route (OSRM), then runs the
trip through an HOS simulator (`backend/trips/hos/engine.py`) that enforces the
property-carrying rules:

| Rule | Behavior |
|---|---|
| 11h driving / shift | Driving stops, 10h reset inserted |
| 14h duty window | No driving past the 14th hour after coming on duty |
| 30min break | Required after 8h cumulative driving |
| 70h / 8-day cycle | Seeded from the "cycle used" input; 34h restart inserted when exhausted |
| Fueling | 30min on-duty stop every 1,000 miles |
| Pickup / dropoff | 1h on-duty each |

The simulator emits a contiguous list of duty-status segments. Those get split into
midnight-to-midnight days (each padded to exactly 24h), stop coordinates are interpolated
along the route polyline and reverse-geocoded for the remarks section, and the frontend
draws each day onto an SVG replica of the paper log grid.

External API responses are cached (Redis when available, in-memory otherwise) — repeat
trips don't re-hit the map services.

## Running locally

```bash
docker compose up
```

Backend on :8000, frontend on :5173, Redis wired up automatically.

Without Docker:

```bash
# backend
cd backend
pip install -r requirements.txt
python manage.py migrate && python manage.py runserver

# frontend
cd frontend
npm install && npm run dev
```

## Tests

The HOS engine has a compliance-checker test suite that replays generated schedules
against the raw FMCSA rules:

```bash
cd backend && python manage.py test trips
```

## Deployment

Both apps deploy to Vercel as separate projects:

- **backend/** — uses `@vercel/python` (see `backend/vercel.json`). Set the env vars from
  `backend/.env.example`; the database is Supabase Postgres (use the transaction pooler
  URL, port 6543, since the runtime is serverless).
- **frontend/** — standard Vite static build. Set `VITE_API_URL` to the backend URL.

## Assumptions

Beyond the assessment's stated assumptions (property-carrying, 70h/8day, no adverse
conditions), a few calls worth knowing about:

- **Cycle recovery**: the input is a single "hours used" number, so rolling 8-day
  recovery can't be computed — cycle hours only come back via a 34h restart.
- **Sleeper berth splits** are not scheduled; rests are logged as off duty and the
  sleeper berth row stays empty.
- **Single time base**: all times use one clock (the FMCSA "home terminal" standard);
  timezone crossings mid-trip are not modeled.
- Truck speed is taken from OSRM's car profile, so drive times are on the optimistic side.
