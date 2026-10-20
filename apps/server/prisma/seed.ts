// Справочник магазинов и товаров. Запуск: npm run db:seed -w server
// Вакансии, уроки и типы бизнеса — в @mt/shared/config.ts.

import { prisma } from '../src/db.js';

interface SeedProduct {
    sku: string;
    name: string;
    price: number;
    bulkMinQty?: number;
    bulkPrice?: number;
    shelfLife?: number;
    demandBase?: number;
    refPrice?: number;
}

const shops: { id: string; name: string; category: string; district: string; products: SeedProduct[] }[] = [
    {
        id: 'sosedi',
        name: 'Соседи',
        category: 'grocery',
        district: 'residential',
        products: [
            { sku: 'apple', name: 'Яблоко', price: 100, bulkMinQty: 10, bulkPrice: 80, shelfLife: 5, refPrice: 150 },
            { sku: 'lemon', name: 'Лимон', price: 120, bulkMinQty: 10, bulkPrice: 95, shelfLife: 7 },
            { sku: 'sugar', name: 'Сахар (порция)', price: 30, bulkMinQty: 20, bulkPrice: 22 },
            { sku: 'milk', name: 'Молоко (порция)', price: 60, bulkMinQty: 10, bulkPrice: 48, shelfLife: 3 },
        ],
    },
    {
        id: 'green',
        name: 'Грин',
        category: 'hypermarket',
        district: 'center',
        products: [
            { sku: 'apple', name: 'Яблоко', price: 110, bulkMinQty: 20, bulkPrice: 75, shelfLife: 5, refPrice: 150 },
            { sku: 'cup', name: 'Стаканчик', price: 20, bulkMinQty: 50, bulkPrice: 12 },
            { sku: 'sugar', name: 'Сахар (порция)', price: 28, bulkMinQty: 50, bulkPrice: 18 },
            { sku: 'lemon', name: 'Лимон', price: 130, bulkMinQty: 20, bulkPrice: 85, shelfLife: 7 },
        ],
    },
    {
        id: 'cofix',
        name: 'Cofix',
        category: 'coffee',
        district: 'center',
        products: [
            { sku: 'coffee_beans', name: 'Кофейные зёрна (порция)', price: 150, bulkMinQty: 10, bulkPrice: 120 },
            { sku: 'coffee', name: 'Кофе', price: 350, shelfLife: 1, demandBase: 25, refPrice: 350 },
            { sku: 'lemonade', name: 'Лимонад', price: 300, shelfLife: 1, demandBase: 20, refPrice: 300 },
        ],
    },
];

async function main() {
    for (const { products, ...shop } of shops) {
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
    console.log(`Seeded ${shops.length} shops`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
