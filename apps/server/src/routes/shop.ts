import type { FastifyPluginAsync } from 'fastify';
import type { ProductDto, ShopDto } from '@mt/shared';
import { prisma } from '../db.js';
import { notImplemented } from './todo.js';

export const shopRoutes: FastifyPluginAsync = async (app) => {
    app.get('/shops', async (): Promise<ShopDto[]> => prisma.shop.findMany({ orderBy: { name: 'asc' } }));

    app.get<{ Params: { id: string } }>('/shops/:id/products', async (req): Promise<ProductDto[]> =>
        prisma.product.findMany({
            where: { shopId: req.params.id },
            select: {
                id: true,
                shopId: true,
                sku: true,
                name: true,
                price: true,
                bulkMinQty: true,
                bulkPrice: true,
                shelfLife: true,
            },
            orderBy: { name: 'asc' },
        }),
    );

    app.post('/shops/:id/buy', notImplemented('feat/shop'));
    app.post('/market/sell', notImplemented('feat/shop'));
};
