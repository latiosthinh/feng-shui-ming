import { z } from 'zod'

export const nameFormSchema = z.object({
  surname: z
    .string()
    .max(10, 'Surname must be 10 characters or less')
    .regex(
      /^[a-zA-ZÀ-ɏḀ-ỿ\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]*$/u,
      'Surname must contain only letters or CJK characters',
    )
    .optional()
    .or(z.literal('')),
  gender: z.enum(['male', 'female', 'neutral'], {
    errorMap: () => ({ message: 'Please select a gender' }),
  }),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional()
    .or(z.literal('')),
  birthTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format')
    .optional()
    .or(z.literal('')),
  preferences: z.array(z.string()).max(6, 'Maximum 6 preferences allowed').optional(),
})

export type NameFormValues = z.infer<typeof nameFormSchema>
