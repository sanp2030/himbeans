/** QR pickup codes — HB-XXXXXX. Alphabet excludes 0/O/1/I/L to prevent misreads. */
export const PICKUP_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generatePickupCode(): string {
  let c = "";
  for (let i = 0; i < 6; i++) c += PICKUP_ALPHABET[Math.floor(Math.random() * PICKUP_ALPHABET.length)];
  return `HB-${c}`;
}

export function isValidPickupCode(code: string): boolean {
  return new RegExp(`^HB-[${PICKUP_ALPHABET}]{6}$`).test(code);
}
