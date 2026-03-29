const fallback = require('../../assets/categories/defence.jpg');
const fallbackSquare = require('../../assets/categories/defence_square.jpg');

export const CATEGORY_IMAGES: Record<string, any> = {
  Politics:               require('../../assets/categories/politics.jpg'),
  Economy:                require('../../assets/categories/economy.jpg'),
  Health:                 fallback,
  Technology:             fallback,
  Environment:            fallback,
  'Defence and Security': require('../../assets/categories/defence.jpg'),
  Sports:                 fallback,
};

export const CATEGORY_IMAGES_SQUARE: Record<string, any> = {
  Politics:               require('../../assets/categories/politics_square.jpg'),
  Economy:                require('../../assets/categories/economy_square.jpg'),
  Health:                 fallbackSquare,
  Technology:             fallbackSquare,
  Environment:            fallbackSquare,
  'Defence and Security': require('../../assets/categories/defence_square.jpg'),
  Sports:                 fallbackSquare,
};

export function getCategoryImage(category?: string): any {
  return (category && CATEGORY_IMAGES[category]) ?? fallback;
}

export function getCategoryImageSquare(category?: string): any {
  return (category && CATEGORY_IMAGES_SQUARE[category]) ?? fallbackSquare;
}
