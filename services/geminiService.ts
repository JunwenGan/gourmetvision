import { GoogleGenAI, Type, Schema } from "@google/genai";
import { MenuAnalysisResponse } from "../types";

const MENU_PARSING_MODEL = "gemini-3-flash-preview";
// Using Flash Image for speed and general accuracy as requested
const IMAGE_GEN_MODEL = "gemini-2.5-flash-image";

export const parseMenuImage = async (base64Image: string): Promise<MenuAnalysisResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Standardized realistic prompt
  const prompt = `Realistic, appetizing professional photography of ${dishName}. Visual description: ${description}. Bright and modern aesthetic, soft natural daylight, professional food styling, high resolution, 8k.`;

  try {
    const response = await ai.models.generateContent({
      model: IMAGE_GEN_MODEL,
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "4:3",
          // imageSize is not supported on gemini-2.5-flash-image
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};
