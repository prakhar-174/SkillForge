from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .services import submit_personality_assessment
from .personality_data import PERSONALITY_QUESTIONS
from .services import *

class GenerateSkillTestAPI(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            domain = request.data.get("domain") or request.data.get("role_hint")
            skills = request.data.get("skills")
            category_id = request.data.get("category_id")

            attempt = generate_skill_test_for_student(
                student_id=request.user.id,
                category_id=category_id,
                domain=domain,
                skills=skills
            )

            return Response({
                "attempt_id": attempt.id,
                "session_id": attempt.proctor_session.id if attempt.proctor_session else None,
                "category": attempt.category.name,
                "domain": attempt.category.name,
                "questions": attempt.generated_questions,
                "total_questions": attempt.total_questions
            })

        except Exception as e:
            return Response(
                {"error": f"Failed to generate test: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )



class SubmitSkillTestAPI(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        attempt_id = request.data.get("attempt_id")
        answers = request.data.get("answers")

        if not attempt_id or not answers:
            return Response(
                {"error": "attempt_id and answers required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        result = submit_skill_test(
            student_id=request.user.id,
            attempt_id=attempt_id,
            answers=answers
        )

        return Response(result)

class PersonalityQuestionsAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(PERSONALITY_QUESTIONS)


class SubmitPersonalityAPI(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        result = submit_personality_assessment(
            request.user,
            request.data.get("answers", {})
        )
        return Response(result)
class RecommendationAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = get_recommendation(request.user.id)
        return Response(data)

class LeaderboardAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        criteria = request.query_params.get("criteria", "overall").strip().lower()
        selected_domain = request.query_params.get("domain", "").strip()

        # Update current user's streak & points first
        current_profile = None
        if request.user.role == "student" and hasattr(request.user, "student_profile"):
            current_profile = request.user.student_profile
            try:
                from accounts.streak_utils import update_student_streak
                update_student_streak(current_profile)
            except Exception:
                pass

        if not selected_domain and current_profile:
            selected_domain = current_profile.primary_domain or "Frontend Development"
        elif not selected_domain:
            selected_domain = "Frontend Development"

        available_domains = [
            "Frontend Development",
            "Backend Development",
            "Full Stack Development",
            "Mobile App Development",
            "AI / Machine Learning & Data Science",
            "DevOps & Cloud Engineering",
            "UI/UX Design & Product",
            "Cybersecurity"
        ]

        from accounts.models import StudentProfile
        from accounts.streak_utils import calculate_student_points

        students = StudentProfile.objects.select_related("user", "report").filter(user__is_active=True)

        for p in students:
            try:
                calculate_student_points(p)
            except Exception:
                pass

        leaderboard_data = []

        for p in students:
            user_domain = p.primary_domain or "Frontend Development"
            skill_score = 0.0
            matches_domain = False

            if criteria == "domain":
                domain_attempt = p.user.skill_attempts.filter(
                    category__name__iexact=selected_domain,
                    is_evaluated=True
                ).order_by("-percentage").first()

                if domain_attempt:
                    matches_domain = True
                    skill_score = domain_attempt.percentage
                    user_domain = domain_attempt.category.name
                elif user_domain.lower() == selected_domain.lower() or selected_domain.lower() in user_domain.lower():
                    matches_domain = True
                    try:
                        skill_score = p.report.skill_test_score or 0.0
                    except Exception:
                        skill_score = 0.0
                else:
                    skills_lower = (p.skills or "").lower()
                    domain_lower = selected_domain.lower()
                    if "frontend" in domain_lower and any(k in skills_lower for k in ["react", "frontend", "html", "css", "vue", "next"]):
                        matches_domain = True
                    elif "backend" in domain_lower and any(k in skills_lower for k in ["django", "fastapi", "node", "express", "backend", "sql", "postgres"]):
                        matches_domain = True
                    elif "full stack" in domain_lower and any(k in skills_lower for k in ["fullstack", "full stack", "mern", "react", "next"]):
                        matches_domain = True
                    elif "mobile" in domain_lower and any(k in skills_lower for k in ["flutter", "react native", "swift", "kotlin", "android", "ios"]):
                        matches_domain = True
                    elif "ai" in domain_lower and any(k in skills_lower for k in ["pytorch", "tensorflow", "machine learning", "data science", "pandas", "ai", "llm"]):
                        matches_domain = True
                    elif "cloud" in domain_lower and any(k in skills_lower for k in ["docker", "kubernetes", "aws", "cloud", "devops", "terraform"]):
                        matches_domain = True
                    elif "security" in domain_lower and any(k in skills_lower for k in ["cyber", "security", "owasp", "pen"]):
                        matches_domain = True
                    elif "design" in domain_lower and any(k in skills_lower for k in ["figma", "ui", "ux", "design"]):
                        matches_domain = True

                    if matches_domain:
                        try:
                            skill_score = p.report.skill_test_score or 0.0
                        except Exception:
                            skill_score = 0.0
                        user_domain = selected_domain

                if not matches_domain:
                    continue
            else:
                try:
                    skill_score = p.report.skill_test_score or 0.0
                except Exception:
                    pass
                best_attempt = p.user.skill_attempts.filter(is_evaluated=True).order_by("-percentage").first()
                if best_attempt and best_attempt.percentage > skill_score:
                    skill_score = best_attempt.percentage
                    user_domain = best_attempt.category.name

            name = p.full_name or (p.user.email.split("@")[0].title())
            initial = name[0].upper() if name else "U"

            streak = p.streak or 1
            personality_score = 0
            try:
                personality_score = p.report.personality_score or 0
            except Exception:
                pass

            if criteria == "domain":
                user_points = int(round((skill_score * 10) + (streak * 50) + (personality_score * 5) + 100))
            else:
                user_points = p.points or int(round((skill_score * 10) + (streak * 50) + (personality_score * 5) + 100))

            leaderboard_data.append({
                "user_id": p.user_id,
                "full_name": name,
                "avatar_initial": initial,
                "email": p.user.email,
                "domain": user_domain,
                "skill_score": round(skill_score, 1),
                "streak": streak,
                "points": user_points,
                "rating": float(p.rating or 0.0),
                "is_current_user": (p.user_id == request.user.id)
            })

        # Sort by points descending, then skill score, then streak
        leaderboard_data.sort(key=lambda x: (x["points"], x["skill_score"], x["streak"]), reverse=True)

        my_rank = None
        my_entry = None
        for idx, item in enumerate(leaderboard_data):
            item["rank"] = idx + 1
            if item["is_current_user"]:
                my_rank = item["rank"]
                my_entry = item

        if criteria == "domain" and not my_entry and current_profile:
            my_rank = len(leaderboard_data) + 1
            my_entry = {
                "rank": my_rank,
                "user_id": current_profile.user_id,
                "full_name": current_profile.full_name or "You",
                "avatar_initial": (current_profile.full_name or "Y")[0].upper(),
                "domain": selected_domain,
                "skill_score": 0.0,
                "streak": current_profile.streak or 1,
                "points": 150,
                "rating": float(current_profile.rating or 0.0),
                "is_current_user": True,
                "note": "Take the test in this domain to earn domain points!"
            }

        return Response({
            "criteria": criteria,
            "selected_domain": selected_domain,
            "available_domains": available_domains,
            "total_users": len(leaderboard_data),
            "my_stats": my_entry or {
                "rank": my_rank or "-",
                "points": current_profile.points if current_profile else 0,
                "streak": current_profile.streak if current_profile else 1,
                "domain": selected_domain
            },
            "rankings": leaderboard_data
        })
