import { z } from 'zod';

// Mirrors the backend createReportSchema in controllers/report.js exactly.
// Backend fields: category_id (int), address (string min 1), description (string min 10).
// Backend upload: multer allows only .jpg / .jpeg / .png, max 5 MB.
export const CreateReportSchema = z.object({
  category_id: z.string().min(1, 'Please select a category'),
  address: z.string().min(1, 'Address is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  image: z
    .any()
    .refine(
      (files: FileList) => files?.length > 0,
      'Image file is required'
    )
    .refine(
      (files: FileList) => !files?.[0] || files[0].size <= 5 * 1024 * 1024,
      'Image must be under 5 MB'
    )
    .refine(
      (files: FileList) =>
        !files?.[0] || ['image/jpeg', 'image/png'].includes(files[0].type),
      'Only JPG and PNG files are allowed'
    ),
});

export type CreateReportInput = z.infer<typeof CreateReportSchema>;
