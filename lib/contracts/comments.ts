import { z } from 'zod';

const threadKey = z.string().trim().regex(/^publication:[a-z0-9-]{3,160}$/);

export const commentCreateSchema = z.object({
  threadKey,
  parentId: z.string().uuid().nullable().optional(),
  displayMode: z.enum(['anonymous', 'named']),
  displayName: z.string().trim().min(2).max(60).optional().or(z.literal('')),
  body: z.string().trim().min(2).max(4000),
  website: z.string().max(0).optional(),
}).superRefine((value, context) => {
  if (value.displayMode === 'named' && !value.displayName) context.addIssue({ code:'custom', path:['displayName'], message:'Nama tampilan wajib diisi.' });
});

export const commentDeleteSchema = z.object({ commentId:z.string().uuid(), deletionSecret:z.string().min(32).max(160) });
export const commentReportSchema = z.object({ commentId:z.string().uuid(), category:z.enum(['spam','harassment','privacy','misinformation','other']), detail:z.string().trim().max(500).optional().or(z.literal('')) });

