import requests
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Trip
from .serializers import TripInputSerializer, TripListSerializer, TripSerializer
from .services.geocoding import GeocodingError
from .services.planner import build_plan
from .services.routing import RoutingError


class TripListCreateView(APIView):
    def get(self, request):
        trips = Trip.objects.all()[:10]
        return Response(TripListSerializer(trips, many=True).data)

    def post(self, request):
        serializer = TripInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            plan = build_plan(**serializer.validated_data)
        except (GeocodingError, RoutingError) as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
        except requests.RequestException:
            return Response(
                {"detail": "A map service is unavailable right now. Please try again."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        trip = Trip.objects.create(
            current_location=serializer.validated_data["current_location"],
            pickup_location=serializer.validated_data["pickup_location"],
            dropoff_location=serializer.validated_data["dropoff_location"],
            cycle_used_hours=serializer.validated_data["cycle_used_hours"],
            plan=plan,
        )
        return Response(TripSerializer(trip).data, status=status.HTTP_201_CREATED)


class TripDetailView(generics.RetrieveAPIView):
    queryset = Trip.objects.all()
    serializer_class = TripSerializer
