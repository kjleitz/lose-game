export function createId(prefix: string): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 9);
  return `${prefix}-${ts}-${rand}`;
}
