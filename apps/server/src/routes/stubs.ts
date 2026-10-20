import type { FastifyPluginAsync } from 'fastify';
import { JOBS, LESSONS, salaryAfterTax } from '@mt/shared';
import { prisma } from '../db.js';
import { notImplemented } from './todo.js';

// Секторы, которые пока только читают справочники. По мере реализации выносите в отдельные файлы.

export const businessRoutes: FastifyPluginAsync = async (app) => {
    app.post('/business', notImplemented('feat/business'));
    app.post('/business/register', notImplemented('feat/business'));
    app.post('/business/produce', notImplemented('feat/business'));
    app.get('/business/report', notImplemented('feat/business'));
};

export const jobsRoutes: FastifyPluginAsync = async (app) => {
    app.get('/jobs', async () => JOBS.map((j) => ({ ...j, wage: salaryAfterTax(j.baseWage) })));
    app.post('/jobs/:id/shift', notImplemented('feat/jobs'));
};

export const medicalRoutes: FastifyPluginAsync = async (app) => {
    app.post('/medical/treat', notImplemented('feat/medical'));
    app.post('/medical/insurance', notImplemented('feat/medical'));
};

export const lessonsRoutes: FastifyPluginAsync = async (app) => {
    // Правильные ответы клиенту не отдаём
    app.get('/lessons', async (req) => {
        const progress = await prisma.lessonProgress.findMany({ where: { playerId: req.playerId } });
        return LESSONS.map((l) => ({
            id: l.id,
            title: l.title,
            knowledgeReward: l.knowledgeReward,
            questions: l.questions.map(({ text, options }) => ({ text, options })),
            progress: progress.find((p) => p.lessonId === l.id) ?? null,
        }));
    });
    app.post('/lessons/:id/answer', notImplemented('feat/lessons'));
};

// В MVP родитель — mock-режим того же клиента; в пилоте — отдельная авторизация через Moby.
export const parentRoutes: FastifyPluginAsync = async (app) => {
    app.post('/parent/tasks', notImplemented('feat/parent'));
    app.post('/parent/tasks/:id/approve', notImplemented('feat/parent'));
    app.post('/parent/pocket-money', notImplemented('feat/parent'));
    app.get('/parent/report/:playerId', notImplemented('feat/parent'));
};
