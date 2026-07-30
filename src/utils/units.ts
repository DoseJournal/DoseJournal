// Conversion factors to a common base unit (mg)
const TO_MG: Record<string, number> = {
  mcg: 0.001,
  mg: 1,
  g: 1000,
};

/** Convert a value from one unit to another. Returns null if either unit is not convertible (e.g. ml). */
export function convertUnit(value: number, from: string, to: string): number | null {
  if (from === to) return value;
  const fromFactor = TO_MG[from];
  const toFactor = TO_MG[to];
  if (fromFactor === undefined || toFactor === undefined) return null;
  return (value * fromFactor) / toFactor;
}

export function isConvertible(unit: string): boolean {
  return unit in TO_MG;
}
