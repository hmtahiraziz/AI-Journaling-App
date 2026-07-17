export type ReminderPreset = {
  label: string;
  hour: number;
  minute: number;
};

/** Quick picks for daily nudge — also used as sheet shortcuts. */
export const REMINDER_TIME_PRESETS: ReminderPreset[] = [
  { label: "8 AM", hour: 8, minute: 0 },
  { label: "12 PM", hour: 12, minute: 0 },
  { label: "6 PM", hour: 18, minute: 0 },
  { label: "8 PM", hour: 20, minute: 0 },
  { label: "9:30 PM", hour: 21, minute: 30 },
];

export function isPresetTime(hour: number, minute: number, preset: ReminderPreset) {
  return preset.hour === hour && preset.minute === minute;
}
