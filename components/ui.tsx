
import React from 'react';
import { clsx } from 'clsx';
import { Loader2, ShieldAlert, RotateCcw } from 'lucide-react';

export const Heading = ({ children, level = 1, className }: { children?: React.ReactNode, level?: 1 | 2 | 3 | 4, className?: string }) => {
  const styles = {
    1: "heading-huge text-white mb-8",
    2: "font-serif italic text-4xl md:text-6xl text-white tracking-tighter mb-6 leading-none",
    3: "font-serif italic text-xl md:text-2xl text-white tracking-tight leading-relaxed",
    4: "font-sans font-black uppercase tracking-[0.5em] text-[12px] text-accent"
  };
  const Tag = `h${level}` as React.ElementType;
  return <Tag className={clsx(styles[level], className)}>{children}</Tag>;
};

export const Text = ({ children, className, variant = "body", uppercase = false }: { children?: React.ReactNode, className?: string, variant?: "body" | "subtle" | "small" | "caption", uppercase?: boolean }) => {
  const styles = {
    body: "text-base md:text-xl text-white font-light leading-relaxed", 
    subtle: "text-white/70 font-light leading-relaxed", 
    small: "text-[16px] text-white/60 leading-snug", 
    caption: "text-[13px] font-black tracking-[0.5em] text-accent uppercase"
  };
  return <p className={clsx(styles[variant], uppercase && "uppercase", className)}>{children}</p>;
};

export type ButtonProps = React.ComponentPropsWithoutRef<'button'> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'glass';
  isLoading?: boolean;
};

export const Button = ({ 
  children, 
  variant = 'primary', 
  className, 
  isLoading, 
  disabled, 
  type = 'button', // Default changed to 'button' to prevent form submission refreshes
  ...props 
}: ButtonProps) => {
  const variants = {
    primary: "bg-white text-black hover:bg-accent focus-visible:ring-accent",
    secondary: "bg-white/10 text-white hover:bg-white hover:text-black border border-white/10 focus-visible:ring-white",
    outline: "bg-transparent border border-white/20 text-white hover:border-accent hover:text-accent focus-visible:ring-accent",
    ghost: "bg-transparent text-white/40 hover:text-white focus-visible:underline focus-visible:text-white",
    danger: "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white focus-visible:ring-red-500",
    glass: "glass-ui text-white hover:bg-white/10 focus-visible:ring-white"
  };

  return (
    <button 
      type={type}
      className={clsx(
        "inline-flex items-center justify-center px-8 py-4 text-[13px] font-black uppercase tracking-[0.5em] transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed rounded-none border focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
        variant === 'primary' ? 'border-transparent' : '',
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
        "w-full px-8 py-5 bg-black/40 border border-white/10 text-white text-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-white/20 backdrop-blur-md rounded-none font-light",
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
          "w-full px-8 py-5 bg-black/40 border border-white/10 text-white text-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all backdrop-blur-md rounded-none font-light appearance-none cursor-pointer group-hover:border-white/30",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-white/20 group-hover:text-white transition-colors">
        <svg width="12" height="8" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
        "glass-ui p-12 relative overflow-hidden group transition-all duration-500 rounded-none", 
        className, 
        onClick && "cursor-pointer hover:border-accent/30 focus-within:border-accent/30"
      )}
    >
      {children}
    </div>
  );
};

export const Badge = ({ children, color = "neutral", className }: { children?: React.ReactNode, color?: "neutral" | "success" | "blue" | "accent", className?: string }) => {
  const colors = {
    neutral: "bg-white/5 text-white/60 border-white/10",
    success: "bg-green-500/10 text-green-400 border-green-500/20",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    accent: "bg-accent/10 text-accent border-accent/20"
  };
  return (
    <span className={clsx("inline-flex items-center px-6 py-2 border text-[10px] font-black uppercase tracking-[0.4em] rounded-none", colors[color], className)}>
      {children}
    </span>
  );
};

export const ProgressBar = ({ progress, className }: { progress: number, className?: string }) => {
  return (
    <div className={clsx("w-full bg-white/5 overflow-hidden h-1.5 rounded-none", className)}>
      <div 
        className="h-full bg-accent transition-all duration-[2000ms] ease-out accent-glow" 
        style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
      />
    </div>
  );
};

export const ErrorScreen = ({ error, reset }: { error?: Error, reset: () => void }) => {
  return (
    <div className="fixed inset-0 z-[2000] bg-black flex items-center justify-center p-6 md:p-12 overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://i.pinimg.com/1200x/f8/ae/1d/f8ae1d1629a7c473761391eb308986dd.jpg')] bg-cover bg-center grayscale opacity-10 blur-xl"></div>
      <div className="max-w-3xl w-full relative z-10 glass-ui p-12 md:p-24 border-red-500/30 accent-glow space-y-12 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-red-500/20 border border-red-500/40 rounded-full flex items-center justify-center mx-auto mb-10 animate-pulse">
           <ShieldAlert className="text-red-500" size={48} strokeWidth={1} />
        </div>
        <div className="space-y-6">
           <Badge color="neutral" className="border-red-500/40 text-red-500 bg-red-500/5 italic">System Failure</Badge>
           <h1 className="heading-huge text-white leading-none">SIGNAL <br/><span className="text-red-500">LOST.</span></h1>
           <p className="text-xl md:text-2xl font-serif italic text-white/40 leading-relaxed max-w-xl mx-auto">
             Personnel Calibration Error. The system encountered a structural mismatch in the professional record.
           </p>
        </div>
        
        {error && (
          <div className="p-6 bg-red-500/5 border border-red-500/10 font-mono text-[10px] text-red-500/50 uppercase tracking-widest text-left max-h-32 overflow-y-auto">
             {error.message}
          </div>
        )}

        <div className="pt-12">
           <Button variant="danger" onClick={reset} className="h-20 px-12 group">
              <RotateCcw className="mr-4 group-hover:rotate-180 transition-transform duration-500" size={18} />
              Recalibrate System
           </Button>
        </div>
      </div>
    </div>
  );
};
