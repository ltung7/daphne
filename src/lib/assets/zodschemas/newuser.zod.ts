import { z } from 'zod';

export const newUserSchema = z.object({
	id: z.string(),
	name: z.string().min(1, { error: 'Imię i nazwisko jest wymagane' }),
	email: z.email({ error: 'Nieprawidłowy adres e-mail' }),
	role: z.enum([ 'moderator', 'manager', 'admin', 'revoked' ]),
	preferredLanguage: z.literal('pl'),
	timestamp: z.number(),
	updatedAt: z.number(),
	lastLoggedIn: z.number(),
	canSignHandovers: z.boolean()
});

export type NewUserInput = z.infer<typeof newUserSchema>;