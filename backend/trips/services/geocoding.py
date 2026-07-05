from hashlib import md5

import requests
from django.core.cache import cache

PHOTON_URL = "https://photon.komoot.io/api"
NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse"
USER_AGENT = "driver-logs-trip-planner"
TIMEOUT = 10
GEOCODE_TTL = 60 * 60 * 24 * 30
REVERSE_TTL = 60 * 60 * 24 * 30

STATE_ABBREVIATIONS = {
    "Alabama": "AL", "Alaska": "AK", "Arizona": "AZ", "Arkansas": "AR",
    "California": "CA", "Colorado": "CO", "Connecticut": "CT", "Delaware": "DE",
    "Florida": "FL", "Georgia": "GA", "Hawaii": "HI", "Idaho": "ID",
    "Illinois": "IL", "Indiana": "IN", "Iowa": "IA", "Kansas": "KS",
    "Kentucky": "KY", "Louisiana": "LA", "Maine": "ME", "Maryland": "MD",
    "Massachusetts": "MA", "Michigan": "MI", "Minnesota": "MN", "Mississippi": "MS",
    "Missouri": "MO", "Montana": "MT", "Nebraska": "NE", "Nevada": "NV",
    "New Hampshire": "NH", "New Jersey": "NJ", "New Mexico": "NM", "New York": "NY",
    "North Carolina": "NC", "North Dakota": "ND", "Ohio": "OH", "Oklahoma": "OK",
    "Oregon": "OR", "Pennsylvania": "PA", "Rhode Island": "RI", "South Carolina": "SC",
    "South Dakota": "SD", "Tennessee": "TN", "Texas": "TX", "Utah": "UT",
    "Vermont": "VT", "Virginia": "VA", "Washington": "WA", "West Virginia": "WV",
    "Wisconsin": "WI", "Wyoming": "WY", "District of Columbia": "DC",
}


class GeocodingError(Exception):
    pass


def geocode(query: str) -> dict:
    cache_key = f"geocode:{md5(query.strip().lower().encode()).hexdigest()}"
    if cached := cache.get(cache_key):
        return cached

    response = requests.get(
        PHOTON_URL,
        params={"q": query, "limit": 5},
        headers={"User-Agent": USER_AGENT},
        timeout=TIMEOUT,
    )
    response.raise_for_status()
    features = response.json().get("features", [])
    if not features:
        raise GeocodingError(f"Could not find a location for '{query}'")

    # Prefer cities/towns over POIs so "Houston, TX" resolves to the city,
    # not the top-ranked landmark. Full addresses still fall through to [0].
    best = next(
        (f for f in features if f["properties"].get("osm_key") == "place"),
        features[0],
    )
    lon, lat = best["geometry"]["coordinates"]
    props = best["properties"]
    name_parts = [props.get("name") or props.get("city"), props.get("state"), props.get("country")]
    result = {
        "query": query,
        "name": ", ".join(p for p in name_parts if p),
        "lat": lat,
        "lon": lon,
    }
    cache.set(cache_key, result, GEOCODE_TTL)
    return result


def reverse_geocode(lat: float, lon: float) -> str:
    cache_key = f"revgeo:{lat:.2f}_{lon:.2f}"
    if cached := cache.get(cache_key):
        return cached

    try:
        response = requests.get(
            NOMINATIM_REVERSE_URL,
            params={"lat": lat, "lon": lon, "format": "json", "zoom": 10},
            headers={"User-Agent": USER_AGENT},
            timeout=TIMEOUT,
        )
        response.raise_for_status()
        address = response.json().get("address", {})
    except requests.RequestException:
        return f"{lat:.3f}, {lon:.3f}"

    place = (
        address.get("city")
        or address.get("town")
        or address.get("village")
        or address.get("hamlet")
        or address.get("county")
    )
    state = address.get("state", "")
    state = STATE_ABBREVIATIONS.get(state, state)

    label = ", ".join(p for p in [place, state] if p) or f"{lat:.3f}, {lon:.3f}"
    cache.set(cache_key, label, REVERSE_TTL)
    return label
