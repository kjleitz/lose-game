let nextId = 0;

export function uid(prefix: string): string {
  nextId += 1;
  return `${prefix}-${nextId}`;
}
