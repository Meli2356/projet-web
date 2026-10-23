
from decimal import Decimal

from django.db import transaction
from django.db.models import F
from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import (
    Produit,
    Client,
    Fournisseur,
    Achat,
    LigneAchat,
    Vente,
    LigneVente,
)
from .serializers import (
    ProduitSerializer,
    ClientSerializer,
    FournisseurSerializer,
    AchatSerializer,
    VenteSerializer,
)


class ProduitViewSet(viewsets.ModelViewSet):
    queryset = Produit.objects.all().order_by("-id")
    serializer_class = ProduitSerializer


class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all().order_by("-id")
    serializer_class = ClientSerializer


class FournisseurViewSet(viewsets.ModelViewSet):
    queryset = Fournisseur.objects.all().order_by("-id")
    serializer_class = FournisseurSerializer


class AchatViewSet(viewsets.ModelViewSet):
    queryset = Achat.objects.select_related("fournisseur").prefetch_related(
        "lignes"
    ).order_by("-id")
    serializer_class = AchatSerializer

    @action(detail=True, methods=["post"])
    def valider(self, request, pk=None):
        with transaction.atomic():
            achat = Achat.objects.select_for_update().get(pk=pk)

            if achat.statut != "brouillon":
                return Response(
                    {"erreur": "Ity achat ity dia efa nokarakaraina."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            lignes = list(
                LigneAchat.objects.filter(achat=achat).select_related("produit")
            )

            if not lignes:
                return Response(
                    {"erreur": "Ampidiro aloha ny produits amin'ity achat ity."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            total = Decimal("0.00")

            for ligne in lignes:
                if ligne.quantite <= 0 or ligne.prix_unitaire < 0:
                    return Response(
                        {"erreur": "Tsy mety ny quantité na ny prix."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                Produit.objects.filter(pk=ligne.produit_id).update(
                    quantite=F("quantite") + ligne.quantite
                )
                total += ligne.quantite * ligne.prix_unitaire

            achat.montant_total = total
            achat.statut = "valide"
            achat.save(update_fields=["montant_total", "statut"])

        return Response(self.get_serializer(achat).data)


class VenteViewSet(viewsets.ModelViewSet):
    queryset = Vente.objects.select_related("client").prefetch_related(
        "lignes"
    ).order_by("-id")
    serializer_class = VenteSerializer

    @action(detail=True, methods=["post"])
    def valider(self, request, pk=None):
        with transaction.atomic():
            vente = Vente.objects.select_for_update().get(pk=pk)

            if vente.statut != "brouillon":
                return Response(
                    {"erreur": "Ity vente ity dia efa nokarakaraina."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            lignes = list(
                LigneVente.objects.filter(vente=vente).select_related("produit")
            )

            if not lignes:
                return Response(
                    {"erreur": "Ampidiro aloha ny produits amin'ity vente ity."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            total = Decimal("0.00")

            for ligne in lignes:
                if ligne.quantite <= 0 or ligne.prix_unitaire < 0:
                    return Response(
                        {"erreur": "Tsy mety ny quantité na ny prix."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                produit = Produit.objects.select_for_update().get(
                    pk=ligne.produit_id
                )

                if produit.quantite < ligne.quantite:
                    return Response(
                        {
                            "erreur": (
                                f"Stock insuffisant pour {produit.nom}. "
                                f"Stock disponible: {produit.quantite}."
                            )
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )

                produit.quantite -= ligne.quantite
                produit.save(update_fields=["quantite"])

                total += ligne.quantite * ligne.prix_unitaire

            vente.montant_total = total
            vente.statut = "valide"
            vente.save(update_fields=["montant_total", "statut"])

        return Response(self.get_serializer(vente).data)
