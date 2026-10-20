import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App.tsx';

// Новая версия service worker взяла управление → один раз перезагружаемся, чтобы не показывать старую сборку
if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    let reloaded = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloaded) return;
        reloaded = true;
        location.reload();
    });
}

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { staleTime: 10_000, retry: 1, refetchOnWindowFocus: false },
    },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <App />
        </QueryClientProvider>
    </React.StrictMode>,
);
