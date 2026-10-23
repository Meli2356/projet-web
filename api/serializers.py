
from rest_framework import serializers
from .models import (
    Produit,
    Client,
    Fournisseur,
    Achat,
    LigneAchat,
    Vente,
    LigneVente,
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
        fields = "__all__"


class AchatSerializer(serializers.ModelSerializer):
    lignes = LigneAchatSerializer(many=True, read_only=True)

    class Meta:
        model = Achat
        fields = "__all__"


class LigneVenteSerializer(serializers.ModelSerializer):
    class Meta:
        model = LigneVente
        fields = "__all__"


class VenteSerializer(serializers.ModelSerializer):
    lignes = LigneVenteSerializer(many=True, read_only=True)

    class Meta:
        model = Vente
        fields = "__all__"
