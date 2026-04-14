import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

export default forwardRef(function TextInput(
    { type = 'text', className = '', isFocused = false, ...props },
    ref,
) {
    const localRef = useRef(null);

    useImperativeHandle(ref, () => ({
        focus: () => localRef.current?.focus(),
    }));

    useEffect(() => {
        if (isFocused) {
            localRef.current?.focus();
        }
    }, [isFocused]);

    return (
        <input
            {...props}
            type={type}
            className={
                'rounded-xl text-sm transition-all duration-300 px-4 py-2.5 outline-none ' +
                'focus:ring-2 focus:ring-[#E84C30]/20 focus:border-[#E84C30] ' +
                'placeholder:text-white/20 dark:placeholder:text-white/20 light:placeholder:text-slate-400 ' +
                className
            }
            style={{ 
                backgroundColor: 'var(--g-input-bg)', 
                border: '1px solid var(--g-input-border)',
                color: 'var(--g-text-primary)'
            }}
            ref={localRef}
        />
    );
});
