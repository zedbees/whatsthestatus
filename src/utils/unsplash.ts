// Using Picsum Photos (Lorem Picsum) which is free and doesn't require authentication
const PICSUM_URL = 'https://picsum.photos/1920/1080';

// Alternatively, we can use a list of reliable image URLs
const BACKGROUND_IMAGES = [
  'https://images.pexels.com/photos/281260/pexels-photo-281260.jpeg',
  'https://images.pexels.com/photos/3560044/pexels-photo-3560044.jpeg',
  'https://images.pexels.com/photos/572897/pexels-photo-572897.jpeg',
  'https://images.pexels.com/photos/2559941/pexels-photo-2559941.jpeg',
  'https://images.pexels.com/photos/346529/pexels-photo-346529.jpeg',
];

export const getBackgroundImage = async (): Promise<string> => {
  try {
    // Option 1: Using Picsum Photos
    const response = await fetch(PICSUM_URL);
    return response.url;

    // Option 2: Using our curated list
    // return BACKGROUND_IMAGES[Math.floor(Math.random() * BACKGROUND_IMAGES.length)];
  } catch (error) {
    console.error('Failed to fetch background image:', error);
    // Fallback to a default image from the list if fetch fails
    return BACKGROUND_IMAGES[0];
  }
}; 