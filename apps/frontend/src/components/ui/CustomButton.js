export default function Button({ onClick, icon, children, variant = 'primary', className = '', type = 'button', disabled = false, iconOnly = false }) {
    const base = 'rounded-md flex items-center justify-center font-medium transition-colors';

    const variants = {
        primary: 'bg-(--color-main) hover:bg-(--color-main-hover) text-white',
        outline: 'border border-(--color-main) text-(--color-main) hover:bg-(--color-main)/10 ',
        danger: 'bg-red-500 hover:bg-red-600 text-white',
        ghost: 'text-gray-600 hover:bg-gray-100 border border-gray-300',
        iconOnly: 'w-8 h-8 border border-gray-300 hover:bg-gray-100 text-gray-600 hover:text-gray-900',
        iconGhost: 'text-gray-500 hover:text-red-600 bg-transparent border-none',
        iconDanger: 'w-8 h-8 border border-red-200 hover:bg-red-50 text-red-400 hover:text-red-600',
    };

    const sizeClass = iconOnly ? '' : 'px-4 py-2 gap-2 text-sm h-9';
    const disabledClass = 'cursor-not-allowed bg-gray-400 opacity-50';
    const enabledClass = 'cursor-pointer';

    const resolvedVariant = iconOnly && variant === 'primary' ? 'iconOnly' : variant;

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${base} ${sizeClass} ${disabled ? disabledClass : `${variants[resolvedVariant]} ${enabledClass}`} ${className}`}
        >
            {icon && <span className="flex items-center">{icon}</span>}
            {children}
        </button>
    );
}