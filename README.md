# GourmetVision

A React web app that transforms restaurant menus into visual experiences. Snap a photo of any menu, and GourmetVision will identify dishes, translate them, extract prices, and generate realistic AI photos of each item.

## Features

- **Menu Scanning** - Use your camera or upload a photo of any restaurant menu
- **AI-Powered Analysis** - Automatically extracts dish names, descriptions, prices, and categories
- **Multi-Language Support** - Translates menu items to English
- **AI Image Generation** - Creates realistic food photos for each dish using Gemini
- **Responsive Design** - Works on desktop and mobile devices

## Tech Stack

- React 19 + TypeScript
- Vite
- Google Gemini API (`@google/genai`)
- Tailwind CSS

## Getting Started

### Prerequisites

- Node.js (v18+)
- [Google Gemini API Key](https://aistudio.google.com/app/apikey)

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

3. Set your Gemini API key in `.env.local`:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:5173 in your browser

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
