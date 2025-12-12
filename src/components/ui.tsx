import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

// --- Typography ---
export const Heading = ({ children, level = 1, className }: { children?: React.ReactNode, level?: 1 | 2 | 3 | 4, className?: string }) => {
  const styles = {
    1: "text-4xl md:text-5xl font-serif text-neutral-900 leading-[1.1] tracking-tight",
    2: "text-3xl md:text-4xl font-serif text-neutral-900 leading-[1.2]",
    3: "text-2xl font-serif text-neutral-900",
    4: "text-lg font-serif text-neutral-900"
  };
  const Tag = `h${level}` as React.ElementType;
  return <Tag className={clsx(styles[level], className)}>{children}</Tag>;
};

export const Text = ({ children, className, variant = "body", uppercase = false }: { children?: React.ReactNode, className?: string, variant?: "body" | "subtle" | "small" | "caption", uppercase?: boolean }) => {
  const styles = {
    body: "text-base text-neutral-800 font-normal leading-relaxed",
    subtle: "text-neutral-500 font-normal",
    small: "text-sm text-neutral-500",
    caption: "text-xs font-medium tracking-widest text-neutral-400"
  };
  return <p className={clsx(styles[variant], uppercase && "uppercase", className)}>{children}</p>;
};

// --- Interactive ---
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  isLoading?: boolean;
  className?: string;
  disabled?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
}

export const Button = ({ children, variant = 'primary', className, isLoading, disabled, ...props }: ButtonProps) => {
  const variants = {
    primary: "bg-[#121212] text-white hover:bg-neutral-800 border border-transparent",
    secondary: "bg-[#F3F3F1] text-neutral-900 hover:bg-[#E5E5E0]",
    outline: "bg-transparent border border-neutral-300 text-neutral-900 hover:border-neutral-900",
    ghost: "bg-transparent text-neutral-600 hover:text-neutral-900",
    danger: "bg-red-50 text-red-700 hover:bg-red-100"
  };

  return (
    <button 
      className={clsx(
        "inline-flex items-center justify-center px-6 py-3 rounded-none text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        className
      )}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
};

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={clsx(
        "w-full px-0 py-3 bg-transparent border-b border-neutral-300 text-neutral-900 text-base focus:outline-none focus:border-neutral-900 transition-colors placeholder:text-neutral-400",
        className
      )}
      {...props}
    />
  );
});

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  className?: string;
  children?: React.ReactNode;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => {
  return (
    <div className="relative">
      <select
        ref={ref}
        className={clsx(
          "w-full px-0 py-3 bg-transparent border-b border-neutral-300 text-neutral-900 text-base focus:outline-none focus:border-neutral-900 transition-colors appearance-none rounded-none pr-8",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
      </div>
    </div>
  );
});

// --- Containers ---
export const Card = ({ children, className, onClick }: { children?: React.ReactNode, className?: string, onClick?: () => void }) => {
  return (
    <div 
      onClick={onClick} 
      className={clsx(
        "bg-white p-6 md:p-8 border border-neutral-200/50 shadow-sm", // Clean, minimal box
        className, 
        onClick && "cursor-pointer hover:border-neutral-300 transition-colors"
      )}
    >
      {children}
    </div>
  );
};

export const Badge = ({ children, color = "neutral" }: { children?: React.ReactNode, color?: "neutral" | "success" | "blue" | "accent" }) => {
  const colors = {
    neutral: "bg-neutral-100 text-neutral-600",
    success: "bg-[#E6F4EA] text-[#1E8E3E]",
    blue: "bg-[#E8F0FE] text-[#1967D2]",
    accent: "bg-[#FCE8E6] text-[#C73E1D]"
  };
  return (
    <span className={clsx("inline-flex items-center px-2 py-1 text-xs font-medium uppercase tracking-wider", colors[color])}>
      {children}
    </span>
  );
};

export const ProgressBar = ({ progress, className, slim = false }: { progress: number, className?: string, slim?: boolean }) => {
  return (
    <div className={clsx("w-full bg-neutral-100 overflow-hidden", slim ? "h-1" : "h-2", className)}>
      <div 
        className="h-full bg-[#121212] transition-all duration-700 ease-out" 
        style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
      />
    </div>
  );
};

