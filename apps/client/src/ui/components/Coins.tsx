import { formatCoins } from '@mt/shared';

export function Coins({ value }: { value: number }) {
    return <span className="coins">{formatCoins(value)}</span>;
}
