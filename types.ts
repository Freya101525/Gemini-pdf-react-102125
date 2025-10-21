
export type Theme = {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent: string;
};

export type ThemeName = "Blue sky" | "Snow white" | "Dark Knight" | "Sparkling galaxy" | "Alp.Forest" | "UK royal" | "Flora" | "Fendi CASA" | "Ferrari Sportscar" | "Holiday season style";

export type Provider = "Gemini" | "OpenAI" | "Grok";

export type ExecutionStatus = "success" | "error" | "empty" | "running";

export interface ExecutionRecord {
  id: string;
  time: string;
  agent: string;
  provider: Provider;
  model: string;
  status: ExecutionStatus;
  duration_s: number;
  prompt_id?: string | null;
}

export interface AgentConfig {
  name: string;
  api: Provider;
  model: string;
  prompt: string;
  parameters: {
      temperature?: number;
      topP?: number;
      maxOutputTokens?: number;
  };
}

export interface OrchestratorAgentConfig {
  id: string;
  use_prompt_id: boolean;
  prompt_id: string;
  version: string;
  provider: Provider;
  model: string;
  system_prompt: string;
  user_prompt: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
}
