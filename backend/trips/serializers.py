from rest_framework import serializers

from .models import Trip


class TripInputSerializer(serializers.Serializer):
    current_location = serializers.CharField(max_length=255)
    pickup_location = serializers.CharField(max_length=255)
    dropoff_location = serializers.CharField(max_length=255)
    cycle_used_hours = serializers.FloatField(min_value=0, max_value=70)
    start_time = serializers.DateTimeField(required=False, default=None)
    timezone_name = serializers.CharField(required=False, default="", allow_blank=True)

    def validate_start_time(self, value):
        return value.replace(tzinfo=None) if value else None


class TripSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trip
        fields = [
            "id",
            "current_location",
            "pickup_location",
            "dropoff_location",
            "cycle_used_hours",
            "plan",
            "created_at",
        ]


class TripListSerializer(serializers.ModelSerializer):
    summary = serializers.JSONField(source="plan.summary")

    class Meta:
        model = Trip
        fields = [
            "id",
            "current_location",
            "pickup_location",
            "dropoff_location",
            "cycle_used_hours",
            "summary",
            "created_at",
        ]
