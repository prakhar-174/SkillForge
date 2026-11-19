import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useThemeStore } from './store/themeStore';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import StudentDashboard from './pages/dashboard/StudentDashboard';
import ClientDashboard from './pages/dashboard/ClientDashboard';
import ClientOnboarding from './pages/client/ClientOnboarding';
import StudentOnboarding from './pages/student/StudentOnboarding';
import AssessmentPage from './pages/student/AssessmentPage';
import PersonalityTest from './pages/student/PersonalityTest';
import UpskillPage from './pages/student/UpskillPage';

// Manages dynamic document title across routes
function PageTitleManager() {
  const location = useLocation();

  useEffect(() => {
    const titles = {
      '/': 'SkillForge | AI-Powered Student Upskilling & Hiring Platform',
      '/auth': 'Sign In & Register | SkillForge',
      '/student/dashboard': 'Student Dashboard | SkillForge',
      '/student/onboarding': 'Digital Identity Setup | SkillForge',
      '/student/assessment': 'Skill Verification Exam | SkillForge',
      '/student/personality-test': 'Personality Archetype Test | SkillForge',
      '/student/upskill': 'AI Learning Roadmap & Upskill | SkillForge',
      '/client/dashboard': 'Recruiter HQ & Candidate Pipeline | SkillForge',
      '/client/onboarding': 'Company Profile Setup | SkillForge',
    };

    document.title = titles[location.pathname] || 'SkillForge | AI-Powered Student Upskilling & Hiring Platform';
  }, [location.pathname]);

  return null;
}

function App() {
  const { theme } = useThemeStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <BrowserRouter>
      <PageTitleManager />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        {/* Redirect generic login/signup routes to /auth */}
        <Route path="/login" element={<Navigate to="/auth" replace />} />
        <Route path="/signup" element={<Navigate to="/auth" replace />} />

        {/* Dashboards */}
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/onboarding" element={<StudentOnboarding />} />
        <Route path="/student/assessment" element={<AssessmentPage />} />
        <Route path="/student/personality-test" element={<PersonalityTest />} />
        <Route path="/student/upskill" element={<UpskillPage />} />
        <Route path="/client/dashboard" element={<ClientDashboard />} />
        <Route path="/client/onboarding" element={<ClientOnboarding />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
