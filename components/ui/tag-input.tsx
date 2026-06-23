'use client';

import { cn } from '@/lib/cn';
import { X } from 'lucide-react';
import { type KeyboardEvent, useState } from 'react';

type Props = {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export function TagInput({
  value,
  onChange,
  placeholder = 'Agregar y presionar Enter…',
  disabled = false,
  className,
}: Props) {
  const [input, setInput] = useState('');

  function addTag() {
    const tag = input.trim();
    if (!tag || value.includes(tag)) return;
    onChange([...value, tag]);
    setInput('');
  }

  function removeTag(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
    if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value.length - 1);
    }
  }

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-2 py-1.5 focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary-soft)]',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      {value.map((tag, i) => (
        <span
          key={`${tag}-${i}`}
          className="inline-flex items-center gap-1 rounded bg-[var(--color-primary-soft)] px-2 py-0.5 text-xs text-[var(--color-primary)]"
        >
          {tag}
          {!disabled && (
            <button
              type="button"
              onClick={() => removeTag(i)}
              className="shrink-0 rounded-sm hover:text-[var(--color-danger)]"
            >
              <X className="h-3 w-3" strokeWidth={2} />
            </button>
          )}
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addTag}
        placeholder={value.length === 0 ? placeholder : ''}
        disabled={disabled}
        className="min-w-[80px] flex-1 bg-transparent text-sm text-[var(--color-fg)] outline-none placeholder:text-[var(--color-fg-subtle)]"
      />
    </div>
  );
}
