"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, X, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { buildTransformationUrl } from "@/config/imagekit";
import Image from "next/image";

interface DragDropImageProps {
  onImageSelect?: (fileUrl: string) => void;
  onImageRemove?: () => void;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  className?: string;
  transformations?: string[];
}

export function DragDropImage({
  onImageSelect,
  onImageRemove,
  maxSize = 10,
  acceptedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"],
  className,
  transformations = [],
}: DragDropImageProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const validateFile = (file: File) => {
    if (!acceptedTypes.includes(file.type)) return "Invalid file type";
    if (file.size > maxSize * 1024 * 1024) return `File size exceeds ${maxSize}MB`;
    return null;
  };

  const handleOpenFile = () => fileRef.current?.click();

  const uploadToImageKit = async (file: File) => {
    try {
      // Get signed auth params from your API route
      const res = await fetch("/api/imagekit-auth");
      const auth = await res.json();

      if (!auth?.token || !auth?.signature) throw new Error("Auth fetch failed");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", file.name);
      formData.append("publicKey", auth.publicKey);
      formData.append("signature", auth.signature);
      formData.append("expire", auth.expire);
      formData.append("token", auth.token);

      const uploadRes = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
        method: "POST",
        body: formData,
      });

      const data = await uploadRes.json();
      if (!data.url) throw new Error("Upload failed");

      const transformedUrl = buildTransformationUrl(data.url, transformations);
      setUploadedImageUrl(transformedUrl);
      onImageSelect?.(transformedUrl);
    } catch (err) {
      console.error(err);
      setError("Upload failed. Try again.");
    }
  };

  const handleFile = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setError(null);
      uploadToImageKit(file);
    },
    [uploadToImageKit, validateFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleRemove = useCallback(() => {
    setUploadedImageUrl(null);
    setError(null);
    onImageRemove?.();
  }, [onImageRemove]);

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg transition-colors duration-200 h-[20rem] w-full",
          isDragOver ? "border-zinc-400 bg-primary/5" : "border-zinc-400 hover:border-primary/50",
          uploadedImageUrl ? "p-4" : "p-8"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {uploadedImageUrl ? (
          <div className="relative">
            <Image
            width={500}
            height={500}
            quality={100}
              src={uploadedImageUrl}
              alt="Uploaded"
              className="w-full h-48 object-cover rounded-md"
            />
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-muted-foreground mb-4">
              {isDragOver ? <ImageIcon className="h-full w-full" /> : <Upload className="h-full w-full" />}
            </div>
            <div className="space-y-2">
              <p className="text-[1.4rem] font-medium">{isDragOver ? "Drop your image here" : "Upload or drag your image here"}</p>
              <p className="text-xs text-muted-foreground">or click to browse files</p>
              <p className="text-xs text-muted-foreground">Supports JPEG, PNG, WEBP, GIF up to {maxSize}MB</p>
            </div>
          </div>
        )}

        <input
          type="file"
          accept={acceptedTypes.join(",")}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          ref={fileRef}
        />

        <div className="flex items-center justify-center gap-[1.5rem] mt-[2rem]">
          <Button variant="outline" onClick={handleOpenFile}>Choose File</Button>
        </div>
      </div>

      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
