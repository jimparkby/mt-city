import type { RouteHandlerMethod } from 'fastify';

/** Заглушка для эндпоинтов из ТЗ, которые ещё не реализованы. Удалить, когда всё будет готово. */
export function notImplemented(branch: string): RouteHandlerMethod {
    return async (req, reply) =>
        reply.code(501).send({
            error: { code: 'NOT_IMPLEMENTED', message: `${req.method} ${req.routeOptions.url} — в работе (${branch})` },
        });
}
