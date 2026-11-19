import { create } from 'zustand';

const API_URL = 'http://localhost:8000/api/accounts';

export const useAuthStore = create((set, get) => ({
    authMode: 'login', // 'login' or 'register'
    setAuthMode: (mode) => set({ authMode: mode }),

    // User State
    user: JSON.parse(localStorage.getItem('user')) || null,
    tokens: JSON.parse(localStorage.getItem('tokens')) || null,
    isAuthenticated: !!localStorage.getItem('tokens'),

    // Registration Wizard State
    step: 1,
    setStep: (step) => set({ step }),
    nextStep: () => set((state) => ({ step: state.step + 1 })),
    prevStep: () => set((state) => ({ step: Math.max(1, state.step - 1) })),

    role: null, // 'student' or 'client'
    setRole: (role) => set({ role }),

    formData: {
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
        termsAgreed: false,
        // Client specific
        phoneNumber: '',
        companyName: '',
        designation: '',
        companySize: '',
        industry: '',
        trainCount: '',
        trainingGoals: [],
        // Student specific
        learningGoal: '',
        experienceLevel: '',
        interests: []
    },

    updateFormData: (data) => set((state) => ({
        formData: { ...state.formData, ...data }
    })),

    // API Actions
    updateUser: (updated) => set((state) => {
        const user = { ...state.user, ...updated };
        localStorage.setItem('user', JSON.stringify(user));
        return { user };
    }),

    login: async (email, password) => {
        try {
            const response = await fetch(`${API_URL}/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.detail || 'Login failed');
            }

            const data = await response.json();

            // Store data
            const user = { email, role: data.role, onboarding_stage: data.onboarding_stage };
            localStorage.setItem('tokens', JSON.stringify(data.tokens));
            localStorage.setItem('user', JSON.stringify(user));

            set({ isAuthenticated: true, user, tokens: data.tokens, role: data.role });
            return user;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    signup: async () => {
        const { formData, role } = get();

        // Prepare payload based on role
        const payload = {
            email: formData.email.trim().toLowerCase(),
            password: formData.password,
            role: role,
            full_name: formData.fullName ? formData.fullName.trim() : '',
            company_name: formData.companyName ? formData.companyName.trim() : ''
        };

        try {
            const response = await fetch(`${API_URL}/register/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                let errorMsg = 'Registration failed. Please check your entries.';
                if (typeof errorData === 'object' && errorData !== null) {
                    const firstKey = Object.keys(errorData)[0];
                    const val = errorData[firstKey];
                    if (Array.isArray(val) && val.length > 0) {
                        errorMsg = val[0];
                    } else if (typeof val === 'string') {
                        errorMsg = val;
                    }
                }
                throw new Error(errorMsg);
            }

            const data = await response.json();
            const user = { email: payload.email, role: role, onboarding_stage: 0, name: formData.fullName };

            // Auto login after signup
            localStorage.setItem('tokens', JSON.stringify(data.tokens));
            localStorage.setItem('user', JSON.stringify(user));

            set({ isAuthenticated: true, user, tokens: data.tokens, role });
            return user;
        } catch (error) {
            console.error('Signup error:', error);
            throw error;
        }
    },

    logout: async () => {
        const { tokens } = get();
        if (tokens?.refresh) {
            try {
                await fetch(`${API_URL}/logout/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokens.access}` },
                    body: JSON.stringify({ refresh: tokens.refresh }),
                });
            } catch (e) { console.error('Logout failed', e); }
        }
        localStorage.removeItem('tokens');
        localStorage.removeItem('user');
        set({ isAuthenticated: false, user: null, tokens: null, role: null, step: 1 });
    },

    resetWizard: () => set({
        step: 1,
        role: null,
        formData: {
            fullName: '',
            email: '',
            password: '',
            confirmPassword: '',
            phoneNumber: '',
            companyName: '',
            designation: '',
            companySize: '',
            industry: '',
            trainCount: '',
            trainingGoals: [],
            learningGoal: '',
            experienceLevel: '',
            interests: []
        }
    })
}));
