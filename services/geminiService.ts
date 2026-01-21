import { MenuAnalysisResponse } from "../types";

export const parseMenuImage = async (base64Image: string): Promise<MenuAnalysisResponse> => {
  try {
    const response = await fetch("/api/parse-menu", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ base64Image }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to parse menu");
    }

    return await response.json();
  } catch (error) {
    console.error("Error parsing menu:", error);
    throw error;
  }
};

export const generateDishPhoto = async (
  dishName: string,
  description: string
): Promise<string> => {
  try {
    const response = await fetch("/api/generate-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ dishName, description }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to generate image");
    }

    const data = await response.json();
    return data.imageUrl;
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};
