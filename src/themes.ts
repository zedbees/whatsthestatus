export type Theme = {
  id: string;
  name: string;
  isDark: boolean;
  colors: {
    background: string;
    card: string;
    border: string;
    primary: string;
    accent: string;
    text: string;
    muted: string;
    column: string; // Added column color
  };
};

export const themes: Theme[] = [
  {
    id: 'purple-light',
    name: 'Purple Dawn',
    isDark: false,
    colors: {
      background: 'linear-gradient(135deg, #f8f9fb 0%, #f1f5f9 100%)', // Light gray background
      column: '#f3f4f6', // Slightly darker column background
      card: '#ffffff', // Pure white cards
      border: '#e5e7eb', // Subtle border color
      primary: '#2563eb', // Blue accent for actions
      accent: '#2563eb', // Blue accent for highlights
      text: '#1f2937', // Dark text
      muted: '#6b7280', // Muted text
    },
  },
  {
    id: 'purple-dark',
    name: 'Minimal Dark',
    isDark: true,
    colors: {
      background: 'linear-gradient(135deg, #18181b 0%, #111113 100%)', // Deep dark background
      column: '#232329', // Mid-dark column background
      card: '#26272b', // Lighter card background for separation
      border: '#34343a', // Visible border
      primary: '#2563eb', // Blue accent for actions
      accent: '#2563eb', // Blue accent for highlights
      text: '#f9fafb', // Light text
      muted: '#9ca3af', // Muted text
    },
  },
  {
    id: 'blue-light',
    name: 'Blue Sky',
    isDark: false,
    colors: {
      background: 'linear-gradient(135deg, #f8f9fb 0%, #f1f5f9 100%)', // Light gray background
      column: '#f3f4f6', // Slightly darker column background
      card: '#ffffff', // Pure white cards
      border: '#e5e7eb', // Subtle border color
      primary: '#2563eb', // Blue accent for actions
      accent: '#2563eb', // Blue accent for highlights
      text: '#1f2937', // Dark text
      muted: '#6b7280', // Muted text
    },
  },
  {
    id: 'blue-dark',
    name: 'Minimal Black',
    isDark: true,
    colors: {
      background: 'linear-gradient(135deg, #18181b 0%, #111113 100%)', // Deep dark background
      column: '#232329', // Mid-dark column background
      card: '#26272b', // Lighter card background for separation
      border: '#34343a', // Visible border
      primary: '#2563eb', // Blue accent for actions
      accent: '#2563eb', // Blue accent for highlights
      text: '#f9fafb', // Light text
      muted: '#9ca3af', // Muted text
    },
  },
]; 