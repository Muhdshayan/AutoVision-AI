import React, { useRef, useCallback } from "react";
import { Upload } from "lucide-react";

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== "string") {
        reject(new Error("read_failed"));
        return;
      }
      const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!match) {
        reject(new Error("read_failed"));
        return;
      }
      resolve({ mimeType: match[1], base64: match[2] });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

const ACCEPT = "image/jpeg,image/png,image/webp";

export default function ImageUpload({ onImageSelect, isLoading }) {
  const inputRef = useRef(null);

  const processFile = useCallback(
    async (file) => {
      if (!file || !file.type.startsWith("image/")) return;
      const allowed = ["image/jpeg", "image/png", "image/webp"];
      if (!allowed.includes(file.type)) return;

      const { base64, mimeType } = await readFileAsBase64(file);
      const previewUrl = URL.createObjectURL(file);
      onImageSelect({
        base64,
        mimeType,
        previewUrl,
        fileName: file.name,
      });
    },
    [onImageSelect],
  );

  const onChange = (e) => {
    const file = e.target.files?.[0];
    if (file) void processFile(file);
    e.target.value = "";
  };

  const onDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) void processFile(file);
  };

  return (
    <div className="flex flex-col items-center">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={onChange}
        disabled={isLoading}
      />
      <button
        type="button"
        disabled={isLoading}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
        className="group w-full max-w-md border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center hover:border-blue-400 hover:bg-blue-50/50 transition cursor-pointer disabled:opacity-50"
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition">
            <Upload className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-gray-700">Drop a photo here or click to upload</p>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG, or WebP</p>
          </div>
        </div>
      </button>
    </div>
  );
}
