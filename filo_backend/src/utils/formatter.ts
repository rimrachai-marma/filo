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
