import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface FormInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id || `input-${label?.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className="space-y-2">
        {label && <Label htmlFor={inputId}>{label}</Label>}
        <Input
          id={inputId}
          ref={ref}
          className={cn(error && 'border-destructive', className)}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-sm font-medium text-destructive"
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p
            id={`${inputId}-helper`}
            className="text-sm text-muted-foreground"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
FormInput.displayName = 'FormInput';

export { FormInput };
