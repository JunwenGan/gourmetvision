import type { VercelRequest, VercelResponse } from "@vercel/node";
import OpenAI from "openai";
import { config } from "dotenv";

// Load .env.local for local development
config({ path: ".env.local" });

const IMAGE_GEN_MODEL = "gpt-image-1-mini";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return res.status(500).json({ error: "API key not configured" });
  }

  try {
    const { dishName, description } = req.body;
    if (!dishName || !description) {
      return res.status(400).json({ error: "dishName and description are required" });
    }

    const prompt = `Realistic, appetizing professional photography of ${dishName}. Visual description: ${description}. Bright and modern aesthetic, soft natural daylight, professional food styling, high resolution, 8k.`;

    const client = new OpenAI({ apiKey });
    const response = await client.images.generate({
      model: IMAGE_GEN_MODEL,
      prompt,
      size: "1024x1024",
    });

    // Log the response to see its structure
    console.log("OpenAI response:", JSON.stringify(response, null, 2));

    // Try both URL and b64_json
    const imageUrl = response?.data?.[0]?.url;
    const b64 = response?.data?.[0]?.b64_json;

    if (imageUrl) {
      return res.status(200).json({ imageUrl });
    }
    if (b64) {
      return res.status(200).json({ imageUrl: `data:image/png;base64,${b64}` });
    }

    return res.status(500).json({ error: "No image data in response", response });
  } catch (error) {
    console.error("Error generating image:", error);
    return res.status(500).json({ error: "Failed to generate image" });
  }
}
