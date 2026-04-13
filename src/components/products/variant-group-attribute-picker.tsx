"use client";

import { Checkbox } from "@/components/ui/checkbox";
import type { AttributeForProductForm } from "@/types";

export type VariantGroupAttributePickerProps = {
  attributes: AttributeForProductForm[];
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
};

export function VariantGroupAttributePicker({
  attributes,
  value,
  onChange,
  disabled,
}: VariantGroupAttributePickerProps) {
  const toggle = (id: string) => {
    if (disabled) return;
    if (value.includes(id)) {
      onChange(value.filter((x) => x !== id));
    } else {
      onChange([...value, id]);
    }
  };

  if (attributes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Add attributes with at least one option to build variants.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {attributes.map((attr) => {
        const checked = value.includes(attr.id);
        return (
          <li key={attr.id}>
            <label className="flex cursor-pointer items-start gap-3 text-sm">
              <Checkbox
                checked={checked}
                onCheckedChange={() => toggle(attr.id)}
                disabled={disabled}
                className="mt-0.5"
              />
              <span>
                <span className="font-medium">{attr.attribute_name}</span>
                <span className="block text-xs text-muted-foreground">
                  {attr.attribute_options.length} option
                  {attr.attribute_options.length === 1 ? "" : "s"}
                </span>
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
