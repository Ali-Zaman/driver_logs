from math import asin, cos, radians, sin, sqrt

import requests
from django.core.cache import cache

OSRM_URL = "https://router.project-osrm.org/route/v1/driving"
TIMEOUT = 15
ROUTE_TTL = 60 * 60 * 24
METERS_PER_MILE = 1609.344
MAX_GEOMETRY_POINTS = 1500


class RoutingError(Exception):
    pass


def get_route(origin: dict, destination: dict) -> dict:
    """Returns distance, duration and geometry ([lon, lat] pairs) between two
    geocoded points, using the public OSRM server."""
    cache_key = (
        f"route:{origin['lat']:.4f}_{origin['lon']:.4f}"
        f"_{destination['lat']:.4f}_{destination['lon']:.4f}"
    )
    if cached := cache.get(cache_key):
        return cached

    coords = f"{origin['lon']},{origin['lat']};{destination['lon']},{destination['lat']}"
    response = requests.get(
        f"{OSRM_URL}/{coords}",
        params={"overview": "full", "geometries": "geojson"},
        timeout=TIMEOUT,
    )
    response.raise_for_status()
    data = response.json()
    if data.get("code") != "Ok" or not data.get("routes"):
        raise RoutingError(
            f"No drivable route found between {origin['name']} and {destination['name']}"
        )

    route = data["routes"][0]
    result = {
        "distance_miles": route["distance"] / METERS_PER_MILE,
        "duration_hours": route["duration"] / 3600,
        "geometry": _decimate(route["geometry"]["coordinates"]),
    }
    cache.set(cache_key, result, ROUTE_TTL)
    return result


def point_at_fraction(geometry: list, fraction: float) -> tuple[float, float]:
    """Interpolates a (lat, lon) point at a fraction of the route's length.
    Working in fractions rather than absolute miles keeps stop placement
    accurate even though the polyline is simplified."""
    cumulative = _cumulative_miles(geometry)
    target = max(0.0, min(1.0, fraction)) * cumulative[-1]

    for i in range(1, len(cumulative)):
        if cumulative[i] >= target:
            span = cumulative[i] - cumulative[i - 1]
            t = (target - cumulative[i - 1]) / span if span else 0.0
            lon = geometry[i - 1][0] + t * (geometry[i][0] - geometry[i - 1][0])
            lat = geometry[i - 1][1] + t * (geometry[i][1] - geometry[i - 1][1])
            return lat, lon

    return geometry[-1][1], geometry[-1][0]


def _cumulative_miles(geometry: list) -> list[float]:
    cumulative = [0.0]
    for (lon1, lat1), (lon2, lat2) in zip(geometry, geometry[1:]):
        cumulative.append(cumulative[-1] + _haversine_miles(lat1, lon1, lat2, lon2))
    return cumulative


def _haversine_miles(lat1, lon1, lat2, lon2) -> float:
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    a = sin((lat2 - lat1) / 2) ** 2 + cos(lat1) * cos(lat2) * sin((lon2 - lon1) / 2) ** 2
    return 3958.8 * 2 * asin(sqrt(a))


def _decimate(geometry: list) -> list:
    if len(geometry) <= MAX_GEOMETRY_POINTS:
        return geometry
    stride = len(geometry) // MAX_GEOMETRY_POINTS + 1
    return geometry[::stride] + [geometry[-1]]
