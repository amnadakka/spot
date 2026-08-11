/** Split a geocoded address into a short identity line and multi-line detail lines. */

function splitAddressParts(address: string): string[] {
  return address
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function isLikelyHouseNumber(value: string): boolean {
  return /^\d+[a-zA-Z]?$/.test(value);
}

/** Short subtitle under the spot title (not the full address). */
export function formatShortLocationSummary(address: string): string {
  const parts = splitAddressParts(address);
  if (parts.length === 0) {
    return address;
  }
  if (parts.length === 1) {
    return parts[0];
  }

  // "20, Eisenachstraße, Köln, …" → "Eisenachstraße, Köln"
  if (isLikelyHouseNumber(parts[0]) && parts.length >= 3) {
    return `${parts[1]}, ${parts[2]}`;
  }

  // "Eisenachstraße 20, Köln, …" or "Street, City, …"
  return `${parts[0]}, ${parts[1]}`;
}

/** Full address as 1–2 readable lines for the Location section. */
export function formatAddressDisplayLines(address: string): string[] {
  const parts = splitAddressParts(address);
  if (parts.length === 0) {
    return [address];
  }
  if (parts.length === 1) {
    return parts;
  }

  // "20, Eisenachstraße, Köln, Nordrhein-Westfalen" →
  // "20 Eisenachstraße" / "Köln, Nordrhein-Westfalen"
  if (isLikelyHouseNumber(parts[0]) && parts.length >= 2) {
    const line1 = `${parts[0]} ${parts[1]}`;
    const line2 = parts.slice(2).join(', ');
    return line2 ? [line1, line2] : [line1];
  }

  const line1 = parts[0];
  const line2 = parts.slice(1).join(', ');
  return line2 ? [line1, line2] : [line1];
}
