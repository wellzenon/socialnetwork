from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    following = models.ManyToManyField('User')

    def serialize(self):
        return {
            "id": self.id,
            "user": self.username,
        }

class Post(models.Model):
    user = models.ForeignKey("User", on_delete=models.CASCADE, related_name="emails")
    text = models.CharField(max_length=500)
    timestamp = models.DateTimeField(auto_now_add=True)
    likes = models.ManyToManyField(User)

    @property
    def likes_count(self):
        try:
            return self.likes.all().count()
        except:
            return 0

    def serialize(self):
        return {
            "id": self.id,
            "user": {
                "id": self.user.id,
                "name": self.user.username,
            },
            "likes":self.likes_count,
            "text": self.text,
            "timestamp": self.timestamp.strftime("%b %d %Y, %I:%M %p"),
        }
