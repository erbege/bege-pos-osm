export default function InputLabel({
    value,
    className = '',
    children,
    ...props
}) {
    return (
        <label
            {...props}
            className={
                `block text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-2 ml-1 ` +
                className
            }
            style={{ color: 'var(--g-text-tertiary)' }}
        >
            {value ? value : children}
        </label>
    );
}
