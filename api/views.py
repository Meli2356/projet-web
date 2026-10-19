from django.shortcuts import render

# Create your views here.

from rest_framework.decorators import api_view
from rest_framework.response import Response


@api_view(["GET"])
def accueil_api(request):
    return Response({
        "message": "Bienvenue dans mon application Django + React !",
        "status": "success"
    })
