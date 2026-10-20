import ru from './ru.json';

// В MVP только русский; для белорусского — добавить be.json и переключатель
const dict: Record<string, string> = ru;

export function t(key: string, params?: Record<string, string | number>): string {
    let s = dict[key] ?? key;
    if (params) for (const [k, v] of Object.entries(params)) s = s.replace(`{${k}}`, String(v));
    return s;
}
