"use client";

import { Input } from "@/components/ui/input";
import { useTranslate } from "@/context/TranslateContext";
import { useToast } from "@/hooks/use-toast";
import { parseJson } from "@/lib/json-utils";
import { UploadIcon, FileJson2Icon, KeyIcon, Languages, FileIcon } from "lucide-react";
import { useState } from "react";

interface FileUploadProps {
  dict: {
    title: string;
    description: string;
    dragText: string;
    supportText: string;
    apiKeyTip: string;
    apiKeyTitle: string;
    apiKeyPlaceholder: string;
    errorTitle: string;
    successTitle: string;
    errors?: {
      selectFile: string;
      jsonExtension: string;
      fileSize: string;
      jsonFormat: string;
      emptyJson: string;
    };
    success?: {
      uploaded: string;
    };
  };
}

export function FileUpload({ dict }: FileUploadProps) {
  const [isUploaded, setIsUploaded] = useState(false);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string } | null>(null);
  const { toast } = useToast();
  const { setFile, apiKey, setApiKey, baseURL, setBaseURL, extraPrompt, setExtraPrompt, resetTranslation } = useTranslate();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

    if (!files || !files[0]) {
      toast({
        variant: "destructive",
        title: dict.errorTitle || "Error",
        description: dict.errors?.selectFile || "Please select a file",
      });
      return;
    }

    const file = files[0];

    if (!file.name.endsWith(".json")) {
      toast({
        variant: "destructive",
        title: "Error",
        description: dict.errors?.jsonExtension || "Please upload a file with a .json extension",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Error",
        description: dict.errors?.fileSize || "File size cannot exceed 10MB",
      });
      return;
    }

    try {
      const text = await file.text();
      const result = parseJson(text.trim());

      if (!result.success) {
        throw new Error(result.error || dict.errors?.jsonFormat || "Invalid JSON format");
      }

      if (Object.keys(result.data).length === 0) {
        throw new Error(dict.errors?.emptyJson || "JSON file cannot be empty");
      }

      setFile(file);
      setIsUploaded(true);
      setFileInfo({
        name: file.name,
        size: formatFileSize(file.size),
      });
      resetTranslation();
      toast({
        title: dict.successTitle || "Success",
        description: dict.success?.uploaded || "File uploaded successfully",
      });
    } catch (err) {
      setIsUploaded(false);
      setFileInfo(null);
      toast({
        variant: "destructive",
        title: "JSON Format Error",
        description: err instanceof Error ? err.message : dict.errors?.jsonFormat || "Invalid file format",
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const event = { target: { files } } as React.ChangeEvent<HTMLInputElement>;
      handleUpload(event);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="w-full max-w-xl space-y-4">
      <div>
        <label
          htmlFor="dropzone-file"
          className={`flex flex-col items-center justify-center w-full p-16 border border-dashed rounded-2xl cursor-pointer transition-colors
            ${isUploaded ? "border-blue-500 bg-blue-50 hover:bg-blue-100/50" : "border-blue-300 bg-blue-50 hover:bg-blue-100/50"}`}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="mb-3 flex items-center justify-center">{isUploaded ? <FileJson2Icon className="w-10 h-10 text-blue-600" /> : <UploadIcon className="w-10 h-10 text-blue-600" />}</div>
          {fileInfo ? (
            <>
              <span className="text-center text-gray-900 text-sm font-medium leading-5 mb-1">{fileInfo.name}</span>
              <span className="text-center text-gray-500 text-xs">{fileInfo.size}</span>
            </>
          ) : (
            <>
              <span className="text-center text-gray-400 text-xs font-normal leading-4 mb-1">{dict.supportText}</span>
              <h6 className="text-center text-gray-900 text-sm font-medium leading-5">{dict.dragText}</h6>
            </>
          )}
          <input id="dropzone-file" type="file" className="hidden" accept=".json" onChange={handleUpload} />
        </label>
      </div>

      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <KeyIcon className="w-5 h-5" />
          {dict.apiKeyTitle || "OpenAI API Key"}
        </h2>
        <p className="text-xs text-muted-foreground pb-2">{dict.apiKeyTip || "Tips: OpenAI API Key is required for translation."}</p>
        <Input type="password" placeholder={dict.apiKeyPlaceholder || "sk-..."} className="mt-1 shadow-none" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
        <Input type="text" placeholder="baseURL" className="mt-1 shadow-none" value={baseURL} onChange={(e) => setBaseURL(e.target.value)} />
        <Input type="text" placeholder="extraPrompt" className="mt-1 shadow-none" value={extraPrompt} onChange={(e) => setExtraPrompt(e.target.value)} />
      </div>
    </div>
  );
}
