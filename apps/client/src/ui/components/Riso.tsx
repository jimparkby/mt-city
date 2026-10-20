/** Крупный заголовок шрифтом Unbounded с градиентом бренда */
export function Riso({ children, className }: { children: string | number; className?: string }) {
    return <span className={`riso ${className ?? ''}`}>{children}</span>;
}
