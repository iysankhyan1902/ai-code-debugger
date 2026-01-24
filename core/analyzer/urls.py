from django.urls import path
from .views import home,debug_code

urlpatterns = [
    path("", home, name="home"),
    path("debug/", debug_code, name="debug_code"),
]
