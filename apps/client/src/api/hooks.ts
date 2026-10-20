import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
    AuthSessionBody,
    BankOverviewDto,
    OnboardingCompleteBody,
    PlayerDto,
    ProductDto,
    SessionDto,
    ShopDto,
} from '@mt/shared';
import { emit } from '../game/EventBus';
import { moby } from '../moby';
import { useSession } from '../store/session';
import { api } from './client';

export const keys = {
    me: ['me'] as const,
    bank: ['bank'] as const,
    shops: ['shops'] as const,
    products: (shopId: string) => ['shops', shopId, 'products'] as const,
};

export function useMe() {
    const token = useSession((s) => s.token);
    return useQuery({ queryKey: keys.me, queryFn: () => api<PlayerDto>('/player/me'), enabled: !!token });
}

export function useBankOverview() {
    return useQuery({ queryKey: keys.bank, queryFn: () => api<BankOverviewDto>('/bank/overview') });
}

export function useShops() {
    return useQuery({ queryKey: keys.shops, queryFn: () => api<ShopDto[]>('/shops') });
}

export function useProducts(shopId: string) {
    return useQuery({ queryKey: keys.products(shopId), queryFn: () => api<ProductDto[]>(`/shops/${shopId}/products`) });
}

/** Вход через Moby: токен берём у моста, сервер узнаёт по нему ребёнка. Формы регистрации нет. */
export function useMobyLogin() {
    const qc = useQueryClient();
    const setToken = useSession((s) => s.setToken);
    return useMutation({
        mutationFn: async () => {
            const body: AuthSessionBody = { mobyToken: await moby.getAuthToken() };
            return api<SessionDto>('/auth/session', { body });
        },
        onSuccess: ({ sessionToken, player }) => {
            setToken(sessionToken);
            qc.setQueryData(keys.me, player);
        },
    });
}

export function useCompleteOnboarding() {
    return usePlayerMutation((body: OnboardingCompleteBody) => api<PlayerDto>('/onboarding/complete', { body }));
}

export function useDevTimeSkip() {
    return usePlayerMutation((days: number) => api<PlayerDto>('/dev/time-skip', { body: { days } }));
}

/** Мутация, которая возвращает актуального игрока: обновляет кэш и перерисовывает город */
function usePlayerMutation<V>(fn: (vars: V) => Promise<PlayerDto>) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: fn,
        onSuccess: (player) => {
            qc.setQueryData(keys.me, player);
            qc.invalidateQueries({ queryKey: keys.bank });
            emit('city:refresh');
        },
    });
}
