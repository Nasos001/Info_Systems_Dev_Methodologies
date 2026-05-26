import { z } from 'zod';

export const AuthResponseSchema = z.object({
  token: z.string(),
  role: z.enum(["citizen", "admin", "technician"]),
  user: z.object({
    id: z.number(),
    full_name: z.string(),
    email: z.string(),
  }),
});

export const GenericMessageSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().optional(),
});

export const ValidationErrorSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  errors: z.array(
    z.object({
      path: z.string(),
      message: z.string(),
    }),
  ),
});
