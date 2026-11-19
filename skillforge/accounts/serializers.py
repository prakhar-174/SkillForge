import re
from rest_framework import serializers
from django.contrib.auth import authenticate
import PyPDF2
from .models import User, StudentProfile, ClientProfile

DISPOSABLE_EMAIL_DOMAINS = {
    'mailinator.com', 'tempmail.com', '10minutemail.com', 'guerrillamail.com',
    'throwawaymail.com', 'yopmail.com', 'sharklasers.com', 'dispostable.com',
    'trashmail.com', 'fakemailgenerator.com', 'getnada.com', 'temp-mail.org'
}


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    full_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    company_name = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ["email", "password", "role", "full_name", "company_name"]

    def validate_email(self, value):
        if not value or not isinstance(value, str):
            raise serializers.ValidationError("Email address is required.")

        email = value.strip().lower()

        # Basic RFC syntax check
        email_regex = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
        if not re.match(email_regex, email):
            raise serializers.ValidationError("Please enter a valid email address with a proper domain (e.g. yourname@gmail.com).")

        parts = email.split('@')
        if len(parts) != 2:
            raise serializers.ValidationError("Invalid email address format.")

        local_part, domain = parts[0], parts[1]

        if not local_part or not domain:
            raise serializers.ValidationError("Email address cannot have an empty username or domain.")

        # Check domain structure & TLD
        domain_parts = domain.split('.')
        if len(domain_parts) < 2 or not domain_parts[-1].isalpha() or len(domain_parts[-1]) < 2:
            raise serializers.ValidationError("Email domain must include a valid top-level domain (e.g. .com, .edu, .org).")

        # Reject disposable / burner domains
        if domain in DISPOSABLE_EMAIL_DOMAINS:
            raise serializers.ValidationError("Disposable or temporary email addresses are not permitted.")

        # Strict Gmail Verification
        if domain in ['gmail.com', 'googlemail.com']:
            # 1. Length rule: 6 to 30 characters
            if len(local_part) < 6:
                raise serializers.ValidationError("Gmail username must be at least 6 characters long before @gmail.com.")
            if len(local_part) > 30:
                raise serializers.ValidationError("Gmail username cannot exceed 30 characters.")

            # 2. Character rule: only letters, digits, and periods
            if not re.match(r'^[a-z0-9.]+$', local_part):
                raise serializers.ValidationError("Gmail address can only contain letters (a-z), numbers (0-9), and periods (.). No special characters or symbols are allowed.")

            # 3. Period rules: cannot start or end with a period
            if local_part.startswith('.') or local_part.endswith('.'):
                raise serializers.ValidationError("Gmail username cannot start or end with a period.")

            # 4. No consecutive periods
            if '..' in local_part:
                raise serializers.ValidationError("Gmail username cannot contain consecutive periods (..).")

            # 5. Must contain at least one letter
            if not any(c.isalpha() for c in local_part):
                raise serializers.ValidationError("Gmail address must contain at least one letter.")

            # 6. Reject repetitive single-character spam (e.g. 'aaaaaa', '111111')
            clean_name = local_part.replace('.', '')
            if len(set(clean_name)) <= 1:
                raise serializers.ValidationError("Please provide a legitimate Gmail address, not repetitive random characters.")

        # Check uniqueness in database
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("An account with this email address already exists. Please log in.")

        return email

    def validate_password(self, value):
        if not value or len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")

        has_letter = any(c.isalpha() for c in value)
        has_digit = any(c.isdigit() for c in value)
        has_symbol = any(not c.isalnum() for c in value)

        if not has_letter:
            raise serializers.ValidationError("Password must contain at least one letter.")
        if not (has_digit or has_symbol):
            raise serializers.ValidationError("Password must contain at least one number or special character.")

        trivial = {'12345678', 'password', 'password123', 'qwerty123', 'admin123', 'skillforge', 'skillforge123'}
        if value.lower() in trivial:
            raise serializers.ValidationError("This password is too common and insecure. Please choose a stronger password.")

        return value

    def validate_role(self, value):
        if value not in ['student', 'client']:
            raise serializers.ValidationError("Role must be either 'student' or 'client'.")
        return value

    def create(self, validated_data):
        full_name = validated_data.pop("full_name", "").strip()
        company_name = validated_data.pop("company_name", "").strip()
        password = validated_data.pop("password")

        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()

        # Update initial profile with provided names if present
        if user.role == "student" and full_name:
            if hasattr(user, "student_profile"):
                user.student_profile.full_name = full_name
                user.student_profile.save(update_fields=["full_name"])
        elif user.role == "client" and company_name:
            if hasattr(user, "client_profile"):
                user.client_profile.company_name = company_name
                user.client_profile.save(update_fields=["company_name"])

        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, data):
        email = data["email"].strip().lower()
        user = authenticate(email=email, password=data["password"])
        if not user:
            raise serializers.ValidationError("Invalid email or password. Please verify your credentials.")
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
    skill_score = serializers.SerializerMethodField()
    personality_score = serializers.SerializerMethodField()

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
            "streak",
            "longest_streak",
            "points",
            "primary_domain",
            "skill_score",
            "personality_score",
        ]

    def get_skill_score(self, obj):
        try:
            return round(obj.report.skill_test_score, 1)
        except Exception:
            return 0.0

    def get_personality_score(self, obj):
        try:
            return round(obj.report.personality_score, 1)
        except Exception:
            return 0.0

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

