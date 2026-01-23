import { GoogleGenAI, Type, Schema } from "@google/genai";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { config } from "dotenv";

// Load .env.local for local development
config({ path: ".env.local" });

const MENU_PARSING_MODEL = "gemini-3-flash-preview";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  try {
    const { base64Image } = req.body;
    if (!base64Image) {
      return res.status(400).json({ error: "base64Image is required" });
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
    if (!text) {
      return res.status(500).json({ error: "No response from Gemini" });
    }

    return res.status(200).json(JSON.parse(text));
  } catch (error) {
    console.error("Error parsing menu:", error);
    return res.status(500).json({ error: "Failed to parse menu" });
  }
}
