import { z } from 'zod';
import { DAY_MS_DEFAULT } from '@mt/shared';

const Env = z.object({
    DATABASE_URL: z.string().default('file:./dev.db'),
    PORT: z.coerce.number().default(3000),
    HOST: z.string().default('0.0.0.0'),
    CLIENT_ORIGIN: z.string().default('http://localhost:8080'),
    DAY_MS: z.coerce.number().int().positive().default(DAY_MS_DEFAULT),
    DEV_ENDPOINTS: z
        .enum(['true', 'false'])
        .default('false')
        .transform((v) => v === 'true'),
    SESSION_SECRET: z.string().min(1).default('change-me'),
});

export const env = Env.parse(process.env);
