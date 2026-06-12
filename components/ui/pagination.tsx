import { cn } from '@/lib/cn';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

type Props = {
  page: number;
  pageSize: number;
  total: number;
  buildHref: (page: number) => string;
};

function buildPageList(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const left = Math.max(2, current - 2);
  const right = Math.min(total - 1, current + 2);
  const pages: (number | '...')[] = [1];
  if (left > 2) pages.push('...');
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < total - 1) pages.push('...');
  pages.push(total);
  return pages;
}

const base =
  'flex h-8 min-w-[2rem] items-center justify-center rounded-md border px-2 text-sm transition-colors';
const active =
  'border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]';
const inactive =
  'border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-fg)] hover:bg-[var(--color-bg-subtle)]';
const disabled =
  'pointer-events-none border-[var(--color-border)] bg-[var(--color-bg-subtle)] text-[var(--color-fg-subtle)]';

export function Pagination({ page, pageSize, total, buildHref }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;
  const pages = buildPageList(page, totalPages);

  return (
    <nav className="flex items-center justify-center gap-1 py-4" aria-label="Paginación">
      {page > 1 ? (
        <Link href={buildHref(page - 1)} className={cn(base, inactive)}>
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
        </Link>
      ) : (
        <span className={cn(base, disabled)}>
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
        </span>
      )}

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`e${i}`} className="px-1 text-[var(--color-fg-muted)] text-sm">
            …
          </span>
        ) : (
          <Link key={p} href={buildHref(p)} className={cn(base, p === page ? active : inactive)}>
            {p}
          </Link>
        ),
      )}

      {page < totalPages ? (
        <Link href={buildHref(page + 1)} className={cn(base, inactive)}>
          <ChevronRight className="h-4 w-4" strokeWidth={2} />
        </Link>
      ) : (
        <span className={cn(base, disabled)}>
          <ChevronRight className="h-4 w-4" strokeWidth={2} />
        </span>
      )}
    </nav>
  );
}
