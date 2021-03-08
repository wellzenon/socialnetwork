import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect
from django.http import response
from django.http.response import JsonResponse
from django.shortcuts import render
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt, csrf_protect, ensure_csrf_cookie
from django.core.paginator import Paginator

from .models import User, Post

def index(request):
    return render(request, "network/index.html")

def menu(request):
    user = request.user
    if user.is_active:
        return JsonResponse(user.serialize(), safe=False)
    else:
        return JsonResponse({"message": "Forbidden"}, status=201)    

@csrf_protect
@ensure_csrf_cookie
@login_required
def save_post(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        if data.get('text') != "":
            post = Post(
                user = request.user,
                text = data.get('text')
            )
            post.save()
        
            return JsonResponse({}, status=201)
    
    return JsonResponse({"message": "Can't create an empty post."}, status=403)

@csrf_protect
@ensure_csrf_cookie
@login_required
def edit_post(request, id):
    post=Post.objects.get(id=id)
    if request.method == 'PUT' and request.user == post.user:
        data = json.loads(request.body)
        post.text = data.get('text')
        if post.text != "":
            post.save()
            return JsonResponse({}, status=201)
        else:
            return JsonResponse({"message": "Can't edit to an empty post."}, status=403)
    else:
        return JsonResponse({"message": "Can't edit other user's post."}, status=403)

def get_post(request, id):
    user = request.user
    post = Post.objects.get(id=id)
    liked = post.likes.filter(id=user.id).exists()
    response = {**post.serialize(), "liked": liked}
    return JsonResponse(response, safe=False)

def all_posts(request):
    posts = [post.id for post in Post.objects.all().order_by('-timestamp')]
    pages = Paginator(posts, 10)
    page = pages.get_page(request.GET.get('page')).object_list
    response = {
        "page_total": pages.num_pages,
        "posts": page,
    }
    return JsonResponse(response, safe=False)

def following(request):
    user = request.user
    posts = [post.id for post in Post.objects.filter(user__in=user.following.all()).order_by('-timestamp')]
    pages = Paginator(posts, 10)
    page = pages.get_page(request.GET.get('page')).object_list
    response = {
        "posts": page,
        "page_total": pages.num_pages,
    }
    return JsonResponse(response, safe=False)

def get_user(request, id):
    profile = User.objects.get(id=id)
    following = profile.following.all()
    followers = profile.user_set.all()
    posts = [post.id for post in Post.objects.filter(user=profile).order_by('-timestamp')]
    pages = Paginator(posts, 10)
    page = pages.get_page(request.GET.get('page')).object_list
    response = {
        "profile": profile.serialize(),
        "following": [profile.serialize() for profile in following],
        "followers": [profile.serialize() for profile in followers],
        "posts": page,
        "page_total": pages.num_pages,
    }
    return JsonResponse(response, safe=False)

@csrf_protect
@ensure_csrf_cookie
@login_required
def toggle_like(request, id):
    user = request.user
    liked = json.loads(request.body)["liked"]
    post = Post.objects.get(id=id)
    if liked:
        post.likes.remove(user)
        return JsonResponse({"message": "Dislike sent successfully."}, status=201)
    else:
        post.likes.add(user)
        return JsonResponse({"message": "Like sent successfully."}, status=201)

@csrf_protect
@ensure_csrf_cookie
@login_required
def toggle_follow(request, id):
    user = request.user
    followed = User.objects.get(id=id)
    if user.id == followed.id : 
        return JsonResponse({"message": "User can't follow itself"}, status=201)
    elif user.following.filter(id=followed.id).exists():
        user.following.remove(followed)
        return JsonResponse({"message": "Unfollow sent successfully."}, status=201)
    else:
        user.following.add(followed)
        return JsonResponse({"message": "Follow sent successfully."}, status=201)

@csrf_protect
@ensure_csrf_cookie
def login_api(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = json.loads(request.body)['username']
        password = json.loads(request.body)['password']
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            response = request.user.serialize()
            return JsonResponse(response, status=201)
        else:
            return JsonResponse({"message": "Credentials don't match"}, status=401)
    else:
        return JsonResponse({"message": "Forbidden"}, status=403)

def logout_api(request):
    logout(request)
    return JsonResponse({"message": "Logged out successfully."}, status=201)

@csrf_protect
@ensure_csrf_cookie
def register_api(request):
    if request.method == "POST":
        username = json.loads(request.body)["username"]
        email = json.loads(request.body)["email"]

        # Ensure password matches confirmation
        password = json.loads(request.body)["password"]
        confirmation = json.loads(request.body)["confirmation"]
        if password != confirmation:
            return JsonResponse({"message": "Passwords must match"}, status=401)

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return JsonResponse({"message": "Username already taken"}, status=401)
        login(request, user)
        response = request.user.serialize()
        return JsonResponse(response, status=201)
    else:
        return JsonResponse({"message": "Forbidden"}, status=403)