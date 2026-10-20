/** Заголовок «рисографом»: три краски со сдвигом поверх бумаги */
export function Riso({ children, className }: { children: string | number; className?: string }) {
    return (
        <span className={`riso ${className ?? ''}`} aria-label={String(children)}>
            <span aria-hidden>{children}</span>
            <span aria-hidden>{children}</span>
            <span aria-hidden>{children}</span>
            <span aria-hidden>{children}</span>
        </span>
    );
}
