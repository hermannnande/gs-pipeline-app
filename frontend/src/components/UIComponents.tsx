import { ReactNode, useEffect, useRef, useState } from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Hook interne : compteur anime (600ms ease-out).                     */
/* Desactive si prefers-reduced-motion.                                */
/* ------------------------------------------------------------------ */
function useCountUp(target: number, duration = 600): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduceMotion || !Number.isFinite(target)) {
      setValue(target);
      return;
    }

    const start = performance.now();
    const from = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return value;
}

/* ------------------------------------------------------------------ */
/* Sparkline SVG inline (sans lib) : polyline degradee + aire legere.  */
/* ------------------------------------------------------------------ */
const SPARK_COLORS: Record<string, { stroke: string; fill: string; id: string }> = {
  primary: { stroke: '#2E6BFF', fill: 'rgba(46,107,255,0.12)', id: 'sparkPrimary' },
  success: { stroke: '#10B981', fill: 'rgba(16,185,129,0.12)', id: 'sparkSuccess' },
  warning: { stroke: '#F59E0B', fill: 'rgba(245,158,11,0.12)', id: 'sparkWarning' },
  danger:  { stroke: '#EF4444', fill: 'rgba(239,68,68,0.12)',  id: 'sparkDanger' },
  default: { stroke: '#8B5CF6', fill: 'rgba(139,92,246,0.12)', id: 'sparkDefault' },
};

function Sparkline({ data, variant }: { data: number[]; variant: string }) {
  const W = 80;
  const H = 28;
  const PAD = 2;
  const colors = SPARK_COLORS[variant] || SPARK_COLORS.default;

  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = PAD + (i / (data.length - 1)) * (W - PAD * 2);
    const y = H - PAD - ((v - min) / range) * (H - PAD * 2);
    return [x, y] as const;
  });

  const linePath = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${(W - PAD).toFixed(1)},${H} L${PAD},${H} Z`;

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id={colors.id} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={colors.stroke} stopOpacity="0.55" />
          <stop offset="100%" stopColor={colors.stroke} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={colors.fill} stroke="none" />
      <path
        d={linePath}
        fill="none"
        stroke={`url(#${colors.id})`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Stats Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'default';
  /** Mini sparkline SVG (donnees brutes, ex: volumes par jour). */
  spark?: number[];
  className?: string;
}

