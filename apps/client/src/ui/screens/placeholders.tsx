import { Placeholder } from '../components/Placeholder';

// Заглушки секторов. Реализуя сектор, создайте папку screens/<Сектор>/ и уберите его отсюда.

type Props = { onClose: () => void };

export const LegalCenter = ({ onClose }: Props) => (
    <Placeholder title="Юрцентр" onClose={onClose} todo="POST /business/register — выбор формы, пошлина" />
);

export const Jobs = ({ onClose }: Props) => (
    <Placeholder title="Биржа труда" onClose={onClose} todo="GET /jobs, мини-игра «Бариста», POST /jobs/:id/shift" />
);

export const Medical = ({ onClose }: Props) => (
    <Placeholder title="Медцентр" onClose={onClose} todo="POST /medical/treat, POST /medical/insurance" />
);

export const Market = ({ onClose }: Props) => (
    <Placeholder title="Рынок" onClose={onClose} todo="POST /market/sell — продажа и итог прибыли" />
);

export const BusinessBuilder = ({ onClose }: Props) => (
    <Placeholder
        title="Мой участок"
        onClose={onClose}
        todo="Конструктор бизнес-идеи: POST /business, /business/produce"
    />
);

export const Lessons = ({ onClose }: Props) => (
    <Placeholder title="Уроки" onClose={onClose} todo="Квиз «Купля-продажа», POST /lessons/:id/answer" />
);

export const Parent = ({ onClose }: Props) => (
    <Placeholder title="Родительский кабинет" onClose={onClose} todo="Задания, подтверждение, карманные (mock Moby)" />
);
