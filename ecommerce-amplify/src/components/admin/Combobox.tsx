import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Plus, X } from 'lucide-react';

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  value: string | null;
  onChange: (value: string | null) => void;
  options: ComboboxOption[];
  placeholder?: string;
  disabled?: boolean;
  disabledMessage?: string;
  /** When provided, an "+ Add" row is shown if the typed query doesn't match any option. */
  onAddNew?: (typedText: string) => void | Promise<void>;
  addNewLabelPrefix?: string;
  noResultsLabel?: string;
  className?: string;
}

export function Combobox({
  value,
  onChange,
  options,
  placeholder = 'בחר...',
  disabled = false,
  disabledMessage,
  onAddNew,
  addNewLabelPrefix = '+ הוסף',
  noResultsLabel = 'לא נמצאו תוצאות',
  className = '',
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const [adding, setAdding] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value],
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const trimmedQuery = query.trim();
  const showAddNew =
    !!onAddNew &&
    trimmedQuery.length > 0 &&
    !options.some((o) => o.label.toLowerCase() === trimmedQuery.toLowerCase());

  useEffect(() => {
    if (open) {
      setHighlighted(0);
    } else {
      setQuery('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const totalItems = filtered.length + (showAddNew ? 1 : 0);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!open) setOpen(true);
      setHighlighted((h) => Math.min(h + 1, Math.max(totalItems - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlighted < filtered.length) {
        const opt = filtered[highlighted];
        if (opt) {
          onChange(opt.value);
          setOpen(false);
        }
      } else if (showAddNew) {
        void handleAddNew();
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const handleAddNew = async () => {
    if (!onAddNew || !trimmedQuery) return;
    setAdding(true);
    try {
      await onAddNew(trimmedQuery);
      setOpen(false);
    } finally {
      setAdding(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setQuery('');
    inputRef.current?.focus();
  };

  const displayText = open ? query : selectedOption?.label ?? '';

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      <div
        className={`flex items-center gap-1 input cursor-text ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : ''
        }`}
        onClick={() => {
          if (!disabled) {
            setOpen(true);
            inputRef.current?.focus();
          }
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={displayText}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => !disabled && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? disabledMessage ?? placeholder : placeholder}
          disabled={disabled}
          className="flex-1 bg-transparent border-0 outline-none p-0 text-inherit disabled:cursor-not-allowed"
        />
        {selectedOption && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="text-gray-400 hover:text-gray-600 p-0.5"
            title="נקה"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </div>

      {open && !disabled && (
        <ul className="absolute z-20 left-0 right-0 mt-1 max-h-64 overflow-auto bg-white rounded-lg shadow-lg border border-gray-200 py-1 text-sm">
          {filtered.length === 0 && !showAddNew && (
            <li className="px-3 py-2 text-gray-500">{noResultsLabel}</li>
          )}
          {filtered.map((opt, idx) => {
            const isHighlighted = idx === highlighted;
            const isSelected = opt.value === value;
            return (
              <li
                key={opt.value}
                onMouseEnter={() => setHighlighted(idx)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`px-3 py-2 cursor-pointer ${
                  isHighlighted ? 'bg-brand-50' : ''
                } ${isSelected ? 'font-semibold text-brand-900' : 'text-gray-800'}`}
              >
                {opt.label}
              </li>
            );
          })}
          {showAddNew && (
            <li
              onMouseEnter={() => setHighlighted(filtered.length)}
              onMouseDown={(e) => {
                e.preventDefault();
                void handleAddNew();
              }}
              className={`px-3 py-2 cursor-pointer border-t border-gray-100 flex items-center gap-2 text-accent-700 ${
                highlighted === filtered.length ? 'bg-accent-50' : ''
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              {adding ? 'מוסיף...' : `${addNewLabelPrefix} "${trimmedQuery}" לרשימה`}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
