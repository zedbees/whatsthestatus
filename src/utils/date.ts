export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
};

export const isEndOfDay = (): boolean => {
  const now = new Date();
  const hours = now.getHours();
  // Consider end of day after 4 PM
  return hours >= 16;
}; 