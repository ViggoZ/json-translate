"use client";

import { createContext, useContext, useState } from "react";

interface TranslatedResult {
  lang: string;
  content: string;
}

interface TranslateContextType {
  file: File | null;
  setFile: (file: File | null) => void;
  sourceLang: string;
  setSourceLang: (lang: string) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  baseURL: string;
  setBaseURL: (key: string) => void;
  extraPrompt: string;
  setExtraPrompt: (key: string) => void;
  isTranslating: boolean;
  setIsTranslating: (status: boolean) => void;
  translatedContent: string;
  setTranslatedContent: (content: string) => void;
  progress: number;
  setProgress: (progress: number) => void;
  cancelTranslation: boolean;
  setCancelTranslation: (cancel: boolean) => void;
  streamContent: string;
  setStreamContent: (content: string) => void;
  translatedResults: TranslatedResult[];
  setTranslatedResults: (results: TranslatedResult[]) => void;
  selectedLangs: string[];
  setSelectedLangs: (langs: string[]) => void;
  currentTranslatingLang: string | null;
  setCurrentTranslatingLang: (lang: string | null) => void;
  totalProgress: number;
  setTotalProgress: (progress: number) => void;
  estimatedTime: number;
  setEstimatedTime: (time: number) => void;
  resetTranslation: () => void;
}

const TranslateContext = createContext<TranslateContextType | undefined>(undefined);

export function TranslateProvider({ children }: { children: React.ReactNode }) {
  const [file, setFile] = useState<File | null>(null);
  const [sourceLang, setSourceLang] = useState("en");
  const [apiKey, setApiKey] = useState("");
  const [baseURL, setBaseURL] = useState("");
  const [extraPrompt, setExtraPrompt] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedContent, setTranslatedContent] = useState("");
  const [progress, setProgress] = useState(0);
  const [cancelTranslation, setCancelTranslation] = useState(false);
  const [streamContent, setStreamContent] = useState("");
  const [translatedResults, setTranslatedResults] = useState<TranslatedResult[]>([]);
  const [selectedLangs, setSelectedLangs] = useState<string[]>(["en", "de", "ja", "ru", "tr", "pt", "es", "fr", "zh"]);
  const [currentTranslatingLang, setCurrentTranslatingLang] = useState<string | null>(null);
  const [totalProgress, setTotalProgress] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);

  const resetTranslation = () => {
    setTranslatedResults([]);
    setTranslatedContent("");
    setStreamContent("");
    setProgress(0);
    setTotalProgress(0);
    setEstimatedTime(0);
    setCurrentTranslatingLang(null);
  };

  const value = {
    file,
    setFile,
    sourceLang,
    setSourceLang,
    apiKey,
    setApiKey,
    baseURL,
    setBaseURL,
    extraPrompt,
    setExtraPrompt,
    isTranslating,
    setIsTranslating,
    translatedContent,
    setTranslatedContent,
    progress,
    setProgress,
    cancelTranslation,
    setCancelTranslation,
    streamContent,
    setStreamContent,
    translatedResults,
    setTranslatedResults,
    selectedLangs,
    setSelectedLangs,
    currentTranslatingLang,
    setCurrentTranslatingLang,
    totalProgress,
    setTotalProgress,
    estimatedTime,
    setEstimatedTime,
    resetTranslation,
  };

  return <TranslateContext.Provider value={value}>{children}</TranslateContext.Provider>;
}

export function useTranslate() {
  const context = useContext(TranslateContext);
  if (context === undefined) {
    throw new Error("useTranslate must be used within a TranslateProvider");
  }
  return context;
}
