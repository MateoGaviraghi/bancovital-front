'use client';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';
import { Search } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

type Props = {
  placeholder?: string;
  paramKey?: string;
  className?: string;
};

export function SearchInput({ placeholder = 'Buscar…', paramKey = 'q', className }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [value, setValue] = useState(() => sp.get(paramKey) ?? '');
  const isInitial = useRef(true);

  useEffect(() => {
    if (isInitial.current) {
      isInitial.current = false;
      return;
    }
    const t = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if (value) params.set(paramKey, value);
      else params.delete(paramKey);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    }, 300);
    return () => clearTimeout(t);
  }, [value, paramKey, pathname, router]);

  return (
    <div className={cn('relative w-full max-w-sm', className)}>
      <Search
        className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-[var(--color-fg-subtle)]"
        strokeWidth={2}
      />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  );
}
