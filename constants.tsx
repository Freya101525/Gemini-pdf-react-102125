import React from 'react';
import { Theme, ThemeName, Provider, AgentConfig } from './types';

export const THEMES: Record<ThemeName, Theme> = {
    "Blue sky": { primary: "#87CEEB", secondary: "#4682B4", background: "#F0F8FF", text: "#1E3A5F", accent: "#FFD700" },
    "Snow white": { primary: "#FFFFFF", secondary: "#E8E8E8", background: "#F5F5F5", text: "#2C3E50", accent: "#3498DB" },
    "Dark Knight": { primary: "#212121", secondary: "#424242", background: "#121212", text: "#EAEAEA", accent: "#FF3B30" },
    "Sparkling galaxy": { primary: "#8B5CF6", secondary: "#EC4899", background: "#1E1B4B", text: "#F3E8FF", accent: "#FCD34D" },
    "Alp.Forest": { primary: "#2D5016", secondary: "#4A7C59", background: "#E8F5E9", text: "#1B5E20", accent: "#FF6F00" },
    "UK royal": { primary: "#00247D", secondary: "#CF142B", background: "#F4F6FA", text: "#1A1A1A", accent: "#FFD700" },
    "Flora": { primary: "#E91E63", secondary: "#9C27B0", background: "#FCE4EC", text: "#880E4F", accent: "#00BCD4" },
    "Fendi CASA": { primary: "#D4AF37", secondary: "#8B7355", background: "#F5F5DC", text: "#3E2723", accent: "#C9A961" },
    "Ferrari Sportscar": { primary: "#DC0000", secondary: "#8B0000", background: "#FFF5F5", text: "#1A0000", accent: "#FFD700" },
    "Holiday season style": { primary: "#0B8457", secondary: "#C1121F", background: "#F9FAFB", text: "#22333B", accent: "#F4D35E" }
};

export const MODEL_OPTIONS: Record<Provider, string[]> = {
    "Gemini": ["gemini-2.5-flash", "gemini-2.5-pro"],
    "OpenAI": ["gpt-4o-mini", "gpt-4.1-mini"], // Mocked
    "Grok": ["grok-4-fast-reasoning", "grok-3-mini"] // Mocked
};

export const DEFAULT_PDF_AGENTS: AgentConfig[] = [
    {
        // FIX: Add missing 'id' property to satisfy the AgentConfig type.
        id: "default-summarizer",
        name: "Document Summarizer",
        api: "Gemini",
        model: "gemini-2.5-flash",
        prompt: "Provide a concise, one-paragraph summary of the following document:\n\n---\n{input_text}\n---",
        parameters: { temperature: 0.5, maxOutputTokens: 512 }
    },
    {
        // FIX: Add missing 'id' property to satisfy the AgentConfig type.
        id: "default-extractor",
        name: "Key Takeaways Extractor",
        api: "Gemini",
        model: "gemini-2.5-flash",
        prompt: "Extract the top 5 most important key takeaways from the document below. Present them as a bulleted list.\n\n---\n{input_text}\n---",
        parameters: { temperature: 0.7, maxOutputTokens: 1024 }
    },
    {
        // FIX: Add missing 'id' property to satisfy the AgentConfig type.
        id: "default-identifier",
        name: "Action Items Identifier",
        api: "Gemini",
        model: "gemini-2.5-pro",
        prompt: "Analyze the following text and identify any potential action items, tasks, or decisions that need to be made. If none are found, state that explicitly.\n\n---\n{input_text}\n---",
        parameters: { temperature: 0.2, maxOutputTokens: 1024 }
    }
];

export const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

export const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);