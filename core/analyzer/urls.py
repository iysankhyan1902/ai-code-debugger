from django.urls import path
from .views import home,debug_code
from . import views

urlpatterns = [
    path("", home, name="home"),
    path('register/', views.register, name='register'),
    path("debug/", debug_code, name="debug_code"),
    path("history/", views.history_view, name="history"),

]
