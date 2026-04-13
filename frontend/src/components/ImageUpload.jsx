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

const styles = {
  default: {
    btn: "border-2 border-dashed border-gray-200 bg-white rounded-2xl p-10 text-center hover:border-brand-orange hover:bg-brand-orange-light transition cursor-pointer disabled:opacity-50 shadow-sm",
    iconWrap: "bg-brand-orange-light group-hover:bg-brand-orange/10",
    title: "font-medium text-gray-700",
    hint: "text-xs text-gray-400 mt-1",
  },
  hero: {
    btn: "border border-white/20 bg-gray-950/65 backdrop-blur-md rounded-2xl p-8 sm:p-10 text-center hover:border-brand-orange/60 hover:bg-gray-900/75 transition cursor-pointer disabled:opacity-50 shadow-xl shadow-black/30",
    iconWrap: "bg-brand-orange/20 group-hover:bg-brand-orange/30",
    title: "font-medium text-white",
    hint: "text-xs text-gray-400 mt-1",
  },
};

export default function ImageUpload({ onImageSelect, isLoading, variant = "default" }) {
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

  const s = styles[variant] ?? styles.default;

  return (
    <div className="flex flex-col items-center w-full">
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
        className={`group w-full max-w-md ${s.btn}`}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className={`w-14 h-14 rounded-full flex items-center justify-center transition ${s.iconWrap}`}
          >
            <Upload className="w-7 h-7 text-brand-orange" />
          </div>
          <div>
            <p className={s.title}>Drop a photo here or click to upload</p>
            <p className={s.hint}>JPG, PNG, or WebP</p>
          </div>
        </div>
      </button>
    </div>
  );
}
