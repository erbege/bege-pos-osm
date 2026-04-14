export default function SecondaryButton({
    type = 'button',
    className = '',
    disabled,
    children,
    ...props
}) {
    return (
        <button
            {...props}
            type={type}
            className={
                `inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 transition-all duration-300 hover:bg-white/10 hover:text-white hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-white/10 ${
                    disabled ? 'opacity-25 cursor-not-allowed' : ''
                } ` + className
            }
            style={{ 
                backgroundColor: 'var(--g-bg-hover)', 
                borderColor: 'var(--g-border-strong)',
                color: 'var(--g-text-secondary)'
            }}
            disabled={disabled}
        >
            {children}
        </button>
    );
}
