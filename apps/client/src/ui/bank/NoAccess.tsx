import type { GameState } from '@mt/shared';
import { LockKeyIcon } from '@phosphor-icons/react';

/** Ребёнок без доступа: пакет не оформлен или родитель выключил вход в Moby */
export function NoAccess({ game }: { game: GameState }) {
    const noPkg = !game.pkg;
    return (
        <div className="no-access">
            <div className="no-access-icon">
                <LockKeyIcon size={44} weight="duotone" />
            </div>
            <span className="display" style={{ fontSize: 22, textAlign: 'center' }}>
                {noPkg ? 'Moby Семья ещё не оформлена' : 'Вход в Moby выключен'}
            </span>
            <span className="body" style={{ textAlign: 'center' }}>
                {noPkg
                    ? 'Попроси родителя оформить пакет «Moby Семья» в его Moby. Он выпустит тебе карту и пришлёт код для входа.'
                    : 'Родитель временно выключил вход. Карта при этом работает по его настройкам. Чтобы вернуть доступ, поговори с родителем.'}
            </span>
        </div>
    );
}
