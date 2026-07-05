"""HOS trip simulator for property-carrying drivers (70hr/8day cycle).

Walks the trip minute-by-minute against the FMCSA limits — 11h driving,
14h duty window, 30-min break after 8h cumulative driving, 70h cycle —
inserting fuel stops, breaks, 10h resets and 34h restarts as clocks run out.
Produces a contiguous list of duty-status segments the rest of the app
turns into map stops and daily log sheets.

Cycle hours only recover through a 34h restart here: the input is a single
"hours used" figure, so rolling 8-day recovery can't be computed.
"""

from dataclasses import dataclass
from datetime import datetime, timedelta

MAX_DRIVING_HOURS = 11
MAX_WINDOW_HOURS = 14
DRIVING_HOURS_BEFORE_BREAK = 8
BREAK_HOURS = 0.5
DAILY_RESET_HOURS = 10
CYCLE_LIMIT_HOURS = 70
RESTART_HOURS = 34
FUEL_INTERVAL_MILES = 1000
FUEL_STOP_HOURS = 0.5
SERVICE_STOP_HOURS = 1.0

OFF_DUTY = "off_duty"
SLEEPER_BERTH = "sleeper_berth"
DRIVING = "driving"
ON_DUTY = "on_duty"

EPS = 1e-6


@dataclass
class Leg:
    distance_miles: float
    duration_hours: float


@dataclass
class Segment:
    status: str
    label: str
    start: datetime
    end: datetime
    start_miles: float
    miles: float = 0.0

    @property
    def hours(self) -> float:
        return (self.end - self.start).total_seconds() / 3600


class HosScheduler:
    def __init__(self, start_time: datetime, cycle_used_hours: float):
        self.now = start_time
        self.cycle_used = cycle_used_hours
        self.shift_start = None
        self.shift_driving = 0.0
        self.driving_since_break = 0.0
        self.trip_miles = 0.0
        self.next_fuel_mile = FUEL_INTERVAL_MILES
        self.segments: list[Segment] = []

    def plan_trip(self, to_pickup: Leg, to_dropoff: Leg) -> list[Segment]:
        self._drive_leg(to_pickup)
        self._service_stop("Pickup")
        self._drive_leg(to_dropoff)
        self._service_stop("Dropoff")
        return self.segments

    @property
    def _window_left(self) -> float:
        if self.shift_start is None:
            return MAX_WINDOW_HOURS
        elapsed = (self.now - self.shift_start).total_seconds() / 3600
        return MAX_WINDOW_HOURS - elapsed

    def _drive_leg(self, leg: Leg):
        if leg.distance_miles <= 0:
            return
        speed = leg.distance_miles / leg.duration_hours
        remaining = leg.distance_miles

        while remaining > EPS:
            if CYCLE_LIMIT_HOURS - self.cycle_used <= EPS:
                self._restart()
                continue
            if MAX_DRIVING_HOURS - self.shift_driving <= EPS or self._window_left <= EPS:
                self._rest()
                continue
            if self.driving_since_break >= DRIVING_HOURS_BEFORE_BREAK - EPS:
                self._break()
                continue

            hours_allowed = min(
                MAX_DRIVING_HOURS - self.shift_driving,
                self._window_left,
                DRIVING_HOURS_BEFORE_BREAK - self.driving_since_break,
                CYCLE_LIMIT_HOURS - self.cycle_used,
            )
            miles = min(remaining, self.next_fuel_mile - self.trip_miles, hours_allowed * speed)
            self._drive(miles, miles / speed)
            remaining -= miles

            if self.trip_miles >= self.next_fuel_mile - EPS and remaining > EPS:
                self._fuel_stop()
                self.next_fuel_mile += FUEL_INTERVAL_MILES

    def _drive(self, miles: float, hours: float):
        if self.shift_start is None:
            self.shift_start = self.now
        self._emit(DRIVING, "Driving", hours, miles)
        self.shift_driving += hours
        self.driving_since_break += hours
        self.cycle_used += hours

    def _service_stop(self, label: str):
        self._on_duty(label, SERVICE_STOP_HOURS)

    def _fuel_stop(self):
        self._on_duty("Fuel", FUEL_STOP_HOURS)

    def _on_duty(self, label: str, hours: float):
        # On-duty work past the 14h window or 70h cycle is legal; only driving is gated.
        if self.shift_start is None:
            self.shift_start = self.now
        self._emit(ON_DUTY, label, hours)
        self.cycle_used += hours
        if hours >= BREAK_HOURS:
            self.driving_since_break = 0.0

    def _break(self):
        self._emit(OFF_DUTY, "30 min break", BREAK_HOURS)
        self.driving_since_break = 0.0

    def _rest(self):
        self._emit(OFF_DUTY, "10 hr reset", DAILY_RESET_HOURS)
        self._reset_shift()

    def _restart(self):
        self._emit(OFF_DUTY, "34 hr restart", RESTART_HOURS)
        self.cycle_used = 0.0
        self._reset_shift()

    def _reset_shift(self):
        self.shift_start = None
        self.shift_driving = 0.0
        self.driving_since_break = 0.0

    def _emit(self, status: str, label: str, hours: float, miles: float = 0.0):
        end = self.now + timedelta(hours=hours)
        self.segments.append(Segment(status, label, self.now, end, self.trip_miles, miles))
        self.now = end
        self.trip_miles += miles
