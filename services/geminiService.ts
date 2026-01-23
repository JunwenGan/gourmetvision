import { GoogleGenAI, Type, Schema } from "@google/genai";
import { MenuAnalysisResponse } from "../types";

const MENU_PARSING_MODEL = "gemini-3-flash-preview";

// Check if we're in production (Vercel) or development
const isProduction = import.meta.env.PROD;

// For local development, get API key from env
const getApiKey = () => {
  if (typeof import.meta.env.VITE_GEMINI_API_KEY === 'string') {
    return import.meta.env.VITE_GEMINI_API_KEY;
  }
  return null;
};

export const parseMenuImage = async (base64Image: string): Promise<MenuAnalysisResponse> => {
  // In production, use API route (key stays on server)
  if (isProduction) {
    const response = await fetch("/api/parse-menu", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64Image }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to parse menu");
    }

    return await response.json();
  }

  // In development, call Gemini directly
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY not set in .env.local");
  }

  const ai = new GoogleGenAI({ apiKey });

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      dishes: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            originalName: { type: Type.STRING, description: "The name of the item as it appears on the menu." },
            englishTranslation: { type: Type.STRING, description: "English translation of the name." },
            ingredientsOrDescription: { type: Type.STRING, description: "A concise visual description of the main ingredients and presentation." },
            price: { type: Type.STRING, description: "The price of the item including currency symbol. If not found, leave empty." },
            category: { type: Type.STRING, description: "The category or section this item belongs to (e.g., 'Starters', 'Mains', 'Drinks', 'Desserts')." },
          },
          required: ["originalName", "englishTranslation", "ingredientsOrDescription"],
        },
      },
    },
    required: ["dishes"],
  };

  try {
    const response = await ai.models.generateContent({
      model: MENU_PARSING_MODEL,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image,
            },
          },
          {
            text: "Analyze this menu image. Identify all distinct items listed, including food and drinks. For each item, provide the original name, an English translation, the price (if available), the category/section it belongs to, and a short visual description based on its ingredients.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        systemInstruction: "You are a culinary expert assisting a food photographer. Extract all menu items accurately, including beverages.",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No text response from Gemini");

    return JSON.parse(text) as MenuAnalysisResponse;
  } catch (error) {
    console.error("Error parsing menu:", error);
    throw error;
  }
};

export const generateDishPhoto = async (
  dishName: string,
  description: string
): Promise<string> => {
  const response = await fetch("/api/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dishName, description }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to generate image");
  }

  const data = await response.json();
  return data.imageUrl;
};
