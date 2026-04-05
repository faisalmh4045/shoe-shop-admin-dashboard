"use client";

import { useEffect, useRef } from "react";
import { CldUploadWidget } from "next-cloudinary";
import { ChevronDown, ChevronUp, ImageIcon, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const MAX_IMAGES = 8;

export type MultiImageDropzoneProps = {
  value: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
  errorId?: string;
  errorMessage?: string;
};

export function MultiImageDropzone({
  value,
  onChange,
  disabled,
  errorId,
  errorMessage,
}: MultiImageDropzoneProps) {
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const configured = Boolean(preset);
  const valueRef = useRef(value);
  useEffect(() => {
    valueRef.current = value;
  }, [value]);
  const atMax = value.length >= MAX_IMAGES;

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    const [item] = next.splice(from, 1);
    if (item === undefined) return;
    next.splice(to, 0, item);
    onChange(next);
  };

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-2">
      <Label>Product images</Label>
      <p className="text-sm text-muted-foreground">
        Up to {MAX_IMAGES} images. Reorder with the arrow buttons.
      </p>
      {!configured && (
        <p className="text-sm text-muted-foreground">
          Set{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
          </code>{" "}
          and{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
          </code>{" "}
          to enable uploads.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <CldUploadWidget
          uploadPreset={preset}
          options={{
            maxFiles: 1,
            sources: ["local"],
          }}
          onSuccess={(result) => {
            const current = valueRef.current;
            if (current.length >= MAX_IMAGES) return;
            const info = result?.info as { secure_url?: string } | undefined;
            const url = info?.secure_url;
            if (typeof url === "string") {
              const next = [...current, url];
              valueRef.current = next;
              onChange(next);
            }
          }}
        >
          {({ open }) => (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || !configured || atMax}
              onClick={() => open()}
            >
              <ImageIcon className="size-4" />
              Add image
            </Button>
          )}
        </CldUploadWidget>
      </div>
      {value.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-3">
          {value.map((url, index) => (
            <li
              key={`${url}-${index}`}
              className="flex flex-wrap items-start gap-3 rounded-lg border bg-muted/20 p-2"
            >
              <div
                className={cn(
                  "relative shrink-0 overflow-hidden rounded-md border bg-muted/30",
                  "size-20 sm:size-24",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary URL */}
                <img src={url} alt="" className="size-full object-cover" />
              </div>
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  disabled={disabled || index === 0}
                  onClick={() => move(index, index - 1)}
                  aria-label="Move image up"
                >
                  <ChevronUp className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  disabled={disabled || index === value.length - 1}
                  onClick={() => move(index, index + 1)}
                  aria-label="Move image down"
                >
                  <ChevronDown className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  onClick={() => removeAt(index)}
                >
                  <X className="size-4" />
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      {errorMessage ? (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
