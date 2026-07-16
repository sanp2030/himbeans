import { z } from "zod";

export const reservationSchema = z.object({
  locationId: z.string().min(1),
  name: z.string().min(2).max(80),
  email: z.string().email(),
  phone: z.string().min(6).max(20).optional(),
  date: z.coerce.date().refine((d) => d.getTime() > Date.now(), "Choose a future date"),
  guests: z.coerce.number().int().min(1).max(20),
  request: z.string().max(500).optional(),
});

export const orderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(50),
  customization: z.record(z.string(), z.unknown()).optional(),
});

/** Phone: country-selected, exactly 10 national digits, normalized to E.164. */
export const PHONE_COUNTRIES = {
  NP: { code: "+977", label: "Nepal (+977)" },
  IN: { code: "+91", label: "India (+91)" },
  US: { code: "+1", label: "USA (+1)" },
} as const;
export type PhoneCountry = keyof typeof PHONE_COUNTRIES;

export const namePattern = /^(?=.*\p{L})[\p{L}\p{M}'. -]{2,80}$/u; // 2-80 chars, must contain a letter

export const createOrderSchema = z
  .object({
    locationId: z.string().min(1),
    fulfilment: z.enum(["PICKUP", "DELIVERY", "DINE_IN"]),
    addressId: z.string().optional(),
    couponCode: z.string().max(32).optional(),
    items: z.array(orderItemSchema).min(1).max(50),
    notes: z.string().max(500).optional(),
    // Guest checkout - strict inputs, not decoration
    guestName: z.string().trim().regex(namePattern, "Enter your real name (2-80 letters).").optional(),
    guestPhoneCountry: z.enum(["NP", "IN", "US"]).default("NP"),
    guestPhone: z.string().trim().regex(/^\d{10}$/, "Phone must be exactly 10 digits.").optional(),
    guestEmail: z.string().email().optional(),
    scheduledFor: z.coerce.date().optional(),
    payOnline: z.boolean().default(false),
    giftCardCode: z.string().trim().toUpperCase().max(24).optional(),
  })
  .transform((o) => ({
    ...o,
    // store E.164 (+9779812345678); SMS and staff callbacks depend on it
    guestPhone: o.guestPhone ? PHONE_COUNTRIES[o.guestPhoneCountry].code + o.guestPhone : undefined,
  }));

export const newsletterSchema = z.object({ email: z.string().email() });
