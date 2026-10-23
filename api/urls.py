
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    ProduitViewSet,
    ClientViewSet,
    FournisseurViewSet,
    AchatViewSet,
    VenteViewSet,
)

router = DefaultRouter()
router.register("produits", ProduitViewSet, basename="produit")
router.register("clients", ClientViewSet, basename="client")
router.register("fournisseurs", FournisseurViewSet, basename="fournisseur")
router.register("achats", AchatViewSet, basename="achat")
router.register("ventes", VenteViewSet, basename="vente")

urlpatterns = [
    path("", include(router.urls)),
]
