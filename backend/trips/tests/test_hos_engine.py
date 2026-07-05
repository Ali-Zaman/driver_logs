from datetime import datetime
from unittest import TestCase

from trips.hos.engine import (
    DRIVING,
    OFF_DUTY,
    ON_DUTY,
    HosScheduler,
    Leg,
)
from trips.hos.logbook import build_daily_logs

START = datetime(2025, 1, 6, 8, 0)


def plan(to_pickup, to_dropoff, cycle_used=0.0, start=START):
    scheduler = HosScheduler(start, cycle_used)
    return scheduler.plan_trip(Leg(*to_pickup), Leg(*to_dropoff))


class ComplianceMixin:
    """Replays segments against the raw FMCSA rules, independent of the
    engine's own bookkeeping."""

    def assert_compliant(self, segments, cycle_seed=0.0):
        shift_start = None
        shift_driving = 0.0
        since_break = 0.0
        cycle = cycle_seed
        prev_end = None

        for seg in segments:
            if prev_end is not None:
                self.assertEqual(seg.start, prev_end, "segments must be contiguous")
            prev_end = seg.end

            if seg.status == OFF_DUTY:
                if seg.hours >= 34:
                    cycle = 0.0
                if seg.hours >= 10:
                    shift_start, shift_driving = None, 0.0
                if seg.hours >= 0.5:
                    since_break = 0.0
                continue

            if shift_start is None:
                shift_start = seg.start
            if seg.hours >= 0.5 and seg.status == ON_DUTY:
                since_break = 0.0
            cycle += seg.hours

            if seg.status == DRIVING:
                window = (seg.end - shift_start).total_seconds() / 3600
                shift_driving += seg.hours
                since_break += seg.hours
                self.assertLessEqual(window, 14 + 1e-6)
                self.assertLessEqual(shift_driving, 11 + 1e-6)
                self.assertLessEqual(since_break, 8 + 1e-6)
                self.assertLessEqual(cycle, 70 + 1e-6)


class HosSchedulerTests(ComplianceMixin, TestCase):
    def test_short_trip_runs_straight_through(self):
        segments = plan((100, 2), (200, 4))
        self.assertEqual(
            [s.label for s in segments],
            ["Driving", "Pickup", "Driving", "Dropoff"],
        )
        self.assert_compliant(segments)

    def test_break_required_after_8_hours_driving(self):
        segments = plan((0, 0), (500, 10))
        labels = [s.label for s in segments]
        self.assertIn("30 min break", labels)

        first_stretch = next(s for s in segments if s.status == DRIVING)
        self.assertAlmostEqual(first_stretch.hours, 8, places=4)
        self.assert_compliant(segments)

    def test_multi_day_trip_inserts_10_hour_resets(self):
        segments = plan((0, 0), (1500, 30))
        resets = [s for s in segments if s.label == "10 hr reset"]
        self.assertGreaterEqual(len(resets), 2)

        total_driving = sum(s.hours for s in segments if s.status == DRIVING)
        self.assertAlmostEqual(total_driving, 30, places=3)
        self.assert_compliant(segments)

    def test_fuel_stop_every_1000_miles(self):
        segments = plan((0, 0), (2200, 40))
        fuel_stops = [s for s in segments if s.label == "Fuel"]
        self.assertEqual(len(fuel_stops), 2)
        self.assertAlmostEqual(fuel_stops[0].start_miles, 1000, places=2)
        self.assertAlmostEqual(fuel_stops[1].start_miles, 2000, places=2)
        self.assert_compliant(segments)

    def test_exhausted_cycle_forces_34_hour_restart(self):
        segments = plan((100, 2), (300, 6), cycle_used=68)
        self.assertIn("34 hr restart", [s.label for s in segments])
        self.assert_compliant(segments, cycle_seed=68)

    def test_pickup_time_counts_against_window(self):
        # 6h to pickup + 1h pickup + 10h haul: the 11h driving limit and 14h
        # window both force a reset partway through the second leg.
        segments = plan((300, 6), (500, 10))
        self.assertIn("10 hr reset", [s.label for s in segments])
        self.assert_compliant(segments)

    def test_no_driving_with_zero_cycle_hours(self):
        segments = plan((100, 2), (100, 2), cycle_used=70)
        self.assertEqual(segments[0].label, "34 hr restart")
        self.assert_compliant(segments, cycle_seed=70)


class LogbookTests(TestCase):
    def test_days_are_padded_to_24_hours(self):
        segments = plan((0, 0), (1500, 30))
        logs = build_daily_logs(segments)
        self.assertGreaterEqual(len(logs), 3)

        for log in logs:
            self.assertAlmostEqual(sum(log["totals"].values()), 24, places=2)
            self.assertEqual(log["entries"][0]["start_hour"], 0.0)
            self.assertEqual(log["entries"][-1]["end_hour"], 24.0)

    def test_miles_split_across_midnight_match_trip_total(self):
        segments = plan((250, 5), (1000, 20))
        logs = build_daily_logs(segments)
        self.assertAlmostEqual(sum(log["miles"] for log in logs), 1250, delta=0.5)

    def test_first_day_starts_off_duty_until_trip_begins(self):
        segments = plan((100, 2), (200, 4))
        first_entry = build_daily_logs(segments)[0]["entries"][0]
        self.assertEqual(first_entry["status"], OFF_DUTY)
        self.assertAlmostEqual(first_entry["end_hour"], 8.0, places=4)
