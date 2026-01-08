
import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

export const Heading = ({ children, level = 1, className }: { children?: React.ReactNode, level?: 1 | 2 | 3 | 4, className?: string }) => {
  const styles = {
    1: "heading-huge text-white mb-6 md:mb-8",
    2: "font-serif italic text-4xl md:text-6xl text-white tracking-tighter mb-4 md:mb-6 leading-[0.8]",
    3: "font-serif italic text-2xl md:text-4xl text-white tracking-tight leading-none",
    4: "font-sans font-black uppercase tracking-[0.4em] text-[9px] md:text-[10px] text-accent italic"
  };
  const Tag = `h${level}` as React.ElementType;
  return <Tag className={clsx(styles[level], className)}>{children}</Tag>;
};

export const Text = ({ children, className, variant = "body", uppercase = false }: { children?: React.ReactNode, className?: string, variant?: "body" | "subtle" | "small" | "caption", uppercase?: boolean }) => {
  const styles = {
    body: "text-lg md:text-xl text-white/80 font-light leading-relaxed", 
    subtle: "text-white/60 font-light leading-relaxed", 
    small: "text-[14px] text-white/50 leading-snug", 
    caption: "text-[10px] md:text-[11px] font-black tracking-[0.4em] md:tracking-[0.6em] text-accent uppercase italic"
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
    primary: "bg-white text-black hover:bg-accent transition-all duration-300",
    secondary: "bg-white/5 text-white hover:bg-white hover:text-black border border-white/10",
    outline: "bg-transparent border border-white/10 text-white hover:border-accent hover:text-accent hover:bg-accent/5",
    ghost: "bg-transparent text-white/40 hover:text-white hover:bg-white/5",
    danger: "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white",
    glass: "glass-ui text-white hover:bg-white/10"
  };

  return (
    <button 
      className={clsx(
        "inline-flex items-center justify-center px-6 md:px-10 py-4 md:py-5 text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] md:tracking-[0.5em] transition-all duration-500 active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed rounded-none border border-transparent",
        variants[variant],
        className
      )}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && <Loader2 className="w-3 h-3 mr-3 md:mr-4 animate-spin" />}
      {children}
    </button>
  );
};

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={clsx(
        "w-full px-6 md:px-8 py-4 md:py-5 bg-black/40 border border-white/5 text-white text-base md:text-lg focus:outline-none focus:border-accent transition-all placeholder:text-white/10 backdrop-blur-3xl rounded-none font-light italic",
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
          "w-full px-6 md:px-8 py-4 md:py-5 bg-black/40 border border-white/5 text-white text-base md:text-lg focus:outline-none focus:border-accent transition-all backdrop-blur-3xl rounded-none font-light italic appearance-none cursor-pointer",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <div className="absolute right-6 md:right-8 top-1/2 -translate-y-1/2 pointer-events-none text-white/20 group-hover:text-accent transition-colors">
        <svg width="10" height="6" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
    </div>
  );
});

export const Card = ({ children, className, onClick }: { children?: React.ReactNode, className?: string, onClick?: () => void, key?: React.Key }) => {
  return (
    <div 
      onClick={onClick} 
      className={clsx(
        "glass-ui p-6 md:p-12 relative overflow-hidden group transition-all duration-700 rounded-none border-white/10", 
        className, 
        onClick && "cursor-pointer hover:border-accent/40"
      )}
    >
      {children}
    </div>
  );
};

export const Badge = ({ children, color = "neutral", className }: { children?: React.ReactNode, color?: "neutral" | "success" | "blue" | "accent", className?: string }) => {
  const colors = {
    neutral: "bg-white/5 text-white/60 border-white/5",
    success: "bg-green-500/10 text-green-400 border-green-500/10",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/10",
    accent: "bg-accent/10 text-accent border-accent/20"
  };
  return (
    <span className={clsx("inline-flex items-center px-4 md:px-5 py-1.5 md:py-2 border text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] italic", colors[color], className)}>
      {children}
    </span>
  );
};

export const ProgressBar = ({ progress, className }: { progress: number, className?: string }) => {
  return (
    <div className={clsx("w-full bg-white/5 overflow-hidden h-[1px] rounded-none", className)}>
      <div 
        className="h-full bg-accent transition-all duration-[2000ms] ease-in-out" 
        style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
      />
    </div>
  );
};
