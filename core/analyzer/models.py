from django.db import models

class CodeSubmission(models.Model):
    code = models.TextField()
    language = models.CharField(max_length=50, default='python')
    submitted_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Submission {self.id} - {self.language}"
