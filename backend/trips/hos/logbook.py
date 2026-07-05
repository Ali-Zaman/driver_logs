"""Splits a trip's duty segments into per-day log sheets.

Each sheet covers a full midnight-to-midnight day, padded with off-duty
time before the trip starts and after it ends, so status totals always
sum to 24 hours. Miles for segments crossing midnight are prorated.
"""

from datetime import datetime, time, timedelta

from .engine import (
    CYCLE_LIMIT_HOURS,
    DRIVING,
    OFF_DUTY,
    ON_DUTY,
    RESTART_HOURS,
    SLEEPER_BERTH,
    Segment,
)


def build_daily_logs(segments: list[Segment], cycle_used: float = 0.0) -> list[dict]:
    if not segments:
        return []

    logs = []
    day_start = datetime.combine(segments[0].start.date(), time.min)
    trip_end = segments[-1].end

    while day_start < trip_end:
        day_end = day_start + timedelta(days=1)
        entries = _pad_off_duty(_clip_day(segments, day_start, day_end))

        totals = {OFF_DUTY: 0.0, SLEEPER_BERTH: 0.0, DRIVING: 0.0, ON_DUTY: 0.0}
        for entry in entries:
            totals[entry["status"]] += entry["end_hour"] - entry["start_hour"]

        cycle_at_day_end = _cycle_at(segments, day_end, cycle_used)
        logs.append({
            "date": day_start.date().isoformat(),
            "entries": entries,
            "totals": {status: round(hours, 2) for status, hours in totals.items()},
            "miles": round(sum(e["miles"] for e in entries), 1),
            "recap": {
                "on_duty_today": round(totals[DRIVING] + totals[ON_DUTY], 2),
                "cycle_used": round(cycle_at_day_end, 2),
                "cycle_available": round(max(0.0, CYCLE_LIMIT_HOURS - cycle_at_day_end), 2),
            },
        })
        day_start = day_end

    return logs


def _cycle_at(segments: list[Segment], moment: datetime, seed: float) -> float:
    cycle = seed
    for seg in segments:
        if seg.start >= moment:
            break
        if seg.status == OFF_DUTY:
            if seg.hours >= RESTART_HOURS and seg.end <= moment:
                cycle = 0.0
        else:
            end = min(seg.end, moment)
            cycle += (end - seg.start).total_seconds() / 3600
    return cycle


def _clip_day(segments: list[Segment], day_start: datetime, day_end: datetime) -> list[dict]:
    entries = []
    for seg in segments:
        start = max(seg.start, day_start)
        end = min(seg.end, day_end)
        if start >= end:
            continue
        fraction = (end - start).total_seconds() / (seg.end - seg.start).total_seconds()
        entries.append({
            "status": seg.status,
            "label": seg.label,
            "start_hour": _hour_of_day(start, day_start),
            "end_hour": _hour_of_day(end, day_start),
            "miles": round(seg.miles * fraction, 1),
        })
    return entries


def _pad_off_duty(entries: list[dict]) -> list[dict]:
    padded = []
    cursor = 0.0
    for entry in entries:
        if entry["start_hour"] > cursor:
            padded.append(_off_duty_entry(cursor, entry["start_hour"]))
        padded.append(entry)
        cursor = entry["end_hour"]
    if cursor < 24.0:
        padded.append(_off_duty_entry(cursor, 24.0))
    return padded


def _off_duty_entry(start_hour: float, end_hour: float) -> dict:
    return {
        "status": OFF_DUTY,
        "label": "Off duty",
        "start_hour": start_hour,
        "end_hour": end_hour,
        "miles": 0.0,
    }


def _hour_of_day(moment: datetime, day_start: datetime) -> float:
    return round((moment - day_start).total_seconds() / 3600, 4)
