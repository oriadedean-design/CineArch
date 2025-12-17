
import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

export const Heading = ({ children, level = 1, className }: { children?: React.ReactNode, level?: 1 | 2 | 3 | 4, className?: string }) => {
  const styles = {
    1: "heading-huge text-white mb-6",
    2: "font-serif italic text-3xl md:text-5xl text-white tracking-tighter mb-4 leading-none",
    3: "font-serif italic text-lg md:text-xl text-white tracking-tight leading-relaxed",
    4: "font-sans font-black uppercase tracking-[0.4em] text-[8px] text-accent"
  };
  const Tag = `h${level}` as React.ElementType;
  return <Tag className={clsx(styles[level], className)}>{children}</Tag>;
};

export const Text = ({ children, className, variant = "body", uppercase = false }: { children?: React.ReactNode, className?: string, variant?: "body" | "subtle" | "small" | "caption", uppercase?: boolean }) => {
  const styles = {
    body: "text-sm md:text-base text-white/90 font-light leading-relaxed", 
    subtle: "text-white/70 font-light leading-relaxed", 
    small: "text-[12px] text-white/60 leading-snug", 
    caption: "text-[9px] font-black tracking-[0.4em] text-accent uppercase"
  };
  return <p className={clsx(styles[variant], uppercase && "uppercase", className)}>{children}</p>;
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'glass';
  isLoading?: boolean;
}

export const Button = ({ children, variant = 'primary', className, isLoading, disabled, ...props }: ButtonProps) => {
  const variants = {
    primary: "bg-white text-black hover:bg-accent transition-colors",
    secondary: "bg-white/10 text-white hover:bg-white hover:text-black border border-white/10",
    outline: "bg-transparent border border-white/20 text-white hover:border-accent hover:text-accent",
    ghost: "bg-transparent text-white/60 hover:text-white",
    danger: "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white",
    glass: "glass-ui text-white hover:bg-white/10"
  };

  return (
    <button 
      className={clsx(
        "inline-flex items-center justify-center px-8 py-4 text-[9px] font-black uppercase tracking-[0.4em] transition-all duration-300 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed rounded-none",
        variants[variant],
        className
      )}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && <Loader2 className="w-3 h-3 mr-3 animate-spin" />}
      {children}
    </button>
  );
};

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={clsx(
        "w-full px-6 py-4 bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-accent transition-all placeholder:text-white/30 backdrop-blur-md rounded-none font-light",
        className
      )}
      {...props}
    />
  );
});

export const PhoneInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ onChange, ...props }, ref) => {
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const formatted = rawValue ? `+1${rawValue}` : '';
    const event = { ...e, target: { ...e.target, value: formatted } };
    onChange?.(event as any);
  };

  return <Input ref={ref} type="tel" placeholder="(555) 123-4567" onChange={handlePhoneChange} {...props} />;
});

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...props }, ref) => {
  return (
    <div className="relative group">
      <select
        ref={ref}
        className={clsx(
          "w-full px-6 py-4 bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-accent transition-all backdrop-blur-md rounded-none font-light appearance-none cursor-pointer",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-white/40 group-hover:text-white transition-colors">
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
});

export const Card = ({ children, className, onClick }: { children?: React.ReactNode, className?: string, onClick?: () => void }) => {
  return (
    <div 
      onClick={onClick} 
      className={clsx(
        "glass-ui p-10 relative overflow-hidden group transition-all duration-500", 
        className, 
        onClick && "cursor-pointer hover:border-accent/30"
      )}
    >
      {children}
    </div>
  );
};

export const Badge = ({ children, color = "neutral", className }: { children?: React.ReactNode, color?: "neutral" | "success" | "blue" | "accent", className?: string }) => {
  const colors = {
    neutral: "bg-white/5 text-white/80 border-white/10",
    success: "bg-green-500/10 text-green-400 border-green-500/20",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    accent: "bg-accent/10 text-accent border-accent/20"
  };
  return (
    <span className={clsx("inline-flex items-center px-4 py-1 border text-[8px] font-black uppercase tracking-[0.3em]", colors[color], className)}>
      {children}
    </span>
  );
};

export const ProgressBar = ({ progress, className }: { progress: number, className?: string }) => {
  return (
    <div className={clsx("w-full bg-white/5 overflow-hidden h-1", className)}>
      <div 
        className="h-full bg-accent transition-all duration-[1500ms] ease-out" 
        style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
      />
    </div>
  );
};
