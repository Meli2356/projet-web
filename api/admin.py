
from django.contrib import admin
from .models import Produit


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
