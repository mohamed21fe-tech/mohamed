/**
 * High-quality authentic Syrian culinary photography placeholders & visual food references
 * High quality food imagery for Levantine / Syrian cuisine
 */

export const FOOD_PHOTOS: Record<string, string> = {
  // Shish Tawook
  'prd-shish-tawook':
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80',
  // Aleppo Kebab
  'prd-kebab-halabi':
    'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
  // Mixed Grill
  'prd-mixed-grill':
    'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=600&q=80',
  // Hummus
  'prd-hummus':
    'https://images.unsplash.com/photo-1577906096429-f73c2c312435?auto=format&fit=crop&w=600&q=80',
  // Mutabbal
  'prd-mutabbal':
    'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&w=600&q=80',
  // Fattoush
  'prd-fattoush':
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
  // Tabbouleh
  'prd-tabbouleh':
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80',
  // Yalanji / Vine Leaves
  'prd-yabraq':
    'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=600&q=80',
  // Kibbeh
  'prd-kibbeh-fried':
    'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
  // Fatteh Hummus
  'prd-fatteh-hummus':
    'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80',
  // Fatteh Makdous
  'prd-fatteh-makdous':
    'https://images.unsplash.com/photo-1541544741938-0af808871cc0?auto=format&fit=crop&w=600&q=80',
  // Chicken Shawarma
  'prd-shawarma-chicken':
    'https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=600&q=80',
  // Lemon Mint Juice
  'prd-lemon-mint':
    'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
  // Cola / Soft drink
  'prd-cola':
    'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80',
  // Arabic Coffee
  'prd-arabic-coffee':
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
  // Baklava
  'prd-baklava':
    'https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&w=600&q=80',
};

// Fallback images by category
export const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  'cat-grills': 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
  'cat-mezze-cold': 'https://images.unsplash.com/photo-1577906096429-f73c2c312435?auto=format&fit=crop&w=600&q=80',
  'cat-mezze-hot': 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80',
  'cat-fatteh': 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80',
  'cat-salads': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80',
  'cat-shawarma': 'https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=600&q=80',
  'cat-sweets': 'https://images.unsplash.com/photo-1519869325930-281384150729?auto=format&fit=crop&w=600&q=80',
  'cat-cold-drinks': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
  'cat-hot-drinks': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
};

export const DEFAULT_FOOD_IMAGE = 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80';

export function getProductImage(productId?: string, categoryId?: string, existingImage?: string): string {
  if (existingImage && existingImage.trim().length > 0) return existingImage;
  if (productId && FOOD_PHOTOS[productId]) return FOOD_PHOTOS[productId];
  if (categoryId && CATEGORY_FALLBACK_IMAGES[categoryId]) return CATEGORY_FALLBACK_IMAGES[categoryId];
  return DEFAULT_FOOD_IMAGE;
}
