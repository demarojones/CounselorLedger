import * as React from 'react';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface FormSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options?: Array<{ value: string; label: string }>;
}

const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, error, helperText, options, className, id, children, ...props }, ref) => {
    const selectId = id || `select-${label?.toLowerCase().replace(/\s+/g, '-')}`;

    return (
      <div className="space-y-2">
        {label && <Label htmlFor={selectId}>{label}</Label>}
        <Select
          id={selectId}
          ref={ref}
          className={cn(error && 'border-destructive', className)}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined
          }
          {...props}
        >
          {options ? (
            <>
              <option value="">Select an option</option>
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </>
          ) : (
            children
          )}
        </Select>
        {error && (
          <p
            id={`${selectId}-error`}
            className="text-sm font-medium text-destructive"
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p
            id={`${selectId}-helper`}
            className="text-sm text-muted-foreground"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);
FormSelect.displayName = 'FormSelect';

export { FormSelect };
