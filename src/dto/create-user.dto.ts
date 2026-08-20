import {z} from 'zod';

export const createUserSchema = z.object({
    email: z.email('email має бути коректною поштою'),
    name: z.string().min(2, 'name має містити щонайменше 2 символи'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
