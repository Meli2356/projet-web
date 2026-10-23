
from django.contrib import admin
from .models import (
    Produit,
    Client,
    Fournisseur,
    Achat,
    LigneAchat,
    Vente,
    LigneVente,
)


@admin.register(Produit)
class ProduitAdmin(admin.ModelAdmin):
    list_display = (
        "reference",
        "nom",
        "categorie",
        "quantite",
        "prix_achat",
        "prix_vente",
        "seuil_alerte",
    )
    search_fields = ("reference", "nom")
    list_filter = ("categorie",)


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ("nom", "telephone", "email", "date_creation")
    search_fields = ("nom", "telephone", "email")


@admin.register(Fournisseur)
class FournisseurAdmin(admin.ModelAdmin):
    list_display = ("nom", "telephone", "email", "date_creation")
    search_fields = ("nom", "telephone", "email")


class LigneAchatInline(admin.TabularInline):
    model = LigneAchat
    extra = 1


@admin.register(Achat)
class AchatAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "fournisseur",
        "date_achat",
        "statut",
        "montant_total",
    )
    list_filter = ("statut", "date_achat")
    search_fields = ("fournisseur__nom",)
    inlines = [LigneAchatInline]


class LigneVenteInline(admin.TabularInline):
    model = LigneVente
    extra = 1


@admin.register(Vente)
class VenteAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "client",
        "date_vente",
        "statut",
        "montant_total",
    )
    list_filter = ("statut", "date_vente")
    search_fields = ("client__nom",)
    inlines = [LigneVenteInline]
