import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const IMAGE_GEN_MODEL = "gemini-2.5-flash-image";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  try {
    const { dishName, description } = req.body;
    if (!dishName || !description) {
      return res.status(400).json({ error: "dishName and description are required" });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Realistic, appetizing professional photography of ${dishName}. Visual description: ${description}. Bright and modern aesthetic, soft natural daylight, professional food styling, high resolution, 8k.`;

    const response = await ai.models.generateContent({
      model: IMAGE_GEN_MODEL,
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "4:3",
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return res.status(200).json({
          imageUrl: `data:image/png;base64,${part.inlineData.data}`,
        });
      }
    }

    return res.status(500).json({ error: "No image data in response" });
  } catch (error) {
    console.error("Error generating image:", error);
    return res.status(500).json({ error: "Failed to generate image" });
  }
}