export function StatCard({ title, value, icon: Icon, trend, variant = 'default', spark, className = '' }: StatCardProps) {
  const variantClasses = {
    primary: 'stat-card-primary',
    success: 'stat-card-success',
    warning: 'stat-card-warning',
    danger: 'stat-card-danger',
    default: '',
  };

  const chipClasses = {
    primary: 'chip-icon chip-icon-blue',
    success: 'chip-icon chip-icon-green',
    warning: 'chip-icon chip-icon-amber',
    danger: 'chip-icon chip-icon-red',
    default: 'chip-icon chip-icon-purple',
  };

  const isNumeric = typeof value === 'number' && Number.isFinite(value);
  const counted = useCountUp(isNumeric ? (value as number) : 0);
  const displayValue = isNumeric ? counted.toLocaleString('fr-FR') : value;

  return (
    <div className={`stat-card animate-fade-up ${variantClasses[variant]} ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 mb-1 truncate">{title}</p>
          <p className="text-[28px] sm:text-3xl font-extrabold text-gray-900 font-display leading-tight">
            {displayValue}
          </p>
          {trend && (
            <span className={`trend-pill mt-2 ${trend.isPositive ? 'trend-pill-up' : 'trend-pill-down'}`}>
              {trend.isPositive ? <TrendingUp size={12} strokeWidth={2.5} /> : <TrendingDown size={12} strokeWidth={2.5} />}
              {trend.value}
            </span>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className={chipClasses[variant]}>
            <Icon size={20} strokeWidth={2} />
          </div>
          {spark && spark.length > 1 && (
            <Sparkline data={spark} variant={variant} />
          )}
        </div>
      </div>
    </div>
  );
}

// Page Header Component
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, icon: Icon, actions }: PageHeaderProps) {
  return (
    <div className="mb-8 animate-fade-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          {Icon && (
            <div className="hidden sm:flex p-3 bg-gradient-to-br from-primary-600 to-primary-500 text-white rounded-2xl shadow-glow-primary">
              <Icon size={26} strokeWidth={2} />
            </div>
          )}
          <div>
            <h1 className="text-2xl sm:text-[28px] font-bold text-gray-900 font-display leading-tight">{title}</h1>
            {subtitle && <p className="text-gray-500 mt-1 font-medium text-sm sm:text-base">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

// Empty State Component
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-16 px-4 animate-fade-up">
      <div className="inline-flex p-6 bg-gradient-to-br from-primary-50 to-white border border-primary-100 rounded-3xl mb-6">
        <Icon size={44} className="text-primary-300" strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2 font-display">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-sm mx-auto">{description}</p>
      {action && (
        <button onClick={action.onClick} className="btn btn-primary">
          {action.label}
        </button>
      )}
    </div>
  );
}

// Loading State Component
interface LoadingStateProps {
  text?: string;
}

export function LoadingState({ text = 'Chargement en cours...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="relative h-12 w-12 mb-4">
        <div className="absolute inset-0 rounded-full border-4 border-primary-100" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-600 animate-spin" />
      </div>
      <p className="text-gray-500 font-medium">{text}</p>
    </div>
  );
}

// Alert Component
interface AlertProps {
  variant: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  children: ReactNode;
  onClose?: () => void;
}

export function Alert({ variant, title, children, onClose }: AlertProps) {
  const variantClasses = {
    info: 'bg-primary-50 border-primary-200 text-primary-800',
    success: 'bg-success-50 border-success-200 text-success-800',
    warning: 'bg-warning-50 border-warning-200 text-warning-800',
    danger: 'bg-danger-50 border-danger-200 text-danger-800',
  };

  return (
    <div className={`rounded-xl border p-4 ${variantClasses[variant]} animate-slide-down`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          {title && <h4 className="font-semibold mb-1">{title}</h4>}
          <div className="text-sm">{children}</div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-current opacity-50 hover:opacity-100 transition-opacity"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

// Badge with Icon Component
interface BadgeWithIconProps {
  icon: LucideIcon;
  label: string;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'gray';
}

export function BadgeWithIcon({ icon: Icon, label, variant = 'gray' }: BadgeWithIconProps) {
  const variantClasses = {
    primary: 'badge-primary',
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    gray: 'badge-gray',
  };

  return (
    <span className={`badge ${variantClasses[variant]}`}>
      <Icon size={14} strokeWidth={2.5} />
      {label}
    </span>
  );
}

// Search Input Component
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: LucideIcon;
}

export function SearchInput({ value, onChange, placeholder = 'Rechercher...', icon: Icon }: SearchInputProps) {
  return (
    <div className="relative">
      {Icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
          <Icon size={20} />
        </div>
      )}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`input ${Icon ? 'pl-12' : ''}`}
      />
    </div>
  );
}

// Modal Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, footer, size = 'md' }: ModalProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
    xl: 'sm:max-w-4xl',
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-content ${sizeClasses[size]}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 font-display">{title}</h2>
        </div>
        <div className="p-6">{children}</div>
        {footer && <div className="p-6 border-t border-gray-100 bg-gray-50/60 rounded-b-2xl">{footer}</div>}
      </div>
    </div>
  );
}

// Skeleton Loaders
export function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="skeleton h-6 w-1/3 mb-4"></div>
      <div className="skeleton h-4 w-full mb-2"></div>
      <div className="skeleton h-4 w-2/3"></div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="skeleton h-16 w-full"></div>
      ))}
    </div>
  );
}

// Tooltip Component (simple version)
interface TooltipProps {
  content: string;
  children: ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  return (
    <div className="group relative inline-block">
      {children}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
        {content}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
}
