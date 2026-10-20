// Заливает справочник магазинов и товаров из @mt/shared в БД. Запуск: npm run db:seed -w server
// Вакансии, уроки и типы бизнеса — в @mt/shared/config.ts.

import { SHOP_CATALOG } from '@mt/shared';
import { prisma } from '../src/db.js';

async function main() {
    for (const { products, ...shop } of SHOP_CATALOG) {
        await prisma.shop.upsert({ where: { id: shop.id }, update: shop, create: shop });
        for (const p of products) {
            const data = { ...p, shopId: shop.id };
            await prisma.product.upsert({
                where: { shopId_sku: { shopId: shop.id, sku: p.sku } },
                update: data,
                create: data,
            });
        }
    }
    console.log(`Seeded ${SHOP_CATALOG.length} shops`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
