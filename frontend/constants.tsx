
import React from 'react';
import { 
  Terminal, 
  BarChart3, 
  History, 
  Zap, 
  ShieldAlert, 
  Cpu, 
  Activity,
  Globe,
  Settings,
  Layout
} from 'lucide-react';

export const SAMPLE_PROMPTS = [
  {
    label: "Weak: 'fix code'",
    text: "fix code",
    category: "low"
  },
  {
    label: "Medium: 'summarize this'",
    text: "summarize this long article and make it simple for me",
    category: "medium"
  },
  {
    label: "Strong: 'Structured Request'",
    text: "Analyze the provided Python snippet for potential security vulnerabilities specifically related to SQL injection. Output findings in a JSON format with 'severity' and 'description' keys.",
    category: "high"
  }
];

export const NAV_ITEMS = [
  { id: 'ANALYSIS', label: 'Analysis Engine', icon: <Terminal size={18} /> },
  { id: 'METRICS', label: 'Live Metrics', icon: <BarChart3 size={18} /> },
  { id: 'HISTORY', label: 'History', icon: <History size={18} /> },
];

export const STOPWORDS = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'to', 'for', 'in', 'on', 'at', 'with', 'by', 'please', 'can', 'you', 'my', 'me', 'i', 'the', 'this', 'that']);

export const AVAILABLE_MODELS = [
  { id: 'gemini-3-flash-preview', name: 'Gemini-3 Flash', description: 'Optimized for speed and efficiency.' },
  { id: 'gemini-3-pro-preview', name: 'Gemini-3 Pro', description: 'Advanced reasoning for complex tasks.' }
];
