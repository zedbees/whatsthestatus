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
  };
};

export const themes: Theme[] = [
  {
    id: 'purple-light',
    name: 'Purple Dawn',
    isDark: false,
    colors: {
      background: 'linear-gradient(135deg, #f8f6ff 0%, #f3e7fa 100%)',
      card: '#fff',
      border: '#e0d7f3',
      primary: '#a259ff',
      accent: '#ff6ec4',
      text: '#232336',
      muted: '#bdbdbd',
    },
  },
  {
    id: 'purple-dark',
    name: 'Purple Night',
    isDark: true,
    colors: {
      background: 'linear-gradient(135deg, #232336 0%, #3a185c 100%)',
      card: '#2d2346',
      border: '#4b367c',
      primary: '#a259ff',
      accent: '#ff6ec4',
      text: '#f3e7fa',
      muted: '#6c6c80',
    },
  },
  {
    id: 'blue-light',
    name: 'Blue Sky',
    isDark: false,
    colors: {
      background: 'linear-gradient(135deg, #e0f2fe 0%, #f5faff 100%)',
      card: '#fff',
      border: '#dbeafe',
      primary: '#2563eb',
      accent: '#38bdf8',
      text: '#1e293b',
      muted: '#94a3b8',
    },
  },
  {
    id: 'blue-dark',
    name: 'Blue Midnight',
    isDark: true,
    colors: {
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      card: '#1e293b',
      border: '#334155',
      primary: '#2563eb',
      accent: '#38bdf8',
      text: '#f1f5f9',
      muted: '#64748b',
    },
  },
]; 