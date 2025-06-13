"use client";
import { Card } from "@/components/ui/card";
import { File as FileIcon, X } from "lucide-react";
import React, { useId, useRef, useState } from "react";

interface FileSelectorProps {
  label: string;
  file: File | null;
  setFile: (file: File | null) => void;
  allowedExtension: string;
}

export function FileSelector({
  label,
  file,
  setFile,
  allowedExtension,
}: FileSelectorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFile = (f: File) => {
    const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
    if (allowedExtension !== ext) {
      setErrorMsg(
        `Only files with extensions: ${allowedExtension} are allowed.`
      );
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setErrorMsg(null);
    setFile(f);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = () => {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <Card
        className="relative h-12 py-10 flex flex-col justify-center"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {file ? (
          <div className="flex items-center justify-center gap-2">
            <FileIcon size={20} />
            <span className="select-none">{file.name}</span>
            <button onClick={handleRemove} aria-label="Remove file">
              <X size={18} />
            </button>
          </div>
        ) : (
          <>
            <label
              className="flex flex-col items-center cursor-pointer"
              htmlFor={inputId}
            >
              {label || "Drag or click to select a file"}
            </label>
            <input
              id={inputId}
              ref={inputRef}
              type="file"
              style={{ display: "none" }}
              onChange={handleChange}
            />
          </>
        )}
      </Card>
      {errorMsg && <p className="text-sm text-red-400 mt-2">{errorMsg}</p>}
    </div>
  );
}
