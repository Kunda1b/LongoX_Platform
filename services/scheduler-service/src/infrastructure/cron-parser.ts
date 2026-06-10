export interface ParsedCron {
  minute: number[];
  hour: number[];
  dayOfMonth: number[];
  month: number[];
  dayOfWeek: number[];
}

export class CronParser {
  parse(expression: string): ParsedCron {
    const parts = expression.trim().split(/\s+/);
    if (parts.length !== 5) {
      throw new Error(`Invalid cron expression: "${expression}". Expected 5 fields.`);
    }

    return {
      minute: this.parseField(parts[0], 0, 59),
      hour: this.parseField(parts[1], 0, 23),
      dayOfMonth: this.parseField(parts[2], 1, 31),
      month: this.parseField(parts[3], 1, 12),
      dayOfWeek: this.parseField(parts[4], 0, 7),
    };
  }

  getNextRun(expression: string, from: Date = new Date()): Date {
    const cron = this.parse(expression);
    const candidate = new Date(from);
    candidate.setSeconds(0, 0);

    for (let i = 0; i < 525600; i++) {
      candidate.setMinutes(candidate.getMinutes() + 1);

      if (!cron.minute.includes(candidate.getMinutes())) continue;
      if (!cron.hour.includes(candidate.getHours())) continue;
      if (!cron.dayOfMonth.includes(candidate.getDate())) continue;
      if (!cron.month.includes(candidate.getMonth() + 1)) continue;

      const dow = candidate.getDay();
      if (!cron.dayOfWeek.includes(dow) && !cron.dayOfWeek.includes(7)) continue;

      return candidate;
    }

    const fallback = new Date(from);
    fallback.setDate(fallback.getDate() + 1);
    return fallback;
  }

  private parseField(field: string, min: number, max: number): number[] {
    if (field === "*") {
      return this.range(min, max);
    }

    if (field.includes("/")) {
      const [range, stepStr] = field.split("/");
      const step = parseInt(stepStr, 10);
      const values = range === "*" ? this.range(min, max) : this.parseRange(range, min, max);
      return values.filter((_, i) => i % step === 0);
    }

    if (field.includes(",")) {
      return field.split(",").flatMap((f) => this.parseField(f.trim(), min, max));
    }

    if (field.includes("-")) {
      return this.parseRange(field, min, max);
    }

    const value = parseInt(field, 10);
    if (isNaN(value) || value < min || value > max) {
      throw new Error(`Invalid cron field value: "${field}"`);
    }
    return [value];
  }

  private parseRange(range: string, min: number, max: number): number[] {
    const [startStr, endStr] = range.split("-");
    const start = parseInt(startStr, 10);
    const end = parseInt(endStr, 10);
    if (isNaN(start) || isNaN(end)) throw new Error(`Invalid cron range: "${range}"`);
    return this.range(Math.max(start, min), Math.min(end, max));
  }

  private range(start: number, end: number): number[] {
    const result: number[] = [];
    for (let i = start; i <= end; i++) result.push(i);
    return result;
  }
}
