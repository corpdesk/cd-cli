// utils/safe-stringify.ts

export function safeStringify(obj: any): string {
  const seen = new WeakSet();

  return JSON.stringify(obj, function (key, value) {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return "[Circular]";
      }
      seen.add(value);
    }
    return value;
  });
}
