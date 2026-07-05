from django.urls import path

from .views import TripDetailView, TripListCreateView

urlpatterns = [
    path("trips/", TripListCreateView.as_view(), name="trip-list-create"),
    path("trips/<uuid:pk>/", TripDetailView.as_view(), name="trip-detail"),
]
