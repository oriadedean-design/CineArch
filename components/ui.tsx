
import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

// --- Typography ---
export const Heading = ({ children, level = 1, className }: { children?: React.ReactNode, level?: 1 | 2 | 3 | 4, className?: string }) => {
  const styles = {
    1: "text-4xl md:text-6xl font-serif text-light leading-none tracking-tight drop-shadow-xl",
    2: "text-3xl md:text-4xl font-sans font-bold text-light tracking-tight",
    3: "text-xl md:text-2xl font-sans font-semibold text-light/90",
    4: "text-lg font-sans font-medium text-light/80"
  };
  const Tag = `h${level}` as React.ElementType;
  return <Tag className={clsx(styles[level], className)}>{children}</Tag>;
};

export const Text = ({ children, className, variant = "body", uppercase = false }: { children?: React.ReactNode, className?: string, variant?: "body" | "subtle" | "small" | "caption", uppercase?: boolean }) => {
  const styles = {
    body: "text-base text-textPrimary font-light leading-relaxed", 
    subtle: "text-textSecondary font-light", 
    small: "text-sm text-textTertiary", 
    caption: "text-xs font-bold tracking-[0.2em] text-accent"
  };
  return <p className={clsx(styles[variant], uppercase && "uppercase", className)}>{children}</p>;
};

// --- Interactive ---
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
    // Primary: Light Grey Text on Muted Blue (Accent) Background for pop, OR Light Background Dark Text?
    // Let's go with the Palette's "Light" for bg and "Dark" for text for high contrast primary.
    primary: "bg-light text-background hover:bg-white border border-transparent shadow-[0_0_15px_rgba(201,204,199,0.3)]",
    
    // Secondary: Muted Teal background
    secondary: "bg-secondary/20 text-secondary border border-secondary/30 hover:bg-secondary/30",
    
    outline: "bg-transparent border border-light/20 text-light hover:border-light hover:bg-light/5",
    ghost: "bg-transparent text-textTertiary hover:text-light",
    danger: "bg-tertiary/20 text-tertiary border border-tertiary/30 hover:bg-tertiary/30",
    glass: "glass text-light hover:bg-light/10"
  };

  return (
    <button 
      className={clsx(
        "inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
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
        "w-full px-4 py-3 bg-surfaceHighlight/50 border border-light/10 rounded-xl text-textPrimary text-base focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-textTertiary",
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
          "w-full px-4 py-3 bg-surfaceHighlight/50 border border-light/10 rounded-xl text-textPrimary text-base focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all appearance-none pr-10",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-textTertiary">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
      </div>
    </div>
  );
});

// --- Containers ---
export const Card = ({ children, className, onClick, style }: { children?: React.ReactNode, className?: string, onClick?: () => void, style?: React.CSSProperties }) => {
  return (
    <div 
      onClick={onClick} 
      style={style}
      className={clsx(
        "glass-card p-6 md:p-8 rounded-2xl relative overflow-hidden group transition-all duration-300 shadow-lg shadow-black/20", 
        className, 
        onClick && "cursor-pointer hover:border-light/30 hover:bg-light/5"
      )}
    >
      {children}
    </div>
  );
};

export const Badge = ({ children, color = "neutral" }: { children?: React.ReactNode, color?: "neutral" | "success" | "blue" | "accent" }) => {
  const colors = {
    neutral: "bg-light/10 text-textSecondary border-light/10",
    success: "bg-secondary/20 text-secondary border-secondary/30", // Using Muted Teal for success
    blue: "bg-accent/20 text-accent border-accent/30", // Using Muted Blue for general active state
    accent: "bg-accent/20 text-accent border-accent/30"
  };
  return (
    <span className={clsx("inline-flex items-center px-2 py-1 rounded-md border text-[10px] font-bold uppercase tracking-widest", colors[color])}>
      {children}
    </span>
  );
};

export const ProgressBar = ({ progress, className, slim = false }: { progress: number, className?: string, slim?: boolean }) => {
  return (
    <div className={clsx("w-full bg-surfaceHighlight overflow-hidden rounded-full", slim ? "h-1" : "h-1.5", className)}>
      <div 
        className="h-full bg-gradient-to-r from-accent to-secondary transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(124,150,166,0.5)]" 
        style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
      />
    </div>
  );
};
