// Matches a medication's scheduled time slots (e.g. ['9:00 AM', '1:00 PM'])
// against the actual logs taken that day, so multi-dose medications are
// tracked per-slot instead of "any log today = fully taken".

function parseTimeToMinutes(time: string): number {
  const [rawTime, period] = time.split(' ');
  const [h, m] = rawTime.split(':').map(Number);
  let hours = h % 12;
  if (period === 'PM') hours += 12;
  return hours * 60 + (m || 0);
}

function timestampToMinutes(ts: Date | string): number {
  const d = new Date(ts);
  return d.getHours() * 60 + d.getMinutes();
}

export interface SlotResult {
  time: string;
  taken: boolean;
  logTimestamp?: Date;
}

/**
 * For a medication's scheduled times and that medication's logs on one specific day,
 * returns one result per scheduled slot, greedily matching each slot to its closest
 * unused log (so 2 logs against 2 slots = 2 matches, not double-counting one log).
 */
export function matchSlotsForDay(times: string[], dayLogs: { id: string; timestamp: Date | string }[]): SlotResult[] {
  const used = new Set<string>();

  return times.map(time => {
    const scheduledMins = parseTimeToMinutes(time);
    let best: { id: string; timestamp: Date | string } | null = null;
    let bestDiff = Infinity;

    for (const log of dayLogs) {
      if (used.has(log.id)) continue;
      const diff = Math.abs(timestampToMinutes(log.timestamp) - scheduledMins);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = log;
      }
    }

    if (best) used.add(best.id);
    return {
      time,
      taken: !!best,
      logTimestamp: best ? new Date(best.timestamp) : undefined,
    };
  });
}

/** Total scheduled doses and how many were actually taken, across a list of medications, for one day. */
export function getDayDoseSummary(
  scheduledMeds: { id: string; times: string[] }[],
  logsThatDay: { id: string; medicationId: string; timestamp: Date | string }[]
) {
  let expected = 0;
  let taken = 0;

  for (const med of scheduledMeds) {
    const medLogs = logsThatDay.filter(l => l.medicationId === med.id);
    const slots = matchSlotsForDay(med.times, medLogs);
    expected += slots.length;
    taken += slots.filter(s => s.taken).length;
  }

  return { expected, taken };
}
