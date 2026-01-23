# GourmetVision

A React web app that transforms restaurant menus into visual experiences. Snap a photo of any menu, and GourmetVision will identify dishes, translate them, extract prices, and generate realistic AI photos of each item.

## Features

- **Menu Scanning** - Use your camera or upload a photo of any restaurant menu
- **AI-Powered Analysis** - Automatically extracts dish names, descriptions, prices, and categories
- **Multi-Language Support** - Translates menu items to English
- **AI Image Generation** - Creates realistic food photos for each dish using OpenAI
- **Responsive Design** - Works on desktop and mobile devices

## Tech Stack

- React 19 + TypeScript
- Vite
- Google Gemini API (`@google/genai`) for menu parsing
- OpenAI Images (`openai`) for dish photos
- Tailwind CSS

## Getting Started

### Prerequisites

- Node.js (v18+)
- [Google Gemini API Key](https://aistudio.google.com/app/apikey)
- [OpenAI API Key](https://platform.openai.com/api-keys)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/JunwenGan/gourmetvision.git
   cd gourmetvision
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `.env.local`:
   ```
   # Used by Vercel serverless functions
   GEMINI_API_KEY=your_gemini_api_key_here
   OPENAI_API_KEY=your_openai_api_key_here

   # Used by Vite dev for client-side menu parsing
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. Start the development server:
   ```bash
   vercel dev
   ```

5. Open http://localhost:3001 in your browser

### Notes on Local Development

- This project uses Vercel Serverless Functions in the `api/` folder.
- `vercel dev` runs both Vite and the serverless API routes locally.
- If you only run `npm run dev`, `/api/*` routes will not exist.

## Usage

1. Click "Use Camera" to take a photo of a menu, or "Upload Photo" to select an existing image
2. Wait for the AI to analyze and extract menu items
3. Browse the generated dish cards with AI-generated food photos
4. Click on any dish to see more details

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## License

MIT
