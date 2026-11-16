from langchain_google_genai import GoogleGenerativeAI, ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser, JsonOutputParser
from dotenv import load_dotenv
import os
load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise ValueError("GEMINI_API_KEY or GOOGLE_API_KEY is missing. Set it in your .env file.")
model = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",   
    api_key=API_KEY
)
def analyze_resume(resume_text: str) -> str:
    template = PromptTemplate(
        input_variables=["resume_text"],
        template="""
        You are an expert technical recruiter.
        Analyze the following resume text and provide:
        - Key strengths
        - Weaknesses
        - Suggestions for improvement
        Resume:
        {resume_text}
        """
    )
    chain = template | model | StrOutputParser()
    return chain.invoke({"resume_text": resume_text})
def analyze_github_profile(github_profile: str) -> str:
    template = PromptTemplate(
        input_variables=["github_profile"],
        template="""
        You are an expert technical recruiter.
        Analyze the following GitHub profile and provide:
        - Key strengths
        - Weaknesses
        - Suggestions for improvement
        GitHub Profile URL:
        {github_profile}
        """
    )
    chain = template | model | StrOutputParser()
    return chain.invoke({"github_profile": github_profile})
def generate_final_report(resume_analysis: str, github_analysis: str) -> str:
    template = PromptTemplate(
        input_variables=["resume_analysis", "github_analysis"],
        template="""
        You are an expert technical recruiter.
        Based on the following analyses, generate a comprehensive final report.
        Resume Analysis:
        {resume_analysis}
        GitHub Analysis:
        {github_analysis}
        Final Report:
        """
    )
    chain = template | model | StrOutputParser()
    return chain.invoke({"resume_analysis": resume_analysis, "github_analysis": github_analysis})
def generate_test(resume_analysis: str, github_analysis: str, skills=None, recommendation=None, num_questions=5, role_hint="Developer") -> dict:
    parser = JsonOutputParser()
    template = PromptTemplate(
        input_variables=["resume_analysis", "github_analysis", "skills", "recommendation", "num_questions", "role_hint"],
        template="""
        You are a principal technical interviewer at a top engineering company.
        Your goal is to evaluate the candidate's mastery in the domain: "{role_hint}".
        Candidate Skills: {skills}

        Candidate Profile Summary:
        Resume Insights: {resume_analysis}
        GitHub Insights: {github_analysis}
        General Recommendation: {recommendation}

        Generate {num_questions} distinct, practical, scenario-based technical questions specifically evaluating {role_hint} and skills: {skills}.

        IMPORTANT REQUIREMENTS:
        1. Non-repetitive & Secure: Avoid basic trivial textbook questions. Present real-world bugs, performance bottlenecks, architecture decisions, edge cases, and design trade-offs.
        2. Vary difficulty: 1 Easy, 2 Medium, 2 Hard questions.
        3. Options format: "options" MUST be a JSON array of 4 pure strings WITHOUT any letter prefixes (e.g. DO NOT write "A) ...", write "Use React Context API...").
        4. Correct answer format: "correct_answer" MUST be the exact uppercase letter ("A", "B", "C", or "D") that corresponds to the correct option index.
        5. Return ONLY a valid JSON object matching this structure:
        {{
            "role": "{role_hint}",
            "questions": [
                {{
                    "question": "Realistic scenario-based question text",
                    "options": [
                        "First option text without letter prefix",
                        "Second option text without letter prefix",
                        "Third option text without letter prefix",
                        "Fourth option text without letter prefix"
                    ],
                    "type": "practical",
                    "difficulty": "Easy/Medium/Hard",
                    "correct_answer": "B"
                }}
            ],
            "answers": ["B", "A", "D", "C", "B"]
        }}
        """
    )
    chain = template | model | parser
    r = chain.invoke({
        "resume_analysis": resume_analysis,
        "github_analysis": github_analysis,
        "skills": skills,
        "recommendation": recommendation,
        "num_questions": num_questions,
        "role_hint": role_hint
    })
    return r

from langchain.prompts import PromptTemplate
import json, re

def final_analysis(resume_analysis: str, github_analysis: str, previous_recommendation: str, test_score: float, test_result: str):
    prompt = PromptTemplate(
        input_variables=["resume_analysis", "github_analysis", "previous_recommendation", "test_score", "test_result"],
        template="""
        You are an expert technical evaluator.
        Based on the following evaluation details, provide a final structured analysis of the candidate.
        Resume Analysis:
        {resume_analysis}
        GitHub Analysis:
        {github_analysis}
        Previous Recommendation:
        {previous_recommendation}
        Test Performance:
        Score: {test_score}%
        Result: {test_result}

        Guidelines:
        - If score >= 80%: star_rating should be between 4.0 and 5.0, highlight strong technical competence in strengths.
        - If score >= 60% and < 80%: star_rating should be between 3.2 and 4.0, recommend "Intermediate".
        - If score < 60%: star_rating between 1.5 and 3.0, list actionable areas to improve.

        Return ONLY a valid JSON object in this exact structure:
        {{
            "star_rating": 4.5,
            "strengths": ["Clear strength 1", "Clear strength 2", "Clear strength 3"],
            "weaknesses": ["Targeted improvement area 1", "Targeted improvement area 2"],
            "recommended_tags": ["Intermediate"]
        }}
        Do not include markdown code fences (```) or extra conversational text.
        """
    )
    parser = StrOutputParser()
    chain = prompt | model | parser
    response = chain.invoke({
        "resume_analysis": resume_analysis,
        "github_analysis": github_analysis,
        "previous_recommendation": previous_recommendation,
        "test_score": test_score,
        "test_result": test_result
    })
    return response
