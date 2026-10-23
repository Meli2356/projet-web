
from django.db import models


class Produit(models.Model):
    reference = models.CharField(max_length=50, unique=True)
    nom = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    categorie = models.CharField(max_length=100, blank=True)
    quantite = models.PositiveIntegerField(default=0)
    prix_achat = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    prix_vente = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    seuil_alerte = models.PositiveIntegerField(default=5)
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.reference} - {self.nom}"
