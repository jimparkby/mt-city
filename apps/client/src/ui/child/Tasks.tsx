import type { GameState } from '@mt/shared';
import { useGameAction } from '../../api/hooks';
import { useUi } from '../../store/ui';
import { byn } from '../format';
import { TASK_ICONS } from '../icons';
import { useTeen } from '../roles';

/** Задания от мамы: «Готово» → на проверку → деньги на карту */
export function Tasks({ game }: { game: GameState }) {
    const teen = useTeen();
    const action = useGameAction();
    const flash = useUi((s) => s.flash);
    const tasks = [...game.tasks].reverse();

    return (
        <div className="stack" style={{ gap: 22 }}>
            <div className="stack" style={{ gap: 6 }}>
                <span className="h1">Задания от мамы</span>
                <span className="small">Сделай и нажми «Готово». Мама проверит и переведёт деньги на твою карту.</span>
            </div>
            <div className="stack" style={{ gap: 8 }}>
                {tasks.map((t) => {
                    const Ico = TASK_ICONS[t.icon];
                    const paid = t.status === 'paid';
                    return (
                        <div key={t.id} className="task-card">
                            <div className={`tile ${paid ? 'muted' : ''}`}>
                                <Ico size={24} weight="duotone" />
                            </div>
                            <div className="grow">
                                <b>{t.title}</b>
                                <span className="reward num">
                                    +{byn(t.byn)} BYN{teen ? '' : ` · +${t.byn / 10} MTcoin`}
                                </span>
                                {t.status === 'open' && t.returned && (
                                    <span className="returned">Мама вернула: доделай</span>
                                )}
                            </div>
                            {t.status === 'open' && (
                                <button
                                    className="btn compact"
                                    onClick={() => {
                                        action.mutate({ type: 'task/submit', id: t.id });
                                        flash('Отправлено маме на проверку');
                                    }}
                                >
                                    Готово
                                </button>
                            )}
                            {t.status === 'review' && <span className="badge warn">На проверке</span>}
                            {paid && <span className="badge ok">Оплачено</span>}
                        </div>
                    );
                })}
            </div>
            {game.gradesOn && game.gradeFeed.length > 0 && (
                <div className="stack" style={{ gap: 8 }}>
                    <span className="h2">За оценки</span>
                    <span className="small">
                        Мама платит за 10 — {byn(game.rules[10])} BYN, за 9 — {byn(game.rules[9])} BYN, за 8 —{' '}
                        {byn(game.rules[8])} BYN
                    </span>
                    <div className="list-card">
                        {[...game.gradeFeed].reverse().map((g, i) => (
                            <div key={i} className="grade-row">
                                <span className="grade">{g.g}</span>
                                <span className="grow">{g.subj}</span>
                                <b className="pos num">{g.amt ? `+${byn(g.amt)} BYN` : '—'}</b>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
