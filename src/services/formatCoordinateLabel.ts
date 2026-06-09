export function formatCoordinateLabel(latitude: number, longitude: number): string {
  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
}
