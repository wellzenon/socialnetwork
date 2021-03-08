
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),

    # API Routes
    path("menu", views.menu, name="menu"),
    path("login", views.login_api, name="login"),
    path("logout", views.logout_api, name="logout"),
    path("register", views.register_api, name="register"),
    path("all-posts", views.all_posts, name="all-posts"),
    path("post", views.save_post, name="post"),
    path("post/<int:id>", views.get_post, name="get-post"),
    path("post/<int:id>/edit", views.edit_post, name="edit-post"),
    path("post/<int:id>/like", views.toggle_like, name="toggle-like"),
    path("following", views.following, name="following"),
    path("user/<int:id>", views.get_user, name="get-user"),
    path("user/<int:id>/follow", views.toggle_follow, name="follow"),
]
