// src/utils/cn.ts

// Fix: sebelumnya union ini belum mencakup `bigint`. Ekspresi kondisional seperti
// `someReactNode && "some-class"` bisa menghasilkan `0n` (falsy bigint) karena tipe
// `ReactNode` di React 19 sudah mencakup `bigint`. Tanpa ini, TypeScript menolak
// pemanggilan cn(...) di komponen manapun yang melakukan `icon && "class-name"`.
type ClassValue =
  | string
  | number
  | bigint
  | null
  | undefined
  | false
  | ClassValue[];

/**
 * Gabungkan class Tailwind dengan aman, filter falsy value.
 * Versi ringan tanpa dependency `clsx`/`tailwind-merge` — cukup untuk kebutuhan
 * conditional className di seluruh komponen UI SistemPOS.
 */
export function cn(...inputs: ClassValue[]): string {
  const result: string[] = [];

  for (const input of inputs) {
    if (!input) continue;
    if (Array.isArray(input)) {
      const nested = cn(...input);
      if (nested) result.push(nested);
    } else {
      result.push(String(input));
    }
  }

  return result.join(" ");
}
