import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface DateTimePickerProps {
  label?: string;
  error?: string;
  helperText?: string;
  value?: string;
  onChange?: (value: string) => void;
  type?: 'datetime-local' | 'date' | 'time';
  className?: string;
  id?: string;
  disabled?: boolean;
  required?: boolean;
  min?: string;
  max?: string;
}

const DateTimePicker = React.forwardRef<HTMLInputElement, DateTimePickerProps>(
  (
    {
      label,
      error,
      helperText,
      value,
      onChange,
      type = 'datetime-local',
      className,
      id,
      ...props
    },
    ref
  ) => {
    const pickerId =
      id || `datetime-${label?.toLowerCase().replace(/\s+/g, '-')}`;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.value);
    };

    return (
      <div className="space-y-2">
        {label && <Label htmlFor={pickerId}>{label}</Label>}
        <Input
          id={pickerId}
          ref={ref}
          type={type}
          value={value}
          onChange={handleChange}
          className={cn(error && 'border-destructive', className)}
          aria-invalid={!!error}
          aria-describedby={
            error
              ? `${pickerId}-error`
              : helperText
                ? `${pickerId}-helper`
                : undefined
          }
          {...props}
        />
        {error && (
          <p
            id={`${pickerId}-error`}
            className="text-sm font-medium text-destructive"
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p
            id={`${pickerId}-helper`}
            className="text-sm text-muted-foreground"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
DateTimePicker.displayName = 'DateTimePicker';

export { DateTimePicker };
