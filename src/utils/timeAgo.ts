export function timeAgo(isoDate: string): string {
  const date = new Date(isoDate);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays >= 1) {
    return `${diffDays}d ago`;
  }
  if (diffHours >= 1) {
    return `${diffHours}h ago`;
  }
  if (diffMinutes >= 1) {
    return `${diffMinutes}m ago`;
  }
  return 'Just now';
}
