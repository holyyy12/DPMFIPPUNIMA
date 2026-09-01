import { z } from 'zod';

export const ddasSubmissionSchema = z.object({
  category: z.string().trim().min(2).max(80),
  subject: z.string().trim().min(8).max(180),
  body: z.string().trim().min(20).max(12000),
  email: z.string().trim().email().max(254).optional().or(z.literal('')),
  consent: z.literal(true),
  notificationOptIn: z.boolean().default(false),
  idempotencyKey: z.string().uuid(),
  website: z.string().max(0).optional(),
});

export const ddasTrackingSchema = z.object({
  ticket: z.string().trim().toUpperCase().regex(/^D-DAS-\d{4}-[A-Z0-9]{20,}$/),
  secret: z.string().trim().min(32).max(128),
});
