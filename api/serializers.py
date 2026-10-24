
from rest_framework import serializers
from django.db import transaction

from .models import (
    Produit, Client, Fournisseur,
    Achat, LigneAchat, Vente, LigneVente,
)


class ProduitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Produit
        fields = "__all__"


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = "__all__"


class FournisseurSerializer(serializers.ModelSerializer):
    class Meta:
        model = Fournisseur
        fields = "__all__"


class LigneAchatSerializer(serializers.ModelSerializer):
    class Meta:
        model = LigneAchat
        fields = ("id", "achat", "produit", "quantite", "prix_unitaire")
        read_only_fields = ("id", "achat")


class AchatSerializer(serializers.ModelSerializer):
    lignes = LigneAchatSerializer(many=True, required=False)

    class Meta:
        model = Achat
        fields = "__all__"
        read_only_fields = ("montant_total", "date_achat", "statut")

    @transaction.atomic
    def create(self, validated_data):
        lignes_data = validated_data.pop("lignes", [])
        achat = Achat.objects.create(**validated_data)

        for ligne in lignes_data:
            LigneAchat.objects.create(achat=achat, **ligne)

        return achat


class LigneVenteSerializer(serializers.ModelSerializer):
    class Meta:
        model = LigneVente
        fields = ("id", "vente", "produit", "quantite", "prix_unitaire")
        read_only_fields = ("id", "vente")


class VenteSerializer(serializers.ModelSerializer):
    lignes = LigneVenteSerializer(many=True, required=False)

    class Meta:
        model = Vente
        fields = "__all__"
        read_only_fields = ("montant_total", "date_vente", "statut")

    @transaction.atomic
    def create(self, validated_data):
        lignes_data = validated_data.pop("lignes", [])
        vente = Vente.objects.create(**validated_data)

        for ligne in lignes_data:
            LigneVente.objects.create(vente=vente, **ligne)

        return vente
