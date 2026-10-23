
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


class Fournisseur(models.Model):
    nom = models.CharField(max_length=150)
    telephone = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    adresse = models.TextField(blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nom


class Client(models.Model):
    nom = models.CharField(max_length=150)
    telephone = models.CharField(max_length=30, blank=True)
    email = models.EmailField(blank=True)
    adresse = models.TextField(blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.nom


class Achat(models.Model):
    STATUT_CHOICES = [
        ("brouillon", "Brouillon"),
        ("valide", "Validé"),
        ("annule", "Annulé"),
    ]

    fournisseur = models.ForeignKey(
        Fournisseur,
        on_delete=models.PROTECT,
        related_name="achats",
    )
    date_achat = models.DateTimeField(auto_now_add=True)
    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default="brouillon",
    )
    montant_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )

    def __str__(self):
        return f"Achat #{self.pk}"


class LigneAchat(models.Model):
    achat = models.ForeignKey(
        Achat,
        on_delete=models.CASCADE,
        related_name="lignes",
    )
    produit = models.ForeignKey(
        Produit,
        on_delete=models.PROTECT,
        related_name="lignes_achat",
    )
    quantite = models.PositiveIntegerField()
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.achat} - {self.produit}"


class Vente(models.Model):
    STATUT_CHOICES = [
        ("brouillon", "Brouillon"),
        ("valide", "Validée"),
        ("annule", "Annulée"),
    ]

    client = models.ForeignKey(
        Client,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ventes",
    )
    date_vente = models.DateTimeField(auto_now_add=True)
    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default="brouillon",
    )
    montant_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
    )

    def __str__(self):
        return f"Vente #{self.pk}"


class LigneVente(models.Model):
    vente = models.ForeignKey(
        Vente,
        on_delete=models.CASCADE,
        related_name="lignes",
    )
    produit = models.ForeignKey(
        Produit,
        on_delete=models.PROTECT,
        related_name="lignes_vente",
    )
    quantite = models.PositiveIntegerField()
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.vente} - {self.produit}"
