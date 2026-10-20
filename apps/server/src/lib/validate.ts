import type { z } from 'zod';
import { AppError } from './errors.js';

export function parse<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
    const result = schema.safeParse(data ?? {});
    if (!result.success) {
        throw new AppError('VALIDATION', 'Некорректные данные запроса', result.error.issues);
    }
    return result.data;
}
