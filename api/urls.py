
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProduitViewSet, accueil_api

router = DefaultRouter()
router.register("produits", ProduitViewSet, basename="produit")

urlpatterns = [
    path("", accueil_api, name="accueil_api"),
    path("", include(router.urls)),
]
