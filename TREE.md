# 🌳 FarmVoice Pro - Project Tree Structure

**Project:** FarmVoice Pro - AI-Powered Farming Assistant  
**Version:** 1.0.0  
**Last Updated:** December 3, 2025

---

## 📁 Complete Directory Structure

```
farmvoicePro/
│
├── 📄 Root Configuration Files
│   ├── .gitignore                    # Git ignore patterns
│   ├── package.json                  # Frontend dependencies & scripts
│   ├── package-lock.json             # Locked dependency versions
│   ├── next.config.js                # Next.js configuration
│   ├── next-env.d.ts                 # Next.js TypeScript declarations
│   ├── tsconfig.json                 # TypeScript configuration
│   ├── tailwind.config.ts            # TailwindCSS configuration
│   ├── postcss.config.mjs            # PostCSS configuration
│   ├── README.md                     # Project documentation
│   ├── PROJECT_EVALUATION.md         # Comprehensive evaluation document
│   └── TREE.md                       # This file - project structure
│
├── 📂 app/                           # Next.js App Router (Pages)
│   ├── globals.css                   # Global styles
│   ├── layout.tsx                    # Root layout component
│   ├── page.tsx                      # Landing/Login page
│   │
│   ├── 📂 home/                      # Main dashboard & features
│   │   ├── page.tsx                  # Dashboard home page
│   │   ├── crop-recommendation/      # Crop recommendation page
│   │   │   └── page.tsx
│   │   ├── disease-management/       # Disease diagnosis page
│   │   │   └── page.tsx
│   │   ├── health/                   # Crop health tracking
│   │   │   └── page.tsx
│   │   ├── market-prices/            # Market prices page
│   │   │   └── page.tsx
│   │   ├── profile/                  # User profile page
│   │   │   └── page.tsx
│   │   ├── tasks/                    # Daily tasks page
│   │   │   └── page.tsx
│   │   ├── voice-assistant/          # Voice assistant page
│   │   │   └── page.tsx
│   │   ├── voice-queries/            # Voice query history
│   │   │   └── page.tsx
│   │   └── weather/                  # Weather details page
│   │       └── page.tsx
│   │
│   ├── 📂 crop-selection/            # Crop selection flow
│   │   └── page.tsx
│   │
│   ├── 📂 personal-details/          # Personal details form
│   │   └── page.tsx
│   │
│   └── 📂 settings/                  # App settings
│       └── page.tsx
│
├── 📂 components/                    # React Components (20 files)
│   ├── LoginPage.tsx                 # Login & registration UI
│   ├── Onboarding.tsx                # Multi-step onboarding wizard
│   ├── HomePage.tsx                  # Main dashboard layout
│   ├── DashboardStats.tsx            # Statistics cards
│   ├── WeatherWidget.tsx             # Weather display widget
│   ├── DailyTasks.tsx                # Task management widget
│   ├── Notifications.tsx             # Notifications panel
│   ├── QuickActions.tsx              # Quick action buttons
│   ├── SearchBar.tsx                 # Search functionality
│   ├── CropSelection.tsx             # Crop selection interface
│   ├── CropRecommendation.tsx        # Crop recommendation display
│   ├── CropDashboard.tsx             # Individual crop dashboard
│   ├── CropDetailsModal.tsx          # Crop details modal
│   ├── CropHealthChart.tsx           # Health visualization chart
│   ├── DiseaseManagement.tsx         # Disease diagnosis interface
│   ├── Market.tsx                    # Market prices display
│   ├── VoiceAssistant.tsx            # Voice assistant UI
│   ├── ProfilePage.tsx               # User profile page
│   ├── EnhancedLoader.tsx            # Loading animation
│   └── NewLoader.tsx                 # Alternative loader
│
├── 📂 context/                       # React Context (State Management)
│   └── SettingsContext.tsx           # Global settings & language
│
├── 📂 lib/                           # Utility Libraries
│   ├── api.ts                        # API client functions
│   └── translations.ts               # Multilingual translations
│
├── 📂 types/                         # TypeScript Type Definitions
│   └── speech-recognition.d.ts       # Web Speech API types
│
├── 📂 styles/                        # Additional Styles
│   └── (additional CSS files)
│
├── 📂 public/                        # Static Assets
│   ├── logo.png                      # Main logo
│   ├── logo1.png                     # Logo variant 1
│   ├── logo_icon.png                 # Logo icon
│   └── logo_processed.png            # Processed logo
│
├── 📂 data/                          # Data Files
│   └── downloads/                    # Downloaded datasets
│
├── 📂 backend/                       # FastAPI Backend (Python)
│   ├── 📄 Main Application Files
│   │   ├── main.py                   # FastAPI app (1413 lines, 30+ endpoints)
│   │   ├── crop_recommender.py       # Crop recommendation engine (320 lines)
│   │   ├── web_scraper.py            # Data fetching utilities (932 lines)
│   │   └── notification_service.py   # Notification generation (7312 bytes)
│   │
│   ├── 📄 Configuration Files
│   │   ├── .env                      # Environment variables (DO NOT COMMIT)
│   │   ├── .env.example              # Example environment file
│   │   ├── requirements.txt          # Python dependencies
│   │   └── .gitignore                # Backend git ignore
│   │
│   ├── 📄 Database Files
│   │   ├── supabase_schema.sql       # Complete database schema (10 tables)
│   │   ├── migration_add_location_data.sql  # Location data migration
│   │   └── fix_database_errors.sql   # Database fixes
│   │
│   ├── 📄 Documentation
│   │   ├── README.md                 # Backend documentation
│   │   ├── README_DATABASE_FIX.md    # Database troubleshooting
│   │   └── SETUP_DATABASE.md         # Database setup guide
│   │
│   ├── 📄 Scripts
│   │   ├── run.bat                   # Windows run script
│   │   ├── run.sh                    # Linux/Mac run script
│   │   ├── setup_venv.bat            # Windows venv setup
│   │   └── setup_venv.sh             # Linux/Mac venv setup
│   │
│   ├── 📄 Testing
│   │   ├── test_voice.py             # Voice assistant tests
│   │   └── tests/                    # Test directory
│   │       └── (test files)
│   │
│   ├── 📂 venv/                      # Python Virtual Environment
│   │   ├── Lib/                      # Python libraries
│   │   ├── Scripts/                  # Executables (Windows)
│   │   └── (virtual environment files)
│   │
│   └── 📂 __pycache__/               # Python bytecode cache
│
├── 📂 deliverables/                  # Project Deliverables
│   └── rules/                        # Business rules documentation
│
├── 📂 changes/                       # Change logs & history
│
├── 📂 .next/                         # Next.js Build Output (auto-generated)
│   ├── cache/                        # Build cache
│   ├── server/                       # Server-side code
│   └── static/                       # Static assets
│
├── 📂 node_modules/                  # Frontend Dependencies (auto-generated)
│   ├── next/                         # Next.js framework
│   ├── react/                        # React library
│   ├── react-dom/                    # React DOM
│   ├── framer-motion/                # Animation library
│   ├── recharts/                     # Chart library
│   ├── react-icons/                  # Icon library
│   ├── tailwindcss/                  # CSS framework
│   └── (1000+ other packages)
│
├── 📂 .pytest_cache/                 # Pytest cache (auto-generated)
│
└── 📄 Utility Scripts
    ├── detect_color.py               # Color detection utility
    └── process_logo.py               # Logo processing script
```

---

## 📊 Directory Statistics

### Frontend Structure

| Directory     | Files    | Purpose                   |
| ------------- | -------- | ------------------------- |
| `app/`        | 16 pages | Next.js routing & pages   |
| `components/` | 20 files | Reusable React components |
| `context/`    | 1 file   | Global state management   |
| `lib/`        | 2 files  | Utility functions         |
| `types/`      | 1 file   | TypeScript definitions    |
| `public/`     | 4 files  | Static assets (logos)     |
| `styles/`     | 1+ files | CSS stylesheets           |

**Total Frontend Files:** ~45 source files

---

### Backend Structure

| Directory/File            | Lines of Code | Purpose                         |
| ------------------------- | ------------- | ------------------------------- |
| `main.py`                 | 1,413         | FastAPI application & endpoints |
| `crop_recommender.py`     | 320           | Recommendation engine           |
| `web_scraper.py`          | 932           | Data fetching from APIs         |
| `notification_service.py` | ~200          | Notification generation         |
| `supabase_schema.sql`     | 194           | Database schema                 |
| `tests/`                  | ~100          | Unit tests                      |

**Total Backend Files:** ~10 source files  
**Total Backend Lines:** ~3,500 lines

---

## 🗂️ File Type Breakdown

### Source Code Files

```
TypeScript/TSX Files:
├── Components:        20 files (.tsx)
├── Pages:            16 files (.tsx)
├── Utilities:         2 files (.ts)
├── Types:             1 file (.d.ts)
└── Config:            2 files (.ts, .mjs)
Total:                41 TypeScript files

Python Files:
├── Backend Core:      4 files (.py)
├── Tests:             2 files (.py)
├── Scripts:           2 files (.py)
└── Utilities:         2 files (.py)
Total:                10 Python files

Configuration Files:
├── package.json       (Frontend dependencies)
├── tsconfig.json      (TypeScript config)
├── next.config.js     (Next.js config)
├── tailwind.config.ts (TailwindCSS config)
├── requirements.txt   (Python dependencies)
├── .env.example       (Environment template)
└── .gitignore         (Git ignore rules)
Total:                 7+ config files

Database Files:
├── supabase_schema.sql              (Main schema)
├── migration_add_location_data.sql  (Migration)
└── fix_database_errors.sql          (Fixes)
Total:                 3 SQL files

Documentation Files:
├── README.md                 (Main documentation)
├── PROJECT_EVALUATION.md     (Evaluation doc)
├── TREE.md                   (This file)
├── backend/README.md         (Backend docs)
├── backend/SETUP_DATABASE.md (DB setup)
└── backend/README_DATABASE_FIX.md
Total:                 6 markdown files
```

---

## 📦 Key Dependencies

### Frontend (package.json)

```json
{
  "dependencies": {
    "next": "^14.2.0", // React framework
    "react": "^18.3.0", // UI library
    "react-dom": "^18.3.0", // React DOM
    "react-icons": "^5.2.0", // Icon library
    "framer-motion": "^11.0.0", // Animations
    "recharts": "^2.10.3" // Charts
  },
  "devDependencies": {
    "typescript": "^5.3.3", // TypeScript
    "tailwindcss": "^3.4.1", // CSS framework
    "autoprefixer": "^10.4.17", // CSS processing
    "postcss": "^8.4.33" // CSS processing
  }
}
```

### Backend (requirements.txt)

```txt
fastapi==0.109.0              # Web framework
uvicorn[standard]==0.27.0     # ASGI server
python-dotenv==1.0.0          # Environment variables
supabase==2.10.0              # Database client
pydantic==2.5.3               # Data validation
python-multipart==0.0.6       # File uploads
httpx==0.27.2                 # HTTP client
python-jose[cryptography]==3.3.0  # JWT tokens
passlib[bcrypt]==1.7.4        # Password hashing
bcrypt==4.1.2                 # Encryption
beautifulsoup4==4.12.3        # Web scraping
google-generativeai==0.3.2    # Gemini AI
```

---

## 🎯 Important Files Reference

### Core Application Files

| File Path                          | Purpose                        | Lines  |
| ---------------------------------- | ------------------------------ | ------ |
| `backend/main.py`                  | FastAPI backend, 30+ endpoints | 1,413  |
| `backend/crop_recommender.py`      | Crop recommendation logic      | 320    |
| `backend/web_scraper.py`           | Data fetching from APIs        | 932    |
| `components/CropSelection.tsx`     | Main crop selection UI         | 1,000+ |
| `components/VoiceAssistant.tsx`    | Voice interface                | 400+   |
| `components/DiseaseManagement.tsx` | Disease diagnosis UI           | 300+   |
| `lib/api.ts`                       | Frontend API client            | 250+   |
| `lib/translations.ts`              | Multilingual support           | 1,000+ |

### Configuration Files

| File Path                     | Purpose                        |
| ----------------------------- | ------------------------------ |
| `backend/.env`                | Environment variables (SECRET) |
| `backend/supabase_schema.sql` | Database schema (10 tables)    |
| `package.json`                | Frontend dependencies          |
| `requirements.txt`            | Backend dependencies           |
| `tsconfig.json`               | TypeScript configuration       |
| `tailwind.config.ts`          | TailwindCSS theme              |

