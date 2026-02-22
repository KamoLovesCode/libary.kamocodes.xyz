import { aiService } from "./ai";

export interface ModelResponse {
  content: string;
  model: string;
  confidence?: number;
  latency?: number;
}

export interface OrchestratedResponse {
  finalContent: string;
  usedModels: string[];
  reasoning: string;
  confidence: number;
  alternatives?: ModelResponse[];
}

class ModelOrchestrator {
  async getBestResponse(
    prompt: string,
    context?: { 
      goal?: string; 
      history?: string[];
      taskType?: 'enhance' | 'summarize' | 'generate-steps' | 'elaborate' | 'refine';
    }
  ): Promise<OrchestratedResponse> {
    const content = await aiService.generateCompletion(prompt);
    return {
      finalContent: content,
      usedModels: ['gemini-3-flash-preview'],
      reasoning: 'Single model response',
      confidence: 70
    };
  }

  async streamBestResponse(
    prompt: string,
    onChunk: (chunk: string) => void,
    context?: any
  ): Promise<void> {
    const content = await aiService.generateCompletion(prompt);
    onChunk(content);
  }
}

export const modelOrchestrator = new ModelOrchestrator();