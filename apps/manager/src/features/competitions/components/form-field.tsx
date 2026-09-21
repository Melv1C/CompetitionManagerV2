import { Input, Label } from "@repo/ui";

export function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

export function DateField({
  id,
  label,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <Field label={label} htmlFor={id}>
      <Input
        id={id}
        type="datetime-local"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    </Field>
  );
}
