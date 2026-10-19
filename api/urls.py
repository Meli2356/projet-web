
from django.urls import path
from .views import accueil_api

urlpatterns = [
    path("", accueil_api, name="accueil_api"),
]
