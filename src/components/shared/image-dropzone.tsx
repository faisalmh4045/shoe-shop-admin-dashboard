"use client";

import { CldUploadWidget } from "next-cloudinary";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ImageIcon, X } from "lucide-react";

export type ImageDropzoneProps = {
  imageUrl: string;
  onUploaded: (url: string) => void;
  onClear: () => void;
  disabled?: boolean;
  errorId?: string;
  errorMessage?: string;
};

export function ImageDropzone({
  imageUrl,
  onUploaded,
  onClear,
  disabled,
  errorId,
  errorMessage,
}: ImageDropzoneProps) {
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const configured = Boolean(preset);

  return (
    <div className="space-y-2">
      <Label>Image</Label>
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
            const info = result?.info as { secure_url?: string } | undefined;
            const url = info?.secure_url;
            if (typeof url === "string") onUploaded(url);
          }}
        >
          {({ open }) => (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled || !configured}
              onClick={() => open()}
            >
              <ImageIcon className="size-4" />
              {imageUrl ? "Replace image" : "Upload image"}
            </Button>
          )}
        </CldUploadWidget>
        {imageUrl ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={onClear}
          >
            <X className="size-4" />
            Remove
          </Button>
        ) : null}
      </div>
      {imageUrl ? (
        <div
          className={cn(
            "relative mt-2 overflow-hidden rounded-lg border bg-muted/30",
            "max-w-xs",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- remote Cloudinary URL */}
          <img
            src={imageUrl}
            alt="Preview"
            className="aspect-video w-full object-cover"
          />
        </div>
      ) : null}
      {errorMessage ? (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
