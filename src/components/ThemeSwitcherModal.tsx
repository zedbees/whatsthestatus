import React from 'react';
import { themes } from '../themes';
import { useTheme } from './ThemeProvider';

type Props = {
  open: boolean;
  onClose: () => void;
};

export const ThemeSwitcherModal: React.FC<Props> = ({ open, onClose }) => {
  const { theme, setThemeById } = useTheme();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
      <div className="bg-card rounded-xl shadow-lg p-6 min-w-[320px]">
        <h2 className="text-lg font-bold mb-4">Choose Theme</h2>
        <div className="flex flex-col gap-3">
          {themes.map((t) => (
            <button
              key={t.id}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                theme.id === t.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:bg-muted'
              }`}
              onClick={() => {
                setThemeById(t.id);
                onClose();
              }}
            >
              <span
                className="w-6 h-6 rounded-full border"
                style={{
                  background: t.colors.background,
                  borderColor: t.colors.border,
                }}
              />
              <span className="text-base">{t.name}</span>
              {t.isDark && <span className="ml-auto text-xs text-muted">Dark</span>}
              {!t.isDark && <span className="ml-auto text-xs text-muted">Light</span>}
            </button>
          ))}
        </div>
        <button
          className="mt-6 w-full px-4 py-2 rounded-lg bg-muted text-foreground font-medium hover:bg-muted/80 transition-colors"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}; 