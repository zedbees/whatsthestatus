export interface Settings {
  autoStartDay: boolean;
  endOfDayTime: number; // 24-hour format (e.g., 16 for 4 PM)
  autoPauseAfterMinutes: number;
  showCompletedTasks: boolean;
  theme: 'light' | 'dark' | 'system';
  themeId?: string; // new property for theme system
}

const DEFAULT_SETTINGS: Settings = {
  autoStartDay: true,
  endOfDayTime: 16,
  autoPauseAfterMinutes: 30,
  showCompletedTasks: true,
  theme: 'system',
  themeId: undefined,
};

export const settingsStore = {
  async getSettings(): Promise<Settings> {
    const result = await chrome.storage.local.get('settings');
    return result.settings || DEFAULT_SETTINGS;
  },

  async updateSettings(settings: Partial<Settings>): Promise<Settings> {
    const currentSettings = await this.getSettings();
    const newSettings = { ...currentSettings, ...settings };
    await chrome.storage.local.set({ settings: newSettings });
    return newSettings;
  }
}; 