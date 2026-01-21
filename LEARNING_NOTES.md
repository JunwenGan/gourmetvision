# Learning Notes: GourmetVision Project

A comprehensive guide to the concepts and patterns used in this project.

---

## Table of Contents

1. [API Key Security](#1-api-key-security)
2. [Client-Side vs Server-Side Architecture](#2-client-side-vs-server-side-architecture)
3. [Serverless Functions](#3-serverless-functions)
4. [Environment Variables](#4-environment-variables)
5. [React Patterns](#5-react-patterns)
6. [TypeScript Best Practices](#6-typescript-best-practices)
7. [Vite Build Tool](#7-vite-build-tool)
8. [AI API Integration](#8-ai-api-integration)
9. [Git Security Practices](#9-git-security-practices)
10. [Project Structure](#10-project-structure)

---

## 1. API Key Security

### The Problem

```
┌─────────────────────────────────────────────────────────────┐
│                     INSECURE (Before)                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Browser ──────────────────────────► Gemini API            │
│      │                                    ▲                 │
│      │                                    │                 │
│      └── API Key embedded in JS ──────────┘                 │
│          (Visible in DevTools!)                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Why it's dangerous:**
- Anyone can open DevTools → Network/Sources tab
- Extract your API key from JavaScript bundle
- Use your key, you pay the bill (or hit rate limits)

### The Solution

```
┌─────────────────────────────────────────────────────────────┐
│                      SECURE (After)                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Browser ────► Your API Route ────► Gemini API             │
│                (Serverless Fn)           ▲                  │
│                     │                    │                  │
│                     └── API Key ─────────┘                  │
│                        (Server-side only,                   │
│                         never sent to browser)              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Takeaways

| Approach | API Key Location | Security |
|----------|------------------|----------|
| Direct API call from browser | Embedded in JS bundle | Exposed |
| Via serverless function | Server environment variable | Hidden |
| Via backend server | Server environment variable | Hidden |

---

## 2. Client-Side vs Server-Side Architecture

### Client-Side Only (SPA)

```javascript
// ❌ INSECURE - Key in client code
const ai = new GoogleGenAI({ apiKey: "sk-xxx" });
const response = await ai.models.generateContent({...});
```

**Characteristics:**
- All code runs in the browser
- Fast initial interactions
- Secrets are exposed
- Good for: public data, no secrets needed

### Server-Side API Route

```javascript
// ✅ SECURE - Key on server only
// api/parse-menu.ts (runs on server)
const apiKey = process.env.GEMINI_API_KEY; // From server env
const ai = new GoogleGenAI({ apiKey });
```

```javascript
// Client just calls your API
const response = await fetch("/api/parse-menu", {
  method: "POST",
  body: JSON.stringify({ base64Image }),
});
```

**Characteristics:**
- Sensitive code runs on server
- Secrets stay hidden
- Adds network hop (slightly slower)
- Good for: API keys, database access, sensitive operations

---

## 3. Serverless Functions

### What Are They?

Serverless functions are small pieces of backend code that:
- Run on-demand (not always running)
- Scale automatically
- Pay per execution
- No server management needed

### Vercel Serverless Function Structure

```typescript
// api/my-function.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(
  req: VercelRequest,   // Incoming request
  res: VercelResponse   // Your response
) {
  // 1. Validate method
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 2. Get data from request
  const { someData } = req.body;

  // 3. Do server-side work (access secrets, databases, APIs)
  const apiKey = process.env.SECRET_KEY;

  // 4. Return response
  return res.status(200).json({ result: "success" });
}
```

### File-Based Routing

```
api/
├── parse-menu.ts      → POST /api/parse-menu
├── generate-image.ts  → POST /api/generate-image
└── users/
    └── [id].ts        → GET /api/users/123 (dynamic)
```

---

## 4. Environment Variables

### The Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                   Environment Variables                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  .env.local          → Local development (NEVER commit)    │
│  .env.development    → Development settings                 │
│  .env.production     → Production settings                  │
│  Vercel Dashboard    → Production secrets (most secure)     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### .gitignore Protection

```gitignore
# Always ignore local env files
*.local
.env
.env.local
.env.*.local
```

### Vite Environment Variables

```javascript
// vite.config.ts

// ❌ BAD - Exposes to client
define: {
  'process.env.API_KEY': JSON.stringify(env.API_KEY)
}

// ✅ GOOD - Only VITE_ prefix vars are exposed (intentionally)
// Access via import.meta.env.VITE_PUBLIC_VAR
```

**Rule:** Never put secrets in `VITE_` prefixed variables - they're bundled into client code!

---

## 5. React Patterns

### Custom Hooks Pattern

```typescript
// Encapsulate related state and logic
const [menuImage, setMenuImage] = useState<string | null>(null);
const [dishes, setDishes] = useState<Dish[]>([]);
const [isAnalyzing, setIsAnalyzing] = useState(false);
const [error, setError] = useState<string | null>(null);
```

### Refs for DOM Access

```typescript
const videoRef = useRef<HTMLVideoElement>(null);
const canvasRef = useRef<HTMLCanvasElement>(null);

// Access DOM elements directly
if (videoRef.current) {
  videoRef.current.srcObject = stream;
}
```

### Conditional Rendering

```tsx
{isAnalyzing ? (
  <LoadingSpinner />
) : dishes.length > 0 ? (
  <DishGrid dishes={dishes} />
) : (
  <EmptyState />
)}
```

### State Updates with Previous State

```typescript
// ✅ CORRECT - Use callback when new state depends on old
setDishes(prevDishes =>
  prevDishes.map(d =>
    d.id === dishId ? { ...d, isLoading: true } : d
  )
);

// ❌ WRONG - May use stale state
setDishes(dishes.map(d => ...));
```

---

## 6. TypeScript Best Practices

### Define Clear Interfaces

```typescript
// types.ts
export interface Dish {
  id: string;
  originalName: string;
  englishTranslation: string;
  description: string;
  price?: string;              // Optional with ?
  category?: string;
  generatedImageUrl?: string;
  isLoadingImage?: boolean;
}
```

### Type Function Parameters

```typescript
const generateSingleDish = async (dishId: string): Promise<void> => {
  // TypeScript knows dishId is string
};
```

### Type API Responses

```typescript
export interface MenuAnalysisResponse {
  dishes: {
    originalName: string;
    englishTranslation: string;
    ingredientsOrDescription: string;
    price?: string;
    category?: string;
  }[];
}

// Now TypeScript validates the response shape
const result: MenuAnalysisResponse = await response.json();
```

---

## 7. Vite Build Tool

### Why Vite?

| Feature | Vite | Create React App |
|---------|------|------------------|
| Dev server start | ~300ms | ~30s |
| Hot Module Replacement | Instant | Slow |
| Build tool | ESBuild + Rollup | Webpack |
| Config | Simple | Ejected = complex |

### Key Configuration

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      // Proxy API calls in development
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),  // Import as @/components
    }
  }
});
```

### Build Output

```bash
npm run build
# Creates optimized files in /dist
# - index.html
# - assets/index-[hash].js   (minified, tree-shaken)
# - assets/index-[hash].css
```

---

## 8. AI API Integration

### Structured Output with Schema

```typescript
// Force AI to return specific JSON structure
const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    dishes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          originalName: { type: Type.STRING },
          englishTranslation: { type: Type.STRING },
          // ...
        },
        required: ["originalName", "englishTranslation"],
      },
    },
  },
  required: ["dishes"],
};

const response = await ai.models.generateContent({
  model: "gemini-3-flash-preview",
  contents: {...},
  config: {
    responseMimeType: "application/json",
    responseSchema: responseSchema,  // AI must follow this
  },
});
```

### Image Generation

```typescript
const response = await ai.models.generateContent({
  model: "gemini-2.5-flash-image",
  contents: {
    parts: [{ text: prompt }],
  },
  config: {
    imageConfig: {
      aspectRatio: "4:3",
    },
  },
});

// Extract base64 image from response
for (const part of response.candidates?.[0]?.content?.parts || []) {
  if (part.inlineData) {
    return `data:image/png;base64,${part.inlineData.data}`;
  }
}
```

---

## 9. Git Security Practices

### .gitignore Essentials

```gitignore
# Dependencies
node_modules/

# Environment files (CRITICAL!)
.env
.env.local
.env.*.local
*.local

# Build output
dist/
build/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
```

### If You Accidentally Commit a Secret

```bash
# 1. Immediately revoke/rotate the exposed key

# 2. Remove from history (if not pushed)
git reset --soft HEAD~1

# 3. If pushed, use BFG Repo-Cleaner or git filter-branch
# Then force push (coordinate with team!)

# 4. Consider the key compromised - always rotate it
```

### Pre-commit Checks

```bash
# Install a tool like git-secrets
brew install git-secrets
git secrets --install
git secrets --register-aws  # Blocks AWS keys
```

---

## 10. Project Structure

### Recommended Layout

```
gourmetvision/
├── api/                    # Serverless functions (Vercel)
│   ├── parse-menu.ts
│   └── generate-image.ts
├── components/             # React components
│   ├── DishCard.tsx
│   └── StyleSelector.tsx
├── services/               # API client functions
│   └── geminiService.ts
├── types.ts                # TypeScript interfaces
├── App.tsx                 # Main app component
├── index.tsx               # Entry point
├── index.html              # HTML template
├── vite.config.ts          # Vite configuration
├── vercel.json             # Vercel deployment config
├── package.json            # Dependencies & scripts
├── tsconfig.json           # TypeScript config
├── .gitignore              # Git ignore rules
├── .env.local              # Local secrets (not committed)
└── README.md               # Documentation
```

### Separation of Concerns

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                             │
├─────────────────────────────────────────────────────────────┤
│  App.tsx          → Orchestrates everything                 │
│  components/      → Reusable UI pieces                      │
│  services/        → API calls (fetch to /api/*)             │
│  types.ts         → Shared TypeScript interfaces            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend (API)                        │
├─────────────────────────────────────────────────────────────┤
│  api/parse-menu.ts      → Menu analysis endpoint            │
│  api/generate-image.ts  → Image generation endpoint         │
│                                                             │
│  (Has access to process.env.GEMINI_API_KEY)                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Reference Card

### Security Checklist

- [ ] API keys in environment variables, not code
- [ ] `.env.local` in `.gitignore`
- [ ] Secrets accessed only in server-side code
- [ ] No `VITE_` prefix for secrets
- [ ] API key restrictions set in provider dashboard

### Commands

```bash
# Development
npm run dev          # Start dev server

# Production
npm run build        # Build for production
npm run preview      # Preview production build

# Git
git status           # Check changes
git add -A           # Stage all
git commit -m "msg"  # Commit
git push             # Push to remote

# Vercel
vercel               # Deploy preview
vercel --prod        # Deploy production
```

---

## Further Reading

- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Vite Documentation](https://vitejs.dev/)
- [Google Gemini API](https://ai.google.dev/docs)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [OWASP API Security](https://owasp.org/www-project-api-security/)

---

*Generated from GourmetVision project analysis*
