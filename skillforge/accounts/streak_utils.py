from django.utils import timezone
from datetime import timedelta
from .models import StudentProfile

def update_student_streak(profile: StudentProfile) -> int:
    """
    Updates the 24-hr daily login streak for the student:
    - Same day login (0 days delta): maintains streak.
    - Consecutive day login (1 day delta): increments streak by 1.
    - Missed days (>1 day delta): resets streak to 1.
    - First login: sets streak to 1.
    """
    today = timezone.localdate()
    updated = False

    if not profile.last_active_date:
        profile.streak = 1
        profile.longest_streak = max(profile.longest_streak or 0, 1)
        profile.last_active_date = today
        updated = True
    else:
        delta = (today - profile.last_active_date).days
        if delta == 1:
            profile.streak = (profile.streak or 0) + 1
            profile.longest_streak = max(profile.longest_streak or 0, profile.streak)
            profile.last_active_date = today
            updated = True
        elif delta > 1:
            profile.streak = 1
            profile.last_active_date = today
            updated = True
        elif delta == 0:
            if not profile.streak or profile.streak < 1:
                profile.streak = 1
                updated = True

    if updated:
        profile.save(update_fields=["streak", "longest_streak", "last_active_date"])

    # Recalculate total points
    calculate_student_points(profile)
    return profile.streak or 1

def calculate_student_points(profile: StudentProfile) -> int:
    """
    Calculates total points / XP based on:
    - Best Verified Skill Test Score (percentage * 10, e.g. 80% = 800 pts)
    - Consecutive Daily Streak (streak * 50 pts, e.g. 4 days = 200 pts)
    - Personality Assessment Score (score * 5 pts, e.g. 24 * 5 = 120 pts)
    - Base Onboarding XP (100 pts)
    """
    skill_score = 0
    personality_score = 0

    try:
        report = profile.report
        skill_score = report.skill_test_score or 0
        personality_score = report.personality_score or 0
    except Exception:
        pass

    # Also inspect user's evaluated skill attempts to find top domain and score
    try:
        best_attempt = profile.user.skill_attempts.filter(is_evaluated=True).order_by('-percentage').first()
        if best_attempt:
            if best_attempt.percentage > skill_score:
                skill_score = best_attempt.percentage
            if best_attempt.category and best_attempt.category.name:
                profile.primary_domain = best_attempt.category.name
    except Exception:
        pass

    streak = profile.streak or 1

    total_points = int(round((skill_score * 10) + (streak * 50) + (personality_score * 5) + 100))

    if profile.points != total_points:
        profile.points = total_points
        profile.save(update_fields=["points", "primary_domain"])

    return total_points