### Documentation Files

| File Path                   | Purpose                       |
| --------------------------- | ----------------------------- |
| `README.md`                 | Main project documentation    |
| `PROJECT_EVALUATION.md`     | Comprehensive evaluation      |
| `TREE.md`                   | Project structure (this file) |
| `backend/README.md`         | Backend documentation         |
| `backend/SETUP_DATABASE.md` | Database setup guide          |

---

## 🔍 Directory Purposes

### `/app` - Next.js Pages (App Router)

- **Purpose:** Application routing and page components
- **Structure:** File-based routing (Next.js 14)
- **Key Pages:**
  - `page.tsx` - Login/Landing
  - `home/page.tsx` - Dashboard
  - `home/crop-recommendation/page.tsx` - Crop recommendations
  - `home/disease-management/page.tsx` - Disease diagnosis
  - `home/market-prices/page.tsx` - Market prices
  - `home/voice-assistant/page.tsx` - Voice assistant

### `/components` - React Components

- **Purpose:** Reusable UI components
- **Pattern:** Functional components with hooks
- **Key Components:**
  - `LoginPage.tsx` - Authentication
  - `Onboarding.tsx` - User onboarding flow
  - `HomePage.tsx` - Main dashboard
  - `CropSelection.tsx` - Crop selection interface
  - `VoiceAssistant.tsx` - Voice interaction
  - `DiseaseManagement.tsx` - Disease diagnosis

### `/backend` - Python Backend

- **Purpose:** FastAPI REST API server
- **Structure:** Modular Python application
- **Key Modules:**
  - `main.py` - API endpoints & authentication
  - `crop_recommender.py` - Recommendation engine
  - `web_scraper.py` - External data fetching
  - `notification_service.py` - Notifications

### `/lib` - Utility Libraries

- **Purpose:** Shared utility functions
- **Files:**
  - `api.ts` - API client (fetch wrappers)
  - `translations.ts` - i18n translations

### `/context` - React Context

- **Purpose:** Global state management
- **Files:**
  - `SettingsContext.tsx` - App settings & language

### `/public` - Static Assets

- **Purpose:** Public files (images, logos)
- **Files:** Logo variants (4 files)

---

## 📈 Code Statistics

### Total Project Size

```
Source Code:
├── TypeScript/TSX:    ~11,500 lines
├── Python:            ~3,500 lines
├── SQL:               ~400 lines
├── CSS:               ~500 lines
└── Configuration:     ~200 lines
Total:                 ~16,100 lines of code

Files:
├── Source Files:      ~60 files
├── Config Files:      ~10 files
├── Documentation:     ~6 files
└── Assets:            ~4 files
Total:                 ~80 project files

Dependencies:
├── Frontend (npm):    ~1,000+ packages
├── Backend (pip):     ~50+ packages
└── Total Size:        ~500 MB (with node_modules)
```

---

## 🚀 Build Output Directories

### Auto-Generated (Not in Git)

```
/.next/                 # Next.js build output
/node_modules/          # Frontend dependencies
/backend/venv/          # Python virtual environment
/backend/__pycache__/   # Python bytecode
/.pytest_cache/         # Pytest cache
```

**Note:** These directories are excluded from version control via `.gitignore`

---

## 📝 Notes

1. **Environment Files:** `.env` files contain sensitive data and are NOT committed to Git
2. **Virtual Environment:** Python `venv/` is local and NOT committed
3. **Node Modules:** `node_modules/` is auto-generated from `package.json`
4. **Build Output:** `.next/` is auto-generated during build
5. **Database:** Hosted on Supabase Cloud (not in repository)

---

## 🔗 Related Documentation

- [README.md](README.md) - Main project documentation
- [PROJECT_EVALUATION.md](PROJECT_EVALUATION.md) - Comprehensive evaluation
- [backend/README.md](backend/README.md) - Backend documentation
- [backend/SETUP_DATABASE.md](backend/SETUP_DATABASE.md) - Database setup

---

**Document Version:** 1.0  
**Last Updated:** December 3, 2025  
**Total Directories:** 15+  
**Total Files:** 80+  
**Total Lines of Code:** ~16,100
