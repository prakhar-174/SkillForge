from rest_framework import serializers
from django.contrib.auth import authenticate
import PyPDF2
from .models import User, StudentProfile, ClientProfile



class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["email", "password", "role"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user



class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        user = authenticate(email=data["email"], password=data["password"])
        if not user:
            raise serializers.ValidationError("Invalid credentials")
        data["user"] = user
        return data



class StudentOnboardingSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProfile
        fields = [
            "full_name",
            "location",
            "bio",
            "education",
            "experience_level",
            "github_url",
            "linkedin_url",
            "portfolio_links",
            "skills",
            "resume",
        ]

        extra_kwargs = {
            "full_name": {"required": True},
            "skills": {"required": True},
            "education": {"required": True},
        }

    def validate_resume(self, value):
        if value:
            filename = getattr(value, "name", "").lower()
            if not filename.endswith(".pdf"):
                raise serializers.ValidationError("Only PDF files are allowed for resume.")
            content_type = getattr(value, "content_type", "")
            if content_type and content_type != "application/pdf":
                raise serializers.ValidationError("Only PDF files are allowed for resume.")
            try:
                reader = PyPDF2.PdfReader(value)
                if len(reader.pages) == 0:
                    raise serializers.ValidationError("Uploaded PDF appears to be empty.")
            except serializers.ValidationError:
                raise
            except Exception as e:
                raise serializers.ValidationError(f"Invalid PDF file: {str(e)}")
            finally:
                if hasattr(value, "seek"):
                    value.seek(0)
        return value



class ClientOnboardingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientProfile
        fields = [
            "company_name",
            "industry",
            "website",
            "address",
        ]

        extra_kwargs = {
            "company_name": {"required": True},
        }

from rest_framework import serializers
from .models import StudentProfile, ClientProfile

class StudentProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = StudentProfile
        fields = [
            "email",
            "full_name",
            "location",
            "bio",
            "education",
            "experience_level",
            "github_url",
            "linkedin_url",
            "portfolio_links",
            "skills",
            "resume",
            "rating",
        ]

    def validate_full_name(self, value):
        # Name is immutable once created/onboarded
        if self.instance and self.instance.full_name:
            return self.instance.full_name
        return value

    def validate_resume(self, value):
        if value:
            filename = getattr(value, "name", "").lower()
            if not filename.endswith(".pdf"):
                raise serializers.ValidationError("Only PDF files are allowed for resume.")
            content_type = getattr(value, "content_type", "")
            if content_type and content_type != "application/pdf":
                raise serializers.ValidationError("Only PDF files are allowed for resume.")
            try:
                reader = PyPDF2.PdfReader(value)
                if len(reader.pages) == 0:
                    raise serializers.ValidationError("Uploaded PDF appears to be empty.")
            except serializers.ValidationError:
                raise
            except Exception as e:
                raise serializers.ValidationError(f"Invalid PDF file: {str(e)}")
            finally:
                if hasattr(value, "seek"):
                    value.seek(0)
        return value


class ClientProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = ClientProfile
        fields = [
            "email",
            "company_name",
            "industry",
            "website",
            "address",
        ]

