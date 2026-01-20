export interface Dish {
  id: string;
  originalName: string;
  englishTranslation: string;
  description: string;
  price?: string;
  category?: string;
  generatedImageUrl?: string;
  isLoadingImage?: boolean;
  hasAttemptedGeneration?: boolean;
}

export interface MenuAnalysisResponse {
  dishes: {
    originalName: string;
    englishTranslation: string;
    ingredientsOrDescription: string;
    price?: string;
    category?: string;
  }[];
}

export enum PhotoStyle {
  RUSTIC = 'RUSTIC',
  BRIGHT = 'BRIGHT',
  SOCIAL = 'SOCIAL',
}
