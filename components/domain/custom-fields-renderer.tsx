'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { FormFieldConfig, FormSectionConfig, ServicioFormConfig } from '@/lib/api/types';
import { cn } from '@/lib/cn';

function FieldRenderer({
  field,
  value,
  error,
  onChange,
}: {
  field: FormFieldConfig;
  value: unknown;
  error?: string;
  onChange: (val: unknown) => void;
}) {
  const id = `custom-${field.key}`;

  switch (field.type) {
    case 'text':
    case 'email':
      return (
        <FormField label={field.label} htmlFor={id} required={field.required} error={error}>
          <Input
            id={id}
            type={field.type}
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
          />
        </FormField>
      );

    case 'number':
      return (
        <FormField label={field.label} htmlFor={id} required={field.required} error={error}>
          <Input
            id={id}
            type="number"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
          />
        </FormField>
      );

    case 'date':
      return (
        <FormField label={field.label} htmlFor={id} required={field.required} error={error}>
          <Input
            id={id}
            type="date"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
          />
        </FormField>
      );

    case 'datetime':
      return (
        <FormField label={field.label} htmlFor={id} required={field.required} error={error}>
          <Input
            id={id}
            type="datetime-local"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
          />
        </FormField>
      );

    case 'textarea':
      return (
        <FormField label={field.label} htmlFor={id} required={field.required} error={error}>
          <Textarea
            id={id}
            rows={2}
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
          />
        </FormField>
      );

    case 'select':
      return (
        <FormField label={field.label} htmlFor={id} required={field.required} error={error}>
          <Select value={(value as string) ?? ''} onValueChange={onChange}>
            <SelectTrigger id={id}>
              <SelectValue placeholder="Seleccionar…" />
            </SelectTrigger>
            <SelectContent>
              {(field.options ?? []).map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      );

    case 'checkbox':
      return (
        <div className="flex items-center gap-2 py-2">
          <Checkbox
            id={id}
            checked={(value as boolean) ?? false}
            onCheckedChange={(v) => onChange(v === true)}
          />
          <label htmlFor={id} className="cursor-pointer text-sm text-[var(--color-fg)]">
            {field.label}
            {field.required && <span className="text-[var(--color-danger)]"> *</span>}
          </label>
        </div>
      );

    default:
      return null;
  }
}

function SectionRenderer({
  section,
  values,
  errors,
  onChange,
}: {
  section: FormSectionConfig;
  values: Record<string, unknown>;
  errors: Record<string, string>;
  onChange: (key: string, val: unknown) => void;
}) {
  return (
    <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 shadow-[var(--shadow-xs)]">
      <h2 className="mb-4 font-semibold text-[var(--color-fg)] text-base">{section.title}</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {section.fields.map((field) => (
          <div key={field.key} className={cn(field.colSpan === 2 && 'md:col-span-2')}>
            <FieldRenderer
              field={field}
              value={values[field.key]}
              error={errors[field.key]}
              onChange={(val) => onChange(field.key, val)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export function CustomFieldsRenderer({
  formConfig,
  values,
  errors,
  onChange,
}: {
  formConfig: ServicioFormConfig;
  values: Record<string, unknown>;
  errors: Record<string, string>;
  onChange: (key: string, val: unknown) => void;
}) {
  return (
    <>
      {formConfig.sections.map((section) => (
        <SectionRenderer
          key={section.key}
          section={section}
          values={values}
          errors={errors}
          onChange={onChange}
        />
      ))}
    </>
  );
}

export function validateCustomFields(
  formConfig: ServicioFormConfig,
  values: Record<string, unknown>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const section of formConfig.sections) {
    for (const field of section.fields) {
      if (!field.required) continue;
      const val = values[field.key];
      if (field.type === 'checkbox') continue;
      if (val === undefined || val === null || val === '') {
        errors[field.key] = `${field.label} es requerido.`;
      }
    }
  }
  return errors;
}
