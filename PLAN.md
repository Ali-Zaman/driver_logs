# Trip Planner + ELD Log Generator — Build Plan

Spotter AI full-stack assessment: Django + React app that takes trip details and produces
route instructions (on a map) plus FMCSA-compliant driver daily log sheets, drawn like the
paper form.

## Product in one paragraph

A dispatcher/driver enters **current location, pickup location, dropoff location, and hours
already used in the 70-hr/8-day cycle**. The app geocodes the locations, fetches the real
driving route, then runs an **HOS (Hours of Service) scheduling engine** that simulates the
trip hour-by-hour — inserting the 1-hr pickup and dropoff, fuel stops every 1,000 miles,
30-minute breaks, 10-hour overnight resets, and (if the cycle runs out) a 34-hour restart.
Output: an interactive map with every stop annotated, a day-by-day schedule, and one
FMCSA-style daily log sheet per calendar day with the duty-status graph drawn on it.

## HOS rules implemented (property-carrying, 70hr/8day)

| Rule | Behavior in the engine |
|---|---|
| 11-hr driving limit | Max 11 hrs driving per shift |
| 14-hr driving window | No driving past 14 hrs after shift start; breaks do NOT pause it |
| 30-min break | Required after 8 cumulative hrs of driving; break stops the 8-hr counter, not the 14-hr window |
| 10-hr off duty | Fully resets the 11-hr and 14-hr clocks |
| 70-hr/8-day cycle | Rolling on-duty total, seeded from the "current cycle used" input; no driving once hit |
| 34-hr restart | Inserted automatically when remaining cycle hours block further driving |
| Pickup / dropoff | 1 hr each, logged On Duty (Not Driving) |
| Fueling | Every ≤1,000 mi, 30 min On Duty (Not Driving) |

Out of scope (state on the log/README as assumptions): sleeper-berth split pairs, adverse
driving conditions, short-haul exceptions, multi-timezone handling (all times in trip-origin
time, matching "use time standard of home terminal").

## Architecture

```
repo/
├── backend/            Django + DRF
│   ├── config/         settings split (base/dev/prod), CORS, whitenoise
│   ├── trips/          models, serializers, views
│   │   ├── services/   geocoding.py, routing.py (external APIs + caching)
│   │   └── hos/        engine.py — PURE python scheduler + unit tests
│   └── Dockerfile
├── frontend/           React (Vite) + MUI + MapLibre GL
│   ├── src/theme/      custom MUI theme
│   ├── src/features/trip-form/
│   ├── src/features/route-map/
│   ├── src/features/schedule/     day timeline / stepper
│   └── src/features/eld-log/      SVG log sheet renderer
├── docker-compose.yml  one-command local dev (backend + frontend + redis)
└── vercel.json         deploy config
```

### Backend (Django + DRF)
- **Model**: `Trip` (locations as text + lat/lng, cycle_used_hrs, uuid for shareable link)
  + computed `plan` stored as JSON. POST `/api/trips/` computes and persists; GET
  `/api/trips/{uuid}/` re-renders — gives us shareable result links.
- **HOS engine** as a pure, framework-free module with unit tests (accuracy is the graded
  criterion — tests are the proof). Event-loop simulation over the route: consume driving
  time against all clocks simultaneously, emit `DutySegment(status, start, end, location,
  remark)` list, then split into calendar days.
- **External services**: geocoding via Nominatim/Photon (free, no key), routing via OSRM
  public server (free, no key; OpenRouteService as env-swappable fallback). Fuel/rest stop
  coordinates found by interpolating along the route polyline at the right mile marks.
- **Caching** (JD checkbox): cache geocode + route responses (Django cache; Redis in
  docker-compose, falls back to locmem/db cache on Vercel).

### Frontend (React + Vite + MUI — JD priority)
- Custom MUI theme, logistics aesthetic — NOT default MUI blue. Distinctive typography,
  consistent spacing, dark-mode-friendly map style.
- **Input**: 3 location fields with free autocomplete (Photon), cycle-hours input, big CTA.
- **Results dashboard**:
  - MapLibre GL map, free vector tiles, route line + custom markers per stop type
    (start / pickup / dropoff / fuel / 30-min break / 10-hr rest / 34-hr restart) with popovers.
  - Summary cards: total distance, driving hours, calendar days, # stops.
  - Vertical timeline of the full schedule.
  - **ELD log sheets**: SVG component replicating the FMCSA form — header fields, 24-hr
    grid with 4 status rows, step-line duty graph with vertical transitions, per-status
    total hours column, remarks with city/state at each duty change. One sheet per day
    (tabs or stacked), print/PDF-friendly.
- Skeleton loaders, graceful API-error states, mobile responsive.

### Deploy
- **Frontend** → Vercel (static Vite build).
- **Backend** → Vercel Python runtime (Django as a serverless function; DB on Supabase
  Postgres via the transaction pooler since Vercel FS is ephemeral). docker-compose
  remains the local dev story (JD checkbox).

## Milestones

1. **Scaffold**: restructure repo into backend/frontend, DRF + CORS, Vite + MUI + theme, docker-compose. App boots end to end with a stub plan.
2. **HOS engine + tests**: the core. Unit tests for: short trip (1 day), trip forcing 30-min break, multi-day with 10-hr resets, low remaining cycle forcing 34-hr restart, fuel stop insertion.
3. **Route services**: geocoding, routing, polyline interpolation for stop placement, caching.
4. **API**: serializers, create/retrieve endpoints, wire frontend form → results.
5. **Map + schedule UI**: MapLibre route + markers, summary cards, timeline.
6. **ELD log SVG renderer**: the visual centerpiece; verify against the sample log on guide p.18–19 (Richmond→Newark example).
7. **Polish**: theme pass, transitions, empty/loading/error states, responsive, print styles, shareable links.
8. **Ship**: deploy both, README (architecture + assumptions), seed a demo trip, record Loom (walk through: inputs → map → logs → engine code → tests).

## Reference facts (from FMCSA guide)

- Grid rows in order: Off Duty, Sleeper Berth, Driving, On Duty (Not Driving); totals must sum to 24.
- Remarks must list city + state abbreviation at every duty-status change.
- Sample completed log (p.19): 350 mi Richmond VA → Newark NJ, totals 10 / 1.75 / 7.75 / 4.5 = 24 — use as the visual/logic reference for the renderer.
- Header fields: date, total miles driving today, carrier name, main office address, vehicle numbers, shipping doc/manifest no., driver signature, co-driver, total hours.
