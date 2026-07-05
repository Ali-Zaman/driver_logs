from datetime import datetime, timedelta, timezone

from trips.hos.engine import DRIVING, HosScheduler, Leg
from trips.hos.logbook import build_daily_logs

from .geocoding import geocode, reverse_geocode
from .routing import get_route, point_at_fraction

STOP_TYPES = {
    "Pickup": "pickup",
    "Dropoff": "dropoff",
    "Fuel": "fuel",
    "30 min break": "break",
    "10 hr reset": "rest",
    "34 hr restart": "restart",
}


def build_plan(
    current_location: str,
    pickup_location: str,
    dropoff_location: str,
    cycle_used_hours: float,
    start_time: datetime | None = None,
) -> dict:
    current = geocode(current_location)
    pickup = geocode(pickup_location)
    dropoff = geocode(dropoff_location)

    to_pickup = get_route(current, pickup)
    to_dropoff = get_route(pickup, dropoff)

    start = start_time or _next_quarter_hour(datetime.now(timezone.utc).replace(tzinfo=None))
    scheduler = HosScheduler(start, cycle_used_hours)
    segments = scheduler.plan_trip(
        Leg(to_pickup["distance_miles"], to_pickup["duration_hours"]),
        Leg(to_dropoff["distance_miles"], to_dropoff["duration_hours"]),
    )
    logs = build_daily_logs(segments, cycle_used_hours)

    geometry = to_pickup["geometry"] + to_dropoff["geometry"]
    total_miles = to_pickup["distance_miles"] + to_dropoff["distance_miles"]
    stops = _build_stops(segments, geometry, total_miles, current, pickup, dropoff)
    _attach_remarks(logs, stops, segments[0].start)

    return {
        "summary": {
            "total_miles": round(total_miles, 1),
            "driving_hours": round(sum(s.hours for s in segments if s.status == DRIVING), 2),
            "trip_hours": round((segments[-1].end - segments[0].start).total_seconds() / 3600, 2),
            "starts_at": segments[0].start.isoformat(),
            "ends_at": segments[-1].end.isoformat(),
            "days": len(logs),
        },
        "markers": {"current": current, "pickup": pickup, "dropoff": dropoff},
        "route": {"geometry": geometry},
        "stops": stops,
        "segments": [
            {
                "status": s.status,
                "label": s.label,
                "start": s.start.isoformat(),
                "end": s.end.isoformat(),
                "miles": round(s.miles, 1),
            }
            for s in segments
        ],
        "logs": logs,
    }


def _build_stops(segments, geometry, total_miles, current, pickup, dropoff) -> list[dict]:
    known_points = {
        "Pickup": pickup,
        "Dropoff": dropoff,
    }
    stops = [{
        "type": "start",
        "label": "Trip start",
        "location": current["name"],
        "lat": current["lat"],
        "lon": current["lon"],
        "start": segments[0].start.isoformat(),
        "end": segments[0].start.isoformat(),
        "duration_hours": 0,
        "trip_miles": 0,
    }]

    for seg in segments:
        if seg.status == DRIVING:
            continue
        if point := known_points.get(seg.label):
            lat, lon, location = point["lat"], point["lon"], point["name"]
        else:
            lat, lon = point_at_fraction(geometry, seg.start_miles / total_miles)
            location = reverse_geocode(lat, lon)
        stops.append({
            "type": STOP_TYPES.get(seg.label, "stop"),
            "label": seg.label,
            "location": location,
            "lat": lat,
            "lon": lon,
            "start": seg.start.isoformat(),
            "end": seg.end.isoformat(),
            "duration_hours": round(seg.hours, 2),
            "trip_miles": round(seg.start_miles, 1),
        })
    return stops


def _attach_remarks(logs, stops, trip_start):
    by_date = {log["date"]: log for log in logs}
    for log in logs:
        log["remarks"] = []

    for stop in stops:
        started = datetime.fromisoformat(stop["start"])
        if log := by_date.get(started.date().isoformat()):
            hour = started.hour + started.minute / 60
            log["remarks"].append({"hour": round(hour, 2), "text": f"{stop['label']} — {stop['location']}"})


def _next_quarter_hour(moment: datetime) -> datetime:
    moment = moment.replace(second=0, microsecond=0)
    return moment + timedelta(minutes=15 - moment.minute % 15)
