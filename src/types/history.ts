export type HistoryEvent = {
  id: string;
  reminderId: string;
  spotTitle: string;
  address: string;
  triggeredAt: string;
  /** Snapshot at trigger time so detail view works after the spot is deleted. */
  latitude?: number;
  longitude?: number;
  radiusMeters?: number;
  description?: string;
};
