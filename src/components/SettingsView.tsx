import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { ChevronLeft } from 'lucide-react';
import { Settings, settingsStore } from '../stores/settings';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';

interface SettingsViewProps {
  onClose: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onClose }) => {
  const [settings, setSettings] = useState<Settings | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      const currentSettings = await settingsStore.getSettings();
      setSettings(currentSettings);
    };
    loadSettings();
  }, []);

  const updateSetting = async <K extends keyof Settings>(
    key: K,
    value: Settings[K]
  ) => {
    if (!settings) return;
    const newSettings = await settingsStore.updateSettings({ [key]: value });
    setSettings(newSettings);
  };

  if (!settings) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="h-full p-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={onClose}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold">Settings</h1>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">General</h2>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-start">Auto-start day</Label>
                <Switch
                  id="auto-start"
                  checked={settings.autoStartDay}
                  onCheckedChange={(checked: boolean) => updateSetting('autoStartDay', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show-completed">Show completed tasks</Label>
                <Switch
                  id="show-completed"
                  checked={settings.showCompletedTasks}
                  onCheckedChange={(checked: boolean) => updateSetting('showCompletedTasks', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label>End of day time</Label>
                <Select
                  value={settings.endOfDayTime.toString()}
                  onValueChange={(value: string) => updateSetting('endOfDayTime', parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => (
                      <SelectItem key={i} value={i.toString()}>
                        {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Auto-pause after inactivity (minutes)</Label>
                <Slider
                  value={[settings.autoPauseAfterMinutes]}
                  min={5}
                  max={60}
                  step={5}
                  onValueChange={(value: number[]) => updateSetting('autoPauseAfterMinutes', value[0])}
                />
                <div className="text-sm text-muted-foreground text-right">
                  {settings.autoPauseAfterMinutes} minutes
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Appearance</h2>
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select
                  value={settings.theme}
                  onValueChange={(value: string) => updateSetting('theme', value as Settings['theme'])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 