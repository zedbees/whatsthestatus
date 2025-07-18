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
      background: 'linear-gradient(135deg, #f8f6ff 0%, #f3e7fa 100%)',
      column: '#f3f4f6', // new: very light gray for columns
      card: '#fff',
      border: '#e0d7f3',
      primary: '#232336',
      accent: '#a259ff',
      text: '#232336',
      muted: '#bdbdbd',
    },
  },
  {
    id: 'purple-dark',
    name: 'Minimal Dark',
    isDark: true,
    colors: {
      background: 'linear-gradient(135deg, #18181b 0%, #23272a 100%)',
      column: '#202127', // new: between background and card
      card: '#232329',
      border: '#34343a',
      primary: '#fafafa',
      accent: '#3f3f46',
      text: '#fafafa',
      muted: '#6b7280',
    },
  },
  {
    id: 'blue-light',
    name: 'Blue Sky',
    isDark: false,
    colors: {
      background: 'linear-gradient(135deg, #e0f2fe 0%, #f5faff 100%)',
      column: '#f3f4f6',
      card: '#fff',
      border: '#dbeafe',
      primary: '#1e293b',
      accent: '#2563eb',
      text: '#1e293b',
      muted: '#94a3b8',
    },
  },
  {
    id: 'blue-dark',
    name: 'Minimal Black',
    isDark: true,
    colors: {
      background: 'linear-gradient(135deg, #111113 0%, #18181b 100%)',
      column: '#18191d', // new: between background and card
      card: '#232329',
      border: '#34343a',
      primary: '#fafafa',
      accent: '#27272a',
      text: '#fafafa',
      muted: '#6b7280',
    },
  },
]; 