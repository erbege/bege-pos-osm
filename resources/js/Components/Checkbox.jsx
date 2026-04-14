export default function Checkbox({ className = '', ...props }) {
    return (
        <input
            {...props}
            type="checkbox"
            className={
                'rounded-lg text-[#E84C30] shadow-sm transition-all focus:ring-[#E84C30]/20 ' +
                className
            }
            style={{ 
                backgroundColor: 'var(--g-input-bg)', 
                borderColor: 'var(--g-input-border)'
            }}
        />
    );
}
