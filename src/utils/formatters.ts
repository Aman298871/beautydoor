/**
 * Central Duration Formatter for BeautyDoor
 * 
 * Rules:
 * - Under 60 minutes: e.g. "15 min", "25 min", "30 min", "50 min"
 * - Exact multiples of 60: e.g. "1 hour", "2 hours"
 * - Over 60 minutes with remainder: e.g. "1 hour 10 min", "1 hour 20 min", "2 hours 30 min"
 * 
 * Never displays "60 mins" or "80 mins".
 */
export function formatDuration(mins: number | string | undefined | null): string {
  if (mins === undefined || mins === null) return '';
  const totalMins = typeof mins === 'string' ? parseInt(mins, 10) : mins;
  if (isNaN(totalMins) || totalMins <= 0) return '';

  if (totalMins < 60) {
    return `${totalMins} min`;
  }

  const hours = Math.floor(totalMins / 60);
  const remainingMins = totalMins % 60;
  const hourText = hours === 1 ? '1 hour' : `${hours} hours`;

  if (remainingMins === 0) {
    return hourText;
  }

  return `${hourText} ${remainingMins} min`;
}
