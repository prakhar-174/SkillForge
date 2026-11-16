import logging
from django.contrib.auth import get_user_model

from accounts.models import *
from .models import *
from proctor.models import Exam, ExamSession
from .utils.pdf_utils import extract_text_from_pdf_fileobj
from .utils.git_utils import fetch_github_profile
from .utils.langchain_utils import *
from django.utils import timezone
User = get_user_model()
logger = logging.getLogger(__name__)

def generate_partial_report(student_id: int):
  

    try:
        user = User.objects.get(id=student_id)
        profile: StudentProfile = user.student_profile

        report, _ = StudentReport.objects.get_or_create(student=profile)

   
        resume_analysis = {}

        if profile.resume:
            text = extract_text_from_pdf_fileobj(profile.resume)
            resume_analysis = analyze_resume(text)

        github_analysis = {}

        if profile.github_url:
            username = profile.github_url.rstrip("/").split("/")[-1]
            github_data = fetch_github_profile(username)
            github_analysis = analyze_github_profile(str(github_data))

        summary = generate_final_report(
            resume_analysis,
            github_analysis
        )

      
        report.report_summary = {
            "stage": "temporary",
            "resume_analysis": resume_analysis,
            "github_analysis": github_analysis,
            "summary": summary,
        }

        report.save()

        return report

    except Exception:
        logger.exception("Partial report generation failed")

        StudentReport.objects.update_or_create(
            student_id=student_id,
            defaults={
                "report_summary": {
                    "error": "AI analysis failed. Please retry."
                }
            }
        )

        return None



import random

DOMAIN_FALLBACK_QUESTIONS = {
    "Frontend Development": [
        {
            "question": "You are building a high-traffic e-commerce catalog in React. When users quickly type into a search filter, the component re-renders 50 times a second and causes noticeable frame drops. How should you optimize this search input?",
            "options": [
                "Place the input value in a global Redux store and dispatch actions synchronously on every keystroke.",
                "Debounce the filter state update and wrap the product list in React.memo with useMemo for filtered results.",
                "Replace React with jQuery to directly manipulate the DOM elements for faster input rendering.",
                "Use useEffect to force-update the parent component on every render cycle."
            ],
            "type": "practical",
            "difficulty": "Medium",
            "correct_answer": "B"
        },
        {
            "question": "A team member reports that a component in Next.js using Server-Side Rendering (SSR) throws hydration mismatch warnings in production. What is the most likely root cause?",
            "options": [
                "Rendering client-only values like localStorage, window.innerWidth, or new Date() directly during server render without mounting checks.",
                "Using Tailwind CSS utility classes inside server components.",
                "Passing serialized JSON props from getServerSideProps to a child component.",
                "Importing React icons into a client component."
            ],
            "type": "practical",
            "difficulty": "Hard",
            "correct_answer": "A"
        },
        {
            "question": "When building an interactive dashboard with deep nested widgets needing access to user authentication and theme state without prop drilling, which approach offers optimal balance between simplicity and re-render isolation?",
            "options": [
                "Store user and theme state in window global variables and poll with setInterval.",
                "Use a lightweight context or state manager like Zustand/Context API with split selectors to avoid re-rendering untouched widgets.",
                "Drill props through 12 levels of intermediate container components.",
                "Force all dashboard widgets to share a single monolithic useState hook at the root."
            ],
            "type": "practical",
            "difficulty": "Medium",
            "correct_answer": "B"
        },
        {
            "question": "To improve Largest Contentful Paint (LCP) and Cumulative Layout Shift (CLS) on a media-heavy landing page, what is the best practice?",
            "options": [
                "Load all images in uncompressed PNG format using standard HTML img tags without dimensions.",
                "Specify explicit width/height dimensions on images, use modern formats (WebP/AVIF), and prioritize the hero image with fetchpriority='high'.",
                "Inline all image assets as base64 strings directly in the CSS bundle.",
                "Disable browser caching completely so images are always downloaded fresh."
            ],
            "type": "practical",
            "difficulty": "Easy",
            "correct_answer": "B"
        },
        {
            "question": "In React 18, what is the primary benefit of useTransition and startTransition over standard setState?",
            "options": [
                "It automatically converts client components into backend Node.js worker threads.",
                "It marks state updates as non-urgent transitions, keeping the user interface responsive to high-priority events like clicks and typing.",
                "It cancels all network requests if the user scrolls the page.",
                "It mutates state directly in place without triggering a re-render."
            ],
            "type": "practical",
            "difficulty": "Hard",
            "correct_answer": "B"
        }
    ],
    "Backend Development": [
        {
            "question": "A REST API endpoint retrieving user posts experiences extreme slowdowns as the database grows to 1,000,000 rows. The query performs a JOIN between users and posts with filtering on post created_at. How should you resolve this?",
            "options": [
                "Add composite indexes on (user_id, created_at) and implement keyset/cursor-based pagination instead of deep OFFSET queries.",
                "Fetch all 1,000,000 rows into server memory and filter in Python using list comprehension.",
                "Disable all foreign key constraints in the database.",
                "Increase the database connection timeout to 10 minutes."
            ],
            "type": "practical",
            "difficulty": "Medium",
            "correct_answer": "A"
        },
        {
            "question": "How should JWT (JSON Web Token) authentication be designed to allow immediate token invalidation when a user clicks 'Log out from all devices'?",
            "options": [
                "Wait 7 days for the client-side JWT to expire naturally without any backend tracking.",
                "Maintain a token blacklist in Redis with expiration matching the token lifetime, or track a user token_version counter in the database.",
                "Change the database root password each time a user logs out.",
                "Delete the client browser cookie using HTTP headers only."
            ],
            "type": "practical",
            "difficulty": "Medium",
            "correct_answer": "B"
        },
        {
            "question": "Your backend service receives 10,000 concurrent webhooks per second from a payment provider. Directly writing each event to the database causes connection pool exhaustion. How should you architect this?",
            "options": [
                "Drop webhooks randomly until the database load stabilizes.",
                "Acknowledge webhook requests immediately (HTTP 200) after enqueuing them to a message broker (RabbitMQ/Kafka/Redis Streams) for worker consumption.",
                "Open a new database connection per thread with unlimited pool size.",
                "Switch from relational database to a flat text file on disk."
            ],
            "type": "practical",
            "difficulty": "Hard",
            "correct_answer": "B"
        },
        {
            "question": "What is the primary danger of the 'N+1 query problem' in ORMs (like Django ORM or Prisma), and how is it resolved?",
            "options": [
                "It causes database tables to be duplicated; resolve by renaming models.",
                "It fires a separate SQL query for each child record in a loop; resolve by using select_related (joins) or prefetch_related (batch querying).",
                "It generates negative primary keys; resolve by resetting auto-increment sequences.",
                "It prevents database backups from completing on time."
            ],
            "type": "practical",
            "difficulty": "Easy",
            "correct_answer": "B"
        },
        {
            "question": "When designing an idempotent payment charge endpoint in a distributed backend system, what mechanism guarantees a user is never double-charged during network retries?",
            "options": [
                "Relying solely on the client IP address to reject duplicate requests within 1 minute.",
                "Requiring a unique client-generated Idempotency-Key header, checked atomically against an in-flight/completed transaction cache.",
                "Refusing all request retries from any client.",
                "Executing payment charges in a non-transactional background thread without logging."
            ],
            "type": "practical",
            "difficulty": "Hard",
            "correct_answer": "B"
        }
    ],
    "Full Stack Development": [
        {
            "question": "In a modern full-stack web application, how should sensitive secrets like API keys and database credentials be safely handled?",
            "options": [
                "Hardcode them into the frontend React bundle inside public environment variables.",
                "Store them strictly in server environment variables (.env / secrets vault) and never expose them in client-side code bundles.",
                "Save them in the user's localStorage so they can be read by both frontend and backend.",
                "Include secrets in the URL query parameters of API requests."
            ],
            "type": "practical",
            "difficulty": "Easy",
            "correct_answer": "B"
        },
        {
            "question": "A full-stack collaborative editor needs real-time state synchronization between multiple clients with conflict resolution. What is the most robust architecture?",
            "options": [
                "Full page reloads via HTTP polling every 500 milliseconds.",
                "WebSockets combined with CRDTs (Conflict-free Replicated Data Types) or Operational Transformation (OT) for seamless peer merging.",
                "Writing entire documents directly to localStorage and comparing timestamps on upload.",
                "Locking the entire document so only one user can open it per day."
            ],
            "type": "practical",
            "difficulty": "Hard",
            "correct_answer": "B"
        },
        {
            "question": "How should Cross-Origin Resource Sharing (CORS) and authentication cookies be configured when the frontend is at app.domain.com and backend API is at api.domain.com?",
            "options": [
                "Set Access-Control-Allow-Origin: * and allow cookies with credentials: include.",
                "Set specific allowed origin, enable Access-Control-Allow-Credentials: true, and use SameSite=None; Secure for cross-origin cookies or share root domain cookies.",
                "Disable HTTPS completely across both subdomains.",
                "Tunnel all API requests through client-side WebRTC data channels."
            ],
            "type": "practical",
            "difficulty": "Medium",
            "correct_answer": "B"
        },
        {
            "question": "To achieve optimistic UI updates without exposing users to broken data if a backend mutation fails, what pattern should the frontend follow?",
            "options": [
                "Immediately update local UI cache, send API request, and roll back to previous snapshot with error notification if the server returns an error.",
                "Disable all buttons and freeze the screen until the backend finishes persisting.",
                "Assume the server will always succeed and never check backend response status.",
                "Re-fetch the entire database on every click."
            ],
            "type": "practical",
            "difficulty": "Medium",
            "correct_answer": "A"
        },
        {
            "question": "When migrating database schema in a continuous deployment full-stack setup with zero downtime, what strategy should be followed?",
            "options": [
                "Drop old columns immediately before deploying new application code.",
                "Follow expand-and-contract: add new columns, deploy code writing to both, backfill data, switch reads, then safely deprecate old columns.",
                "Take down the production server for a 6-hour maintenance window on every minor migration.",
                "Allow client code to execute raw SQL DDL queries directly from the browser."
            ],
            "type": "practical",
            "difficulty": "Hard",
            "correct_answer": "B"
        }
    ],
    "Mobile App Development": [
        {
            "question": "A mobile application displays infinite scrolling lists of products. Users experience severe memory spikes and crashes on older Android and iOS devices. What is the recommended fix?",
            "options": [
                "Render all 5,000 products in a standard ScrollView without recycling.",
                "Use windowed/virtualized lists (like FlatList/FlashList) with windowSize optimization and cached image components.",
                "Preload all full-resolution product images on app splash screen.",
                "Disable garbage collection on the mobile JavaScript runtime."
            ],
            "type": "practical",
            "difficulty": "Medium",
            "correct_answer": "B"
        },
        {
            "question": "How should a mobile application handle offline data entry so users can create orders in areas with spotty connectivity?",
            "options": [
                "Block the user with an alert dialog whenever offline and prevent app usage.",
                "Store actions in an encrypted local database (SQLite/WatermelonDB) with a sync engine that pushes queued mutations when connectivity restores.",
                "Save orders as plain text files in the public device downloads folder.",
                "Send continuous UDP packets until the cell tower replies."
            ],
            "type": "practical",
            "difficulty": "Hard",
            "correct_answer": "B"
        },
        {
            "question": "What is the primary difference between Universal Links (iOS) / App Links (Android) and custom URL schemes (myapp://)?",
            "options": [
                "Custom URL schemes are verified by Apple/Google domains; Universal Links are not.",
                "Universal Links use standard HTTPS URLs verified via server association files (apple-app-site-association), providing security and fallback to website.",
                "Universal Links only function when the device is in airplane mode.",
                "Custom schemes cannot pass query parameters."
            ],
            "type": "practical",
            "difficulty": "Medium",
            "correct_answer": "B"
        },
        {
            "question": "To secure sensitive tokens (e.g. Refresh Token) on mobile devices against extraction on rooted or jailbroken devices, what storage mechanism must be used?",
            "options": [
                "AsyncStorage or SharedPreferences in plain text JSON.",
                "Hardware-backed secure keystore: iOS Keychain Services and Android Keystore (EncryptedSharedPreferences).",
                "Hardcoded inside the compiled mobile binary assets.",
                "Stored in the user's mobile photo gallery as metadata."
            ],
            "type": "practical",
            "difficulty": "Easy",
            "correct_answer": "B"
        },
        {
            "question": "In React Native's New Architecture (Fabric & TurboModules), what replaced the asynchronous JSON bridge?",
            "options": [
                "HTTP REST calls over localhost port 8080.",
                "JSI (JavaScript Interface), allowing direct synchronous C++ memory references and shared ownership between JS and native runtimes.",
                "WebSockets running in a background service worker.",
                "Base64 encoded string pipes through standard input/output."
            ],
            "type": "practical",
            "difficulty": "Hard",
            "correct_answer": "B"
        }
    ],
    "AI / Machine Learning & Data Science": [
        {
            "question": "You train a gradient boosting model on tabular customer data. The training accuracy is 99.4% but validation accuracy is 68.2%. What is happening, and how should you address it?",
            "options": [
                "The model is underfitting; increase tree depth and remove regularization.",
                "The model is severely overfitting; apply L1/L2 regularization, reduce max depth, introduce early stopping, and review cross-validation splits.",
                "Data is perfectly balanced; immediately deploy to production.",
                "Convert all numerical features to raw unstructured text."
            ],
            "type": "practical",
            "difficulty": "Easy",
            "correct_answer": "B"
        },
        {
            "question": "When building a Retrieval-Augmented Generation (RAG) pipeline with LLMs, users report that retrieved context chunks frequently cut off sentences and omit critical definitions. What is the most effective chunking remedy?",
            "options": [
                "Chunk strictly by character count of 50 characters with 0 overlap.",
                "Implement semantic chunking or recursive text splitting with 15-20% chunk overlap and metadata filtering.",
                "Pass the entire 500-page PDF as a single vector into cosine distance calculation.",
                "Disable embeddings and use random line sampling."
            ],
            "type": "practical",
            "difficulty": "Medium",
            "correct_answer": "B"
        },
        {
            "question": "What is data leakage in a predictive modeling pipeline, and how is it prevented during preprocessing?",
            "options": [
                "When data is deleted accidentally; prevent by backing up SQLite files.",
                "When information from the test/target set inadvertently influences training (e.g., fitting scalers on all data before splitting); prevent by fitting transformations strictly on training fold.",
                "When GPU memory overflows during batch generation.",
                "When numerical values exceed 32-bit floating point precision."
            ],
            "type": "practical",
            "difficulty": "Medium",
            "correct_answer": "B"
        },
        {
            "question": "Why is ROC-AUC often misleading when evaluating fraud detection models where only 0.1% of transactions are fraudulent, and what metric is preferred?",
            "options": [
                "ROC-AUC can look artificially high due to the overwhelming number of true negatives; Precision-Recall AUC (PR-AUC) or F1-Score is more informative.",
                "ROC-AUC cannot be calculated for binary classification tasks.",
                "Accuracy is always the only valid metric for extreme class imbalance.",
                "ROC-AUC only works on neural networks, not gradient boosted trees."
            ],
            "type": "practical",
            "difficulty": "Hard",
            "correct_answer": "A"
        },
        {
            "question": "In Large Language Model fine-tuning, why is LoRA (Low-Rank Adaptation) vastly more parameter-efficient than full parameter fine-tuning?",
            "options": [
                "It deletes 90% of model weights before training begins.",
                "It freezes pretrained weights and injects trainable rank decomposition matrices into transformer layers, drastically reducing trainable parameters and VRAM requirements.",
                "It forces the model to run on CPU without floating point arithmetic.",
                "It converts text tokens into ASCII code sums."
            ],
            "type": "practical",
            "difficulty": "Hard",
            "correct_answer": "B"
        }
    ],
    "DevOps & Cloud Engineering": [
        {
            "question": "A production containerized app running on Kubernetes frequently gets killed with status OOMKilled (Exit Code 137). How should this be diagnosed and resolved?",
            "options": [
                "Inspect memory consumption trends, identify application memory leaks, and tune container resources.requests.memory and resources.limits.memory with appropriate headroom.",
                "Increase the pod restartPolicy to 'Never' so it stays running.",
                "Delete the Kubernetes deployment and run the container manually with sudo.",
                "Disable all health checks and liveness probes."
            ],
            "type": "practical",
            "difficulty": "Medium",
            "correct_answer": "A"
        },
        {
            "question": "To build minimal and secure Docker container images for a Node.js or Go application, what containerization practice is best?",
            "options": [
                "Include the full Ubuntu desktop OS, build compilers, and all test dependencies in the final production image.",
                "Use multi-stage builds: compile in a build stage, and copy only the compiled binary or production artifacts into a minimal distroless or alpine base image.",
                "Run the container as the root user with privileged mode enabled.",
                "Store production secrets directly inside the Dockerfile ENV commands."
            ],
            "type": "practical",
            "difficulty": "Easy",
            "correct_answer": "B"
        },
        {
            "question": "How does Terraform ensure state consistency and prevent simultaneous conflicting updates when multiple engineers or CI/CD runners apply changes?",
            "options": [
                "By writing the state file directly to git commit history.",
                "By using remote backend state storage (e.g., S3/GCS) coupled with distributed state locking (e.g., DynamoDB lock table).",
                "By running Terraform only on local laptops without internet access.",
                "By ignoring errors and forcing execution with -auto-approve."
            ],
            "type": "practical",
            "difficulty": "Medium",
            "correct_answer": "B"
        },
        {
            "question": "In a Zero-Downtime deployment pipeline, what is the key difference between Blue/Green deployment and Canary deployment?",
            "options": [
                "Blue/Green switches 100% of traffic between two identical production environments after verification; Canary gradually routes a small percentage (e.g. 5%) of traffic to test stability before full rollout.",
                "Blue/Green works only on frontend; Canary works only on databases.",
                "Canary deployments require stopping all running servers for 30 minutes.",
                "Blue/Green cannot be automated via CI/CD pipelines."
            ],
            "type": "practical",
            "difficulty": "Hard",
            "correct_answer": "A"
        },
        {
            "question": "What is the primary role of a Kubernetes PodDisruptionBudget (PDB)?",
            "options": [
                "It monitors cloud billing and shuts down pods if monthly cloud budget is exceeded.",
                "It specifies the minimum number or percentage of replicated pods that must stay available during voluntary disruptions like node upgrades.",
                "It restarts the cluster every midnight to clean memory caches.",
                "It encrypts pod network traffic using TLS 1.3."
            ],
            "type": "practical",
            "difficulty": "Hard",
            "correct_answer": "B"
        }
    ],
    "UI/UX Design & Product": [
        {
            "question": "According to WCAG 2.1 AA standards, what is the minimum contrast ratio required for normal body text against its background?",
            "options": [
                "2.0 : 1",
                "4.5 : 1 (and 3.0 : 1 for large/bold text)",
                "10.0 : 1 for all elements",
                "Contrast does not matter if font weight is 700"
            ],
            "type": "practical",
            "difficulty": "Easy",
            "correct_answer": "B"
        },
        {
            "question": "When designing a complex enterprise form with 30+ input fields, what layout strategy maximizes user completion rate and minimizes cognitive fatigue?",
            "options": [
                "Put all 30 fields in a single dense column without headers or sections.",
                "Chunk into a multi-step progressive disclosure wizard with clear progress indicators, autofill support, and contextual inline validation.",
                "Display fields in a 6-column grid with tiny 8px font sizes.",
                "Hide error messages until the user clicks submit 3 times."
            ],
            "type": "practical",
            "difficulty": "Medium",
            "correct_answer": "B"
        },
        {
            "question": "In design systems architecture in Figma, why are semantic design tokens (e.g., color-surface-primary, space-md) preferred over raw values (#FFFFFF, 16px)?",
            "options": [
                "They prevent Figma from saving changes to cloud storage.",
                "They decouple visual design decisions from raw values, enabling scalable theme switching (Dark/Light mode) and consistent platform-wide synchronization.",
                "They automatically generate backend database schemas.",
                "They eliminate the need for designers to test usability."
            ],
            "type": "practical",
            "difficulty": "Medium",
            "correct_answer": "B"
        },
        {
            "question": "During user research, analytics reveal a 72% drop-off at the final checkout payment step. What qualitative UX method should be conducted first to uncover the root problem?",
            "options": [
                "Immediately redesign the entire website logo and branding colors.",
                "Conduct moderated usability testing or review session recordings and heatmaps on the checkout flow to observe where users hesitate or encounter friction.",
                "Send an angry email blast to dropped-off users.",
                "Double the price of all items to recover lost revenue."
            ],
            "type": "practical",
            "difficulty": "Hard",
            "correct_answer": "B"
        },
        {
            "question": "What UX principle describes that the time required to rapidly move to a target area is a function of the target's distance and size?",
            "options": [
                "Hick's Law",
                "Fitts's Law",
                "Miller's Law",
                "Jakob's Law"
            ],
            "type": "practical",
            "difficulty": "Hard",
            "correct_answer": "B"
        }
    ],
    "Cybersecurity": [
        {
            "question": "A web application has a search endpoint vulnerable to SQL Injection. Which mitigation guarantees protection across the entire application?",
            "options": [
                "Using parameterized queries / prepared statements through an ORM and never concatenating raw user input directly into SQL queries.",
                "Filtering out the word 'SELECT' from search queries using regex.",
                "Converting all SQL database tables to CSV spreadsheets.",
                "Running the database server on port 80 instead of 5432."
            ],
            "type": "practical",
            "difficulty": "Easy",
            "correct_answer": "A"
        },
        {
            "question": "How does a Cross-Site Request Forgery (CSRF) attack work against session-based web applications, and what is the standard defense?",
            "options": [
                "The attacker extracts database passwords via memory dump; defended by rebooting servers daily.",
                "An unauthorized site tricks the victim's browser into sending authenticated requests using ambient session cookies; defended using anti-CSRF tokens (SameSite cookies + double submit cookie pattern).",
                "The attacker floods the network with ping requests; defended by changing DNS records.",
                "The user types a wrong password 3 times."
            ],
            "type": "practical",
            "difficulty": "Medium",
            "correct_answer": "B"
        },
        {
            "question": "When storing user passwords in a backend database, what cryptographic algorithm and parameter setting is recommended today?",
            "options": [
                "Plain MD5 or SHA-1 hashes for fast indexing.",
                "Slow, salted, adaptive key-derivation functions like Argon2id or bcrypt with appropriate work factor/cost.",
                "Symmetric encryption like AES-256 with key stored in database.",
                "Base64 encoding without salt."
            ],
            "type": "practical",
            "difficulty": "Medium",
            "correct_answer": "B"
        },
        {
            "question": "To prevent Cross-Site Scripting (XSS) attacks in modern web applications, which combination of defensive layers is essential?",
            "options": [
                "Context-aware output encoding/sanitization (e.g. DOMPurify), strict Content Security Policy (CSP) headers, and HttpOnly cookie flags.",
                "Disabling JavaScript for all users worldwide.",
                "Allowing users to post raw unescaped script tags in profile bios.",
                "Using HTTP instead of HTTPS."
            ],
            "type": "practical",
            "difficulty": "Hard",
            "correct_answer": "A"
        },
        {
            "question": "What is the primary risk of Server-Side Request Forgery (SSRF) in cloud environments like AWS or GCP?",
            "options": [
                "It makes the frontend website load slowly in mobile browsers.",
                "An attacker tricks the server into making requests to internal loopback resources, including the cloud Instance Metadata Service (169.254.169.254) to steal IAM credentials.",
                "It deletes all client-side browser cookies.",
                "It causes git merge conflicts in deployment repositories."
            ],
            "type": "practical",
            "difficulty": "Hard",
            "correct_answer": "B"
        }
    ]
}

def clean_option_text(opt):
    if not isinstance(opt, str):
        return str(opt)
    opt = opt.strip()
    return re.sub(r"^[\(\[]?[A-Da-d][\)\]\.\:\-]\s*", "", opt).strip()

def evaluate_answer(question: dict, submitted_answer) -> bool:
    if submitted_answer is None:
        return False
        
    correct_raw = str(question.get("correct_answer", "")).strip()
    m_correct = re.match(r"^[\(\[]?([A-Da-d])[\)\]\.\:\-]?\s*(.*)", correct_raw)
    correct_letter = m_correct.group(1).upper() if m_correct else correct_raw.upper()
    correct_text_from_ans = m_correct.group(2).strip() if m_correct else ""

    options = question.get("options", [])
    correct_idx = -1
    if len(correct_letter) == 1 and 'A' <= correct_letter <= 'Z':
        correct_idx = ord(correct_letter) - ord('A')

    if isinstance(submitted_answer, dict):
        sub_val = submitted_answer.get("letter") or submitted_answer.get("value") or submitted_answer.get("answer") or ""
    else:
        sub_val = str(submitted_answer).strip()

    # Match 1: Single letter match (e.g. "B" == "B")
    m_sub = re.match(r"^[\(\[]?([A-Da-d])[\)\]\.\:\-]?\s*(.*)", sub_val)
    if m_sub:
        sub_letter = m_sub.group(1).upper()
        if sub_letter == correct_letter:
            return True

    # Match 2: Text match with corresponding option text
    sub_clean = re.sub(r"^[\(\[]?[A-Da-d][\)\]\.\:\-]\s*", "", sub_val).strip().lower()
    
    if 0 <= correct_idx < len(options):
        correct_option_clean = re.sub(r"^[\(\[]?[A-Da-d][\)\]\.\:\-]\s*", "", str(options[correct_idx])).strip().lower()
        if sub_clean == correct_option_clean:
            return True

    # Match 3: If candidate submitted full text matching correct_text_from_ans
    if correct_text_from_ans and sub_clean == correct_text_from_ans.lower():
        return True

    return False

def generate_skill_test_for_student(student_id: int, category_id: int | None = None, domain: str | None = None, skills: list | str | None = None):
    try:
        user = User.objects.get(id=student_id)
        report, _ = StudentReport.objects.get_or_create(student=user.student_profile)
        summary = report.report_summary or {}

        # 1. Determine Category / Domain
        target_domain = ""
        if domain and str(domain).strip():
            target_domain = str(domain).strip()
            category, _ = SkillCategory.objects.get_or_create(name=target_domain)
        elif category_id:
            try:
                category = SkillCategory.objects.get(id=category_id)
                target_domain = category.name
            except SkillCategory.DoesNotExist:
                category, _ = SkillCategory.objects.get_or_create(name="Frontend Development")
                target_domain = "Frontend Development"
        else:
            user_skills = []
            if user.student_profile.skills:
                user_skills = [s.strip() for s in user.student_profile.skills.split(",") if s.strip()]
            
            if not user_skills:
                resume_data = summary.get("resume_analysis", {})
                if isinstance(resume_data, dict):
                    user_skills += resume_data.get("skills", [])

            primary_skill = user_skills[0] if user_skills else "Frontend Development"
            target_domain = primary_skill.title()
            category, _ = SkillCategory.objects.get_or_create(name=target_domain)

        # 2. Collect skills string
        skills_str = ""
        if skills:
            if isinstance(skills, list):
                skills_str = ", ".join([str(s).strip() for s in skills if s])
            else:
                skills_str = str(skills).strip()
        
        if not skills_str and user.student_profile.skills:
            skills_str = user.student_profile.skills

        if not skills_str:
            skills_str = target_domain

        # 3. Try generating questions via Gemini AI
        generated_questions = []
        try:
            payload = generate_test(
                resume_analysis=str(summary.get("resume_analysis", "")),
                github_analysis=str(summary.get("github_analysis", "")),
                skills=skills_str,
                recommendation=str(summary.get("summary", "")),
                num_questions=5,
                role_hint=target_domain
            )

            raw_questions = payload.get("questions", []) if isinstance(payload, dict) else []
            for q in raw_questions:
                raw_opts = q.get("options", [])
                cleaned_opts = [clean_option_text(o) for o in raw_opts]

                raw_ans = str(q.get("correct_answer", "A")).strip()
                ans_match = re.match(r"^[\(\[]?([A-Da-d])[\)\]\.\:\-]?\s*", raw_ans)
                correct_letter = ans_match.group(1).upper() if ans_match else "A"

                generated_questions.append({
                    "question": q.get("question", ""),
                    "options": cleaned_opts,
                    "type": q.get("type", "practical"),
                    "difficulty": q.get("difficulty", "Medium"),
                    "correct_answer": correct_letter,
                })
        except Exception:
            logger.exception("AI test generation failed or timed out, utilizing domain question bank")

        # 4. Fallback if AI returned 0 questions
        if len(generated_questions) < 5:
            # Look up closest domain in fallback bank
            matched_pool = None
            for key, bank in DOMAIN_FALLBACK_QUESTIONS.items():
                if key.lower() in target_domain.lower() or target_domain.lower() in key.lower():
                    matched_pool = bank
                    break
            
            if not matched_pool:
                matched_pool = DOMAIN_FALLBACK_QUESTIONS["Frontend Development"]

            # Sample questions to ensure freshness
            shuffled = list(matched_pool)
            random.shuffle(shuffled)
            needed = 5 - len(generated_questions)
            generated_questions.extend(shuffled[:needed])

        # 5. Create SkillTestAttempt
        attempt = SkillTestAttempt.objects.create(
            user=user,
            category=category,
            generated_questions=generated_questions,
            total_questions=len(generated_questions),
        )

        # Create Proctor Session
        exam, _ = Exam.objects.get_or_create(
            title=f"{category.name} Assessment", 
            defaults={"duration_minutes": 30}
        )
        session = ExamSession.objects.create(user=user, exam=exam)
        
        attempt.proctor_session = session
        attempt.save()

        return attempt

    except Exception:
        logger.exception("Skill test generation failed completely")
        raise

def submit_skill_test(student_id: int, attempt_id: int, answers: list):
    try:
        user = User.objects.get(id=student_id)
        attempt = SkillTestAttempt.objects.get(id=attempt_id, user=user)
        report, _ = StudentReport.objects.get_or_create(student=user.student_profile)

        session = attempt.proctor_session
        if session and session.is_flagged:
            return {
                "status": "flagged",
                "risk_score": session.risk_score,
                "message": "Test disqualified due to suspicious activity"
            }

        # Accurate grading using evaluate_answer helper
        correct = 0
        for i, question in enumerate(attempt.generated_questions):
            sub_ans = answers[i] if i < len(answers) else None
            if evaluate_answer(question, sub_ans):
                correct += 1

        total = attempt.total_questions or len(attempt.generated_questions) or 5
        percentage = round((correct / total) * 100, 1) if total else 0.0
        passed = percentage >= 60.0

        attempt.submitted_answers = answers
        attempt.score = correct
        attempt.percentage = percentage
        attempt.passed = passed
        attempt.completed_at = timezone.now()
        attempt.is_evaluated = True
        attempt.save()

        # Run AI final evaluation with the verified score
        final_report = None
        try:
            final_report = final_analysis(
                str(report.report_summary.get("resume_analysis", "")),
                str(report.report_summary.get("github_analysis", "")),
                str(report.report_summary.get("summary", "")),
                percentage,
                "PASS" if passed else "FAIL"
            )
        except Exception:
            logger.exception("AI final_analysis failed, using structured fallback")

        # Parse final report JSON
        parsed_report = {}
        if isinstance(final_report, str):
            try:
                cleaned = re.sub(r"```json|```", "", final_report).strip()
                parsed_report = json.loads(cleaned)
            except Exception:
                pass

        if not parsed_report and isinstance(final_report, dict):
            parsed_report = final_report

        if not parsed_report:
            if passed:
                parsed_report = {
                    "star_rating": round(3.5 + (percentage / 50.0), 1),
                    "strengths": [
                        f"Demonstrated verified competence in {attempt.category.name} ({percentage}% score)",
                        "Solid grasp of practical engineering trade-offs and best practices",
                        "High potential for freelance project delivery and technical ownership"
                    ],
                    "weaknesses": [
                        "Continue honing specialized edge-case handling under production loads",
                        "Expand portfolio documentation with measurable impact metrics"
                    ],
                    "recommended_tags": ["Intermediate" if percentage < 80 else "Expert"]
                }
            else:
                parsed_report = {
                    "star_rating": round(max(1.0, percentage / 25.0), 1),
                    "strengths": [
                        f"Foundational interest in {attempt.category.name}",
                        "Active commitment to technical skills verification"
                    ],
                    "weaknesses": [
                        f"Score of {percentage}% indicates need to review core {attempt.category.name} patterns",
                        "Recommended to practice architectural scenarios and debugging challenges"
                    ],
                    "recommended_tags": ["Beginner"]
                }

        # Calculate and clamp star_rating between 1.0 and 5.0
        star_rating = float(parsed_report.get("star_rating", round(percentage / 20.0, 1)))
        star_rating = min(5.0, max(1.0, star_rating))
        parsed_report["star_rating"] = star_rating

        # Save rating to StudentProfile
        profile = user.student_profile
        profile.rating = star_rating
        if attempt.category and attempt.category.name:
            profile.primary_domain = attempt.category.name
        profile.save(update_fields=["rating", "primary_domain"])

        # Update StudentReport
        report.skill_test_score = percentage
        if not report.report_summary:
            report.report_summary = {}
        report.report_summary["final"] = parsed_report
        report.report_summary["stage"] = "verified" if passed else "needs_improvement"
        report.save()

        # Recalculate student points
        try:
            from accounts.streak_utils import calculate_student_points
            calculate_student_points(profile)
        except Exception:
            pass

        return {
            "status": "completed",
            "score": correct,
            "total": total,
            "percentage": percentage,
            "passed": passed,
            "analysis": parsed_report
        }

    except Exception:
        logger.exception("Submit test failed")
        raise





def get_final_analysis(student_id: int):
  
    report = StudentReport.objects.get(
        student__user_id=student_id
    )

    summary = report.report_summary or {}

    return {
        "stage": summary.get("stage", "temporary"),

        "personality_score": report.personality_score,
        "skill_test_score": report.skill_test_score,

        "resume_analysis": summary.get("resume_analysis"),
        "github_analysis": summary.get("github_analysis"),

        "partial_summary": summary.get("summary"),
        "final_analysis": summary.get("final"),
    }




from .personality_data import PERSONALITY_QUESTIONS



def submit_personality_assessment(user, answers):
    total = 0

    for q in PERSONALITY_QUESTIONS:
        choice = answers.get(str(q["id"]))
        if choice:
            total += q["options"].get(choice, 0)

    if total >= 24:
        level = "fast"
    elif total >= 16:
        level = "average"
    else:
        level = "slow"

    attempt = PersonalityAttempt.objects.create(
        user=user,
        answers=answers,
        total_score=total,
        learning_level=level
    )

    report = StudentReport.objects.get(student=user.student_profile)
    report.personality_score = total
    report.save()

    try:
        from accounts.streak_utils import calculate_student_points
        calculate_student_points(user.student_profile)
    except Exception:
        pass

    return {
        "score": total,
        "learning_level": level
    }
import json
import re


def get_recommendation(student_id: int):
    try:
        report = StudentReport.objects.get(
            student__user_id=student_id
        )
    except StudentReport.DoesNotExist:
        return {
            "status": "not_ready",
            "personality_score": 0,
            "skill_score": 0,
            "stage": "temporary",
            "message": "Complete Phase 1 & Phase 2 assessments to generate your recommendation."
        }

    summary = report.report_summary or {}
    final_data = summary.get("final")

    if not final_data:
        return {
            "status": "not_ready",
            "personality_score": report.personality_score,
            "skill_score": report.skill_test_score,
            "stage": summary.get("stage", "temporary"),
            "message": "Complete Phase 2 Skill Test to unlock your personalized AI recommendation."
        }

    if isinstance(final_data, str):
        try:
            cleaned = re.sub(r"```json|```", "", final_data).strip()
            final_data = json.loads(cleaned)
        except Exception:
            final_data = {"raw_report": final_data}

    # Ensure star_rating exists
    star_rating = final_data.get("star_rating")
    if star_rating is None:
        score_val = report.skill_test_score or 0
        star_rating = max(1.0, min(5.0, round(score_val / 20.0, 1)))

    return {
        "status": "ready",
        **final_data,
        "star_rating": star_rating,
        "personality_score": report.personality_score,
        "skill_score": report.skill_test_score,
        "stage": summary.get("stage", "verified" if (report.skill_test_score or 0) >= 60 else "needs_improvement")
    }
