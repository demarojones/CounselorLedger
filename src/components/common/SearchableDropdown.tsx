import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export interface SearchableDropdownOption {
  value: string;
  label: string;
  subtitle?: string;
  metadata?: Record<string, any>;
}

export interface SearchableDropdownProps {
  label?: string;
  placeholder?: string;
  options: SearchableDropdownOption[];
  value?: string;
  onChange?: (value: string, option: SearchableDropdownOption | null) => void;
  onSearch?: (query: string) => void;
  error?: string;
  helperText?: string;
  loading?: boolean;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
  emptyMessage?: string;
  filterFn?: (option: SearchableDropdownOption, query: string) => boolean;
}

const SearchableDropdown = React.forwardRef<
  HTMLInputElement,
  SearchableDropdownProps
>(
  (
    {
      label,
      placeholder = 'Search...',
      options,
      value,
      onChange,
      onSearch,
      error,
      helperText,
      loading = false,
      disabled = false,
      required = false,
      className,
      id,
      emptyMessage = 'No results found',
      filterFn,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [highlightedIndex, setHighlightedIndex] = React.useState(0);
    const [displayValue, setDisplayValue] = React.useState('');
    const containerRef = React.useRef<HTMLDivElement>(null);
    const listRef = React.useRef<HTMLUListElement>(null);

    const dropdownId =
      id || `dropdown-${label?.toLowerCase().replace(/\s+/g, '-')}`;

    // Find selected option
    const selectedOption = React.useMemo(
      () => options.find((opt) => opt.value === value) || null,
      [options, value]
    );

    // Update display value when selected option changes
    React.useEffect(() => {
      if (selectedOption) {
        setDisplayValue(selectedOption.label);
      } else {
        setDisplayValue('');
      }
    }, [selectedOption]);

    // Default filter function
    const defaultFilterFn = (
      option: SearchableDropdownOption,
      query: string
    ) => {
      const lowerQuery = query.toLowerCase();
      return (
        option.label.toLowerCase().includes(lowerQuery) ||
        option.subtitle?.toLowerCase().includes(lowerQuery) ||
        false
      );
    };

    const filter = filterFn || defaultFilterFn;

    // Filter options based on search query
    const filteredOptions = React.useMemo(() => {
      if (!searchQuery) return options;
      return options.filter((option) => filter(option, searchQuery));
    }, [options, searchQuery, filter]);

    // Reset highlighted index when filtered options change
    React.useEffect(() => {
      setHighlightedIndex(0);
    }, [filteredOptions]);

    // Handle click outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
          // Restore display value if no selection
          if (!selectedOption) {
            setDisplayValue('');
            setSearchQuery('');
          } else {
            setDisplayValue(selectedOption.label);
            setSearchQuery('');
          }
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [selectedOption]);

    // Scroll highlighted item into view
    React.useEffect(() => {
      if (isOpen && listRef.current) {
        const highlightedElement = listRef.current.children[
          highlightedIndex
        ] as HTMLElement;
        if (highlightedElement) {
          highlightedElement.scrollIntoView({
            block: 'nearest',
            behavior: 'smooth',
          });
        }
      }
    }, [highlightedIndex, isOpen]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const query = e.target.value;
      setDisplayValue(query);
      setSearchQuery(query);
      setIsOpen(true);
      onSearch?.(query);
    };

    const handleInputFocus = () => {
      setIsOpen(true);
      setSearchQuery(displayValue);
    };

    const handleOptionSelect = (option: SearchableDropdownOption) => {
      setDisplayValue(option.label);
      setSearchQuery('');
      setIsOpen(false);
      onChange?.(option.value, option);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen) {
        if (e.key === 'ArrowDown' || e.key === 'Enter') {
          e.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredOptions[highlightedIndex]) {
            handleOptionSelect(filteredOptions[highlightedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          if (selectedOption) {
            setDisplayValue(selectedOption.label);
            setSearchQuery('');
          }
          break;
        case 'Tab':
          setIsOpen(false);
          if (selectedOption) {
            setDisplayValue(selectedOption.label);
            setSearchQuery('');
          }
          break;
      }
    };

    return (
      <div ref={containerRef} className={cn('relative', className)}>
        <div className="space-y-2">
          {label && (
            <Label htmlFor={dropdownId}>
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </Label>
          )}
          <Input
            id={dropdownId}
            ref={ref}
            type="text"
            value={displayValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || loading}
            className={cn(error && 'border-destructive')}
            aria-invalid={!!error}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-controls={`${dropdownId}-listbox`}
            aria-activedescendant={
              isOpen && filteredOptions[highlightedIndex]
                ? `${dropdownId}-option-${highlightedIndex}`
                : undefined
            }
            autoComplete="off"
          />
          {error && (
            <p className="text-sm font-medium text-destructive">{error}</p>
          )}
          {helperText && !error && (
            <p className="text-sm text-muted-foreground">{helperText}</p>
          )}
        </div>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-auto">
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading...
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </div>
            ) : (
              <ul
                ref={listRef}
                id={`${dropdownId}-listbox`}
                role="listbox"
                className="py-1"
              >
                {filteredOptions.map((option, index) => (
                  <li
                    key={option.value}
                    id={`${dropdownId}-option-${index}`}
                    role="option"
                    aria-selected={option.value === value}
                    className={cn(
                      'px-3 py-2 cursor-pointer transition-colors',
                      'hover:bg-accent hover:text-accent-foreground',
                      index === highlightedIndex &&
                        'bg-accent text-accent-foreground',
                      option.value === value && 'bg-primary/10'
                    )}
                    onClick={() => handleOptionSelect(option)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {option.label}
                      </span>
                      {option.subtitle && (
                        <span className="text-xs text-muted-foreground">
                          {option.subtitle}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    );
  }
);
SearchableDropdown.displayName = 'SearchableDropdown';

export { SearchableDropdown };
