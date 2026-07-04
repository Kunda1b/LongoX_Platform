export interface ScheduledJob {
  id: string;
  workflowId: string;
  cron: string;
  timezone: string;
  enabled: boolean;
  lastRunAt: string | null;
  nextRunAt: string | null;
}

function parseCronExpression(cron: string): {
  minute: number;
  hour: number;
  dayOfMonth: number;
  month: number;
  dayOfWeek: number;
} {
  const parts = cron.split(/\s+/);
  if (parts.length !== 5) {
    throw new Error(`Invalid cron expression: "${cron}". Expected 5 fields.`);
  }

  const parseField = (field: string, min: number, max: number): number => {
    if (field === "*") return min;
    const n = parseInt(field, 10);
    if (isNaN(n) || n < min || n > max) {
      throw new Error(`Invalid cron field "${field}" — expected ${min}-${max}`);
    }
    return n;
  };

  return {
    minute: parseField(parts[0], 0, 59),
    hour: parseField(parts[1], 0, 23),
    dayOfMonth: parseField(parts[2], 1, 31),
    month: parseField(parts[3], 1, 12),
    dayOfWeek: parseField(parts[4], 0, 7),
  };
}

export function shouldRunNow(job: ScheduledJob): boolean {
  if (!job.enabled) return false;

  try {
    const cronParsed = parseCronExpression(job.cron);
    const now = new Date();

    const tzOffset = getTimezoneOffset(job.timezone);
    const localNow = new Date(now.getTime() + tzOffset);

    if (localNow.getMinutes() !== cronParsed.minute) return false;
    if (
      cronParsed.hour !== 0 &&
      localNow.getHours() !== 0 &&
      localNow.getHours() !== cronParsed.hour
    )
      return false;
    if (
      cronParsed.dayOfMonth !== 1 &&
      localNow.getDate() !== cronParsed.dayOfMonth
    )
      return false;

    return true;
  } catch {
    return false;
  }
}

function getTimezoneOffset(timezone: string): number {
  const tzOffsets: Record<string, number> = {
    UTC: 0,
    "America/New_York": -5 * 60 * 60 * 1000,
    "America/Chicago": -6 * 60 * 60 * 1000,
    "America/Denver": -7 * 60 * 60 * 1000,
    "America/Los_Angeles": -8 * 60 * 60 * 1000,
    "Europe/London": 0,
    "Europe/Berlin": 1 * 60 * 60 * 1000,
    "Europe/Paris": 1 * 60 * 60 * 1000,
    "Asia/Tokyo": 9 * 60 * 60 * 1000,
    "Asia/Shanghai": 8 * 60 * 60 * 1000,
    "Asia/Kolkata": 5.5 * 60 * 60 * 1000,
    "Australia/Sydney": 11 * 60 * 60 * 1000,
    "Pacific/Auckland": 13 * 60 * 60 * 1000,
  };
  return tzOffsets[timezone] ?? 0;
}
