from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.permissions import IsAuthenticated
from verification.services import generate_partial_report
import threading
from django.db import close_old_connections

def trigger_partial_report_async(user_id):
    def _task():
        close_old_connections()
        try:
            generate_partial_report(user_id)
        except Exception:
            pass
        finally:
            close_old_connections()

    thread = threading.Thread(target=_task, daemon=True)
    thread.start()


from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    StudentOnboardingSerializer,
    ClientOnboardingSerializer,
    StudentProfileSerializer,
    ClientProfileSerializer,
)

def get_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }



class RegisterAPI(APIView):
    permission_classes = []

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.save()

        return Response({
            "message": "Registered successfully",
            "tokens": get_tokens(user)
        })


class LoginAPI(APIView):
    permission_classes = []

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]

        if user.role == "student" and hasattr(user, "student_profile"):
            try:
                from .streak_utils import update_student_streak
                update_student_streak(user.student_profile)
            except Exception:
                pass

        return Response({
            "tokens": get_tokens(user),
            "role": user.role,
            "onboarding_stage": user.onboarding_stage
        })



class OnboardingAPI(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def put(self, request):
        user = request.user

        # If already onboarded, gracefully update profile rather than throwing a blocking 400 error
        if user.onboarding_stage >= 2:
            if user.role == "student":
                serializer = StudentProfileSerializer(
                    user.student_profile,
                    data=request.data,
                    partial=True
                )
            elif user.role == "client":
                serializer = ClientProfileSerializer(
                    user.client_profile,
                    data=request.data,
                    partial=True
                )
            else:
                return Response({"error": "Invalid role"}, status=400)

            serializer.is_valid(raise_exception=True)
            serializer.save()
            trigger_partial_report_async(user.id)

            return Response({
                "message": "Profile updated successfully",
                "profile": serializer.data
            })

        if user.role == "student":
            serializer = StudentOnboardingSerializer(
                user.student_profile,
                data=request.data
            )

        elif user.role == "client":
            serializer = ClientOnboardingSerializer(
                user.client_profile,
                data=request.data
            )

        else:
            return Response({"error": "Invalid role"}, status=400)

        serializer.is_valid(raise_exception=True)
        serializer.save()
        trigger_partial_report_async(user.id)

        user.onboarding_stage = 2
        user.verified = True
        user.save()

        return Response({
            "message": "Onboarding completed successfully",
            "profile": serializer.data
        })
class ProfileAPI(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        user = request.user
        if user.role == "student":
            try:
                from .streak_utils import update_student_streak
                update_student_streak(user.student_profile)
            except Exception:
                pass
            serializer = StudentProfileSerializer(user.student_profile)
        elif user.role == "client":
            serializer = ClientProfileSerializer(user.client_profile)
        else:
            return Response({"error": "Invalid role"}, status=400)
        data = dict(serializer.data)
        data["onboarding_stage"] = user.onboarding_stage
        return Response(data)
class ProfileUpdateAPI(APIView):
    permission_classes = [IsAuthenticated]
    def patch(self, request):
        user = request.user
        if user.role == "student":
            serializer = StudentProfileSerializer(
                user.student_profile,
                data=request.data,
                partial=True
            )
        elif user.role == "client":
            serializer = ClientProfileSerializer(
                user.client_profile,
                data=request.data,
                partial=True
            )
        else:
            return Response({"error": "Invalid role"}, status=400)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        trigger_partial_report_async(user.id)


        return Response({
            "message": "Profile updated",
            "data": serializer.data
        })

class LogoutAPI(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Logged out successfully"})
        except Exception as e:
            return Response({"error": "Invalid token"}, status=400)