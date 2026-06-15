export function formatData(bytes: bigint, locale = "en-US") {
  const ZERO = BigInt(0);
  const THRESHOLD = BigInt(1024);

  if (bytes === ZERO) {
    return new Intl.NumberFormat(locale, {
      style: "unit",
      unit: "byte",
      unitDisplay: "short",
    }).format(0);
  }

  const units = ["byte", "kilobyte", "megabyte", "gigabyte", "terabyte"];
  let unitIndex = 0;
  let value = bytes < ZERO ? -bytes : bytes;

  while (value >= THRESHOLD && unitIndex < units.length - 1) {
    value /= THRESHOLD;
    unitIndex++;
  }

  const finalValue = bytes < ZERO ? -Number(value) : Number(value);

  return new Intl.NumberFormat(locale, {
    style: "unit",
    unit: units[unitIndex],
    unitDisplay: "short",
    maximumFractionDigits: 1,
    // Adds a decimal (e.g., 5.0 MB) only for small numbers for precision
    minimumFractionDigits: finalValue < 10 && unitIndex > 0 ? 1 : 0,
  }).format(finalValue);
}

export function bytesToMB(bytes: bigint): number {
  return Math.round((Number(bytes) / 1024 ** 2) * 10) / 10;
}

export function mbToBytes(mb: number): bigint {
  return BigInt(Math.round(mb * 1024 ** 2));
}

// TIME
type DurationStyle = "narrow" | "short" | "long" | "digital";

interface DurationFormatOptions {
  style?: DurationStyle;
  localeMatcher?: "best fit" | "lookup";
}

type FormatTimeParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function decompose(totalSeconds: number): FormatTimeParts {
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

export function formatTime(
  seconds: number,
  locale: string = navigator.language,
  options: DurationFormatOptions = { style: "narrow" },
): string {
  const parts = decompose(seconds);
  const formatter = new Intl.DurationFormat(locale, options);
  return formatter.format(parts);
}

// SPEED
type UnitDisplay = "narrow" | "short" | "long";

type SpeedUnit = {
  threshold: number;
  unit: string;
  divisor: number;
  decimals: number;
};

const SPEED_UNITS: SpeedUnit[] = [
  { threshold: 1024 ** 4, unit: "terabyte-per-second", divisor: 1024 ** 4, decimals: 2 },
  { threshold: 1024 ** 3, unit: "gigabyte-per-second", divisor: 1024 ** 3, decimals: 2 },
  { threshold: 1024 ** 2, unit: "megabyte-per-second", divisor: 1024 ** 2, decimals: 1 },
  { threshold: 1024, unit: "kilobyte-per-second", divisor: 1024, decimals: 0 },
  { threshold: 0, unit: "byte-per-second", divisor: 1, decimals: 0 },
];

export function formatSpeed(bps: number, locale: string = navigator.language, display: UnitDisplay = "narrow"): string {
  const fmt = (value: number, unit: string, decimals: number) =>
    new Intl.NumberFormat(locale, {
      style: "unit",
      unit,
      unitDisplay: display,
      maximumFractionDigits: decimals,
    }).format(value);

  const { unit, divisor, decimals } = SPEED_UNITS.find(({ threshold }) => bps >= threshold)!;

  return fmt(bps / divisor, unit, decimals);
}

//
export function truncateName(name: string, max = 28): string {
  if (name.length <= max) return name;
  const ext = name.lastIndexOf(".");
  if (ext > 0) {
    const base = name.slice(0, ext);
    const extension = name.slice(ext);
    const keep = max - extension.length - 3;
    return `${base.slice(0, keep)}…${extension}`;
  }
  return `${name.slice(0, max - 1)}…`;
}

// TIME UNTIL
type RelativeTimeUnit = "day" | "hour" | "minute" | "second";

type RelativeTimePart = {
  threshold: number;
  unit: RelativeTimeUnit;
  divisor: number;
};

const RELATIVE_UNITS: RelativeTimePart[] = [
  { threshold: 1000 * 60 * 60 * 24, unit: "day", divisor: 1000 * 60 * 60 * 24 },
  { threshold: 1000 * 60 * 60, unit: "hour", divisor: 1000 * 60 * 60 },
  { threshold: 1000 * 60, unit: "minute", divisor: 1000 * 60 },
  { threshold: 0, unit: "second", divisor: 1000 },
];

export function timeUntil(
  iso: string,
  locale: string = navigator.language,
  style: "long" | "short" | "narrow" = "long",
): string {
  const diff = new Date(iso).getTime() - Date.now();

  if (diff <= 0) {
    return new Intl.RelativeTimeFormat(locale, { style }).format(0, "second");
  }

  const { unit, divisor } = RELATIVE_UNITS.find(({ threshold }) => diff >= threshold)!;

  const value = Math.floor(diff / divisor);

  return new Intl.RelativeTimeFormat(locale, { numeric: "always", style }).format(value, unit);
}
