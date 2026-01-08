
import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

/**
 * PRODUCTION-GRADE UI COMPONENTS
 * Optimized for high-glare environments (Film Sets).
 * Enhanced hit areas for mobile/gloved usage (Min 54px).
 */

export const Heading = ({ children, level = 1, className }: { children?: React.ReactNode, level?: 1 | 2 | 3 | 4, className?: string }) => {
  const styles = {
    1: "heading-huge text-white mb-8",
    2: "font-serif italic text-4xl md:text-7xl text-white tracking-tighter mb-8 leading-[0.85]",
    3: "font-serif italic text-3xl md:text-4xl text-white tracking-tight leading-tight",
    4: "font-sans font-black uppercase tracking-[0.5em] text-[11px] md:text-[12px] text-accent italic"
  };
  const Tag = `h${level}` as React.ElementType;
  return <Tag className={clsx(styles[level], className)}>{children}</Tag>;
};

export const Text = ({ children, className, variant = "body", uppercase = false }: { children?: React.ReactNode, className?: string, variant?: "body" | "subtle" | "small" | "caption", uppercase?: boolean }) => {
  const styles = {
    body: "text-lg md:text-xl text-white/90 font-light leading-relaxed", 
    subtle: "text-white/70 font-light leading-relaxed", 
    small: "text-[15px] text-white/60 leading-snug", 
    caption: "text-[11px] md:text-[12px] font-black tracking-[0.6em] text-accent uppercase italic"
  };
  return <p className={clsx(styles[variant], uppercase && "uppercase", className)}>{children}</p>;
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'glass';
  isLoading?: boolean;
  className?: string;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

export const Button = ({ children, variant = 'primary', className, isLoading, disabled, ...props }: ButtonProps) => {
  const variants = {
    primary: "bg-white text-black hover:bg-accent transition-all duration-300 shadow-[0_4px_14px_0_rgba(255,255,255,0.1)]",
    secondary: "bg-white/10 text-white hover:bg-white hover:text-black border border-white/30",
    outline: "bg-transparent border border-white/40 text-white hover:border-accent hover:text-accent",
    ghost: "bg-transparent text-white/70 hover:text-white hover:bg-white/10",
    danger: "bg-red-500/20 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white",
    glass: "glass-ui text-white hover:bg-white/20"
  };

  return (
    <button 
      className={clsx(
        "inline-flex items-center justify-center px-8 md:px-12 py-5 md:py-6 min-h-[58px] text-[12px] font-black uppercase tracking-[0.5em] transition-all duration-500 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed rounded-none border border-transparent",
        variants[variant],
        className
      )}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-4 animate-spin" />}
      {children}
    </button>
  );
};

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={clsx(
        "w-full px-8 py-6 bg-white/[0.05] border border-white/20 text-white text-lg focus:outline-none focus:border-accent transition-all placeholder:text-white/30 backdrop-blur-3xl rounded-none font-light italic min-h-[64px]",
        className
      )}
      {...props}
    />
  );
});

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...props }, ref) => {
  return (
    <div className="relative group">
      <select
        ref={ref}
        className={clsx(
          "w-full px-8 py-6 bg-white/[0.05] border border-white/20 text-white text-lg focus:outline-none focus:border-accent transition-all backdrop-blur-3xl rounded-none font-light italic appearance-none cursor-pointer min-h-[64px]",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-white/60 group-hover:text-accent transition-colors">
        <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
    </div>
  );
});

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  // Fix: Explicitly include key for TypeScript support in lists
  key?: React.Key;
}

export const Card = ({ children, className, onClick, ...props }: CardProps) => {
  return (
    <div 
      {...props}
      onClick={onClick} 
      className={clsx(
        "glass-ui p-8 md:p-14 relative overflow-hidden group transition-all duration-700 rounded-none border border-white/20", 
        className, 
        onClick && "cursor-pointer hover:border-accent/40"
      )}
    >
      {children}
    </div>
  );
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children?: React.ReactNode;
  color?: "neutral" | "success" | "blue" | "accent";
  className?: string;
  // Fix: Explicitly include key for TypeScript support in lists
  key?: React.Key;
}

export const Badge = ({ children, color = "neutral", className, ...props }: BadgeProps) => {
  const colors = {
    neutral: "bg-white/10 text-white border-white/30",
    success: "bg-green-500/20 text-green-400 border-green-500/40",
    blue: "bg-blue-500/20 text-blue-400 border-blue-500/40",
    accent: "bg-accent/15 text-accent border-accent/50"
  };
  return (
    <span 
      {...props}
      className={clsx("inline-flex items-center px-5 py-2.5 border text-[11px] font-black uppercase tracking-[0.4em] italic", colors[color], className)}
    >
      {children}
    </span>
  );
};

export const ProgressBar = ({ progress, className }: { progress: number, className?: string }) => {
  return (
    <div className={clsx("w-full bg-white/10 overflow-hidden h-[4px] rounded-none", className)}>
      <div 
        className="h-full bg-accent transition-all duration-[2000ms] ease-in-out shadow-[0_0_15px_rgba(250,204,21,0.6)]" 
        style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
      />
    </div>
  );
};
