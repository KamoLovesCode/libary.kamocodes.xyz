 // Add this new file: src/services/modelOrchestrator.ts

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
  private HF_TOKEN = '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';
  private models = {
    // Primary reasoning model - good for structured thinking
    archRouter: 'katanemo/Arch-Router-1.5B:hf-inference',
    // Creative/expansive model - good for elaboration
    smolLM: 'HuggingFaceTB/SmolLM3-3B:hf-inference',
    // Fast model for quick responses
    tinyLlama: 'TinyLlama/TinyLlama-1.1B-Chat-v1.0:hf-inference',
    // Analysis model for evaluation
    phi2: 'microsoft/phi-2:hf-inference'
  };

  private async queryModel(
    model: string, 
    prompt: string, 
    options: { temperature?: number; maxTokens?: number; stream?: boolean } = {}
  ): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 500,
          stream: options.stream ?? false,
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Model ${model} failed: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async queryModelStream(
    model: string,
    prompt: string,
    onChunk: (chunk: string) => void,
    options: { temperature?: number; maxTokens?: number } = {}
  ): Promise<void> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 500,
          stream: true,
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Model ${model} failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response body not readable');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        while (true) {
          const lineEnd = buffer.indexOf('\n');
          if (lineEnd === -1) break;

          const line = buffer.slice(0, lineEnd).trim();
          buffer = buffer.slice(lineEnd + 1);

          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;
              if (content) {
                onChunk(content);
              }
            } catch (e) {
              // Ignore invalid JSON
            }
          }
        }
      }
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private async evaluateResponses(responses: ModelResponse[], originalPrompt: string): Promise<ModelResponse[]> {
    // Use Phi-2 to evaluate which response is best
    const evaluationPrompt = `
Original request: "${originalPrompt}"

I have received multiple responses from different AI models. Please analyze them and rank which one is best:

${responses.map((r, i) => `
RESPONSE ${i + 1} (from ${r.model}):
${r.content}
---`).join('\n')}

Consider:
1. Relevance to the original request
2. Clarity and coherence
3. Actionability/practicality
4. Completeness

Return a JSON object with:
- bestResponseIndex: the index (0-based) of the best response
- reasoning: brief explanation why
- confidenceScore: 0-100 score

Format: {"bestResponseIndex": number, "reasoning": string, "confidenceScore": number}
`;

    try {
      const evaluation = await this.queryModel(this.models.phi2, evaluationPrompt, { temperature: 0.3 });
      
      // Parse JSON from response
      const jsonMatch = evaluation.match(/\{.*\}/s);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.bestResponseIndex !== undefined && responses[parsed.bestResponseIndex]) {
          responses[parsed.bestResponseIndex].confidence = parsed.confidenceScore || 85;
        }
      }
    } catch (e) {
      console.error('Evaluation failed:', e);
    }

    return responses;
  }

  async getBestResponse(
    prompt: string,
    context?: { 
      goal?: string; 
      history?: string[];
      taskType?: 'enhance' | 'summarize' | 'generate-steps' | 'elaborate' | 'refine';
    }
  ): Promise<OrchestratedResponse> {
    const startTime = Date.now();
    const responses: ModelResponse[] = [];

    try {
      // Step 1: Use Arch-Router to analyze the request type and route to best model
      const routerPrompt = `
Analyze this request and determine what type of task it is:
- enhance: improving/expanding existing content
- summarize: condensing information
- generate-steps: creating actionable steps for a goal
- elaborate: adding details to a goal
- refine: conversational refinement

Also identify key requirements (conciseness, creativity, structure, etc.).

Request: "${prompt}"
${context?.goal ? `Goal context: ${context.goal}` : ''}

Return a JSON with: {"taskType": string, "requirements": string[], "suggestedPrimary": string, "suggestedSecondary": string}
`;

      const routerResponse = await this.queryModel(this.models.archRouter, routerPrompt, { temperature: 0.3 });
      let routing;
      try {
        const jsonMatch = routerResponse.match(/\{.*\}/s);
        routing = jsonMatch ? JSON.parse(jsonMatch[0]) : {
          taskType: context?.taskType || 'enhance',
          requirements: ['clarity'],
          suggestedPrimary: this.models.smolLM,
          suggestedSecondary: this.models.tinyLlama
        };
      } catch {
        routing = { taskType: context?.taskType || 'enhance', requirements: ['clarity'] };
      }

      // Step 2: Create specialized prompts for different models
      const prompts = {
        archRouter: `Given this request: "${prompt}", provide a structured outline of how to approach it. Focus on logic and organization.`,
        
        smolLM: `You are a creative assistant helping with ${routing.taskType || 'content'}. 
${context?.goal ? `Goal: ${context.goal}\n` : ''}
Request: ${prompt}

Provide a detailed, helpful response that is practical and actionable.`,
        
        tinyLlama: `Quick response to: ${prompt}\n\nBe concise and direct.`
      };

      // Step 3: Query models in parallel where possible
      const modelQueries = [];

      // Always query the primary suggested model
      if (routing.suggestedPrimary) {
        modelQueries.push(
          this.queryModel(routing.suggestedPrimary, prompts.smolLM, { temperature: 0.7 })
            .then(content => ({ content, model: routing.suggestedPrimary }))
            .catch(e => ({ content: '', model: routing.suggestedPrimary, error: e }))
        );
      }

      // Query TinyLlama for a quick alternative perspective
      modelQueries.push(
        this.queryModel(this.models.tinyLlama, prompts.tinyLlama, { temperature: 0.5 })
          .then(content => ({ content, model: this.models.tinyLlama }))
          .catch(e => ({ content: '', model: this.models.tinyLlama, error: e }))
      );

      // If it's a complex task, also query the other model
      if (routing.taskType === 'elaborate' || routing.taskType === 'generate-steps') {
        modelQueries.push(
          this.queryModel(this.models.archRouter, prompts.archRouter, { temperature: 0.4 })
            .then(content => ({ content, model: this.models.archRouter }))
            .catch(e => ({ content: '', model: this.models.archRouter, error: e }))
        );
      }

      const rawResponses = await Promise.all(modelQueries);
      
      // Filter out errors and empty responses
      rawResponses.forEach(r => {
        if (r.content && !r.error) {
          responses.push({ content: r.content, model: r.model });
        }
      });

      if (responses.length === 0) {
        throw new Error('No models returned valid responses');
      }

      // Step 4: Evaluate which response is best
      const evaluatedResponses = await this.evaluateResponses(responses, prompt);
      
      // Find the best response (with highest confidence or first if none)
      const bestResponse = evaluatedResponses.reduce((best, current) => 
        (current.confidence || 0) > (best.confidence || 0) ? current : best
      , evaluatedResponses[0]);

      // Step 5: Optionally synthesize multiple responses if they're complementary
      let finalContent = bestResponse.content;
      let reasoning = `Primary: ${bestResponse.model}`;

      if (evaluatedResponses.length > 1 && bestResponse.confidence && bestResponse.confidence < 80) {
        // If confidence is low, try to synthesize multiple responses
        const synthesisPrompt = `
I have multiple responses to the request: "${prompt}"

Response A (${evaluatedResponses[0].model}):
${evaluatedResponses[0].content}

Response B (${evaluatedResponses[1].model}):
${evaluatedResponses[1].content}

${evaluatedResponses[2] ? `Response C (${evaluatedResponses[2].model}):\n${evaluatedResponses[2].content}` : ''}

Create a final response that combines the best elements from each, maintaining coherence and addressing the original request.
`;

        try {
          const synthesized = await this.queryModel(this.models.smolLM, synthesisPrompt, { temperature: 0.5 });
          if (synthesized.length > 50) {
            finalContent = synthesized;
            reasoning += ' (synthesized from multiple models)';
          }
        } catch (e) {
          // Fall back to best response
        }
      }

      return {
        finalContent,
        usedModels: responses.map(r => r.model),
        reasoning,
        confidence: bestResponse.confidence || 75,
        alternatives: responses
      };
    } catch (error) {
      console.error('Orchestration failed:', error);
      
      // Fallback: just use SmolLM directly
      try {
        const fallback = await this.queryModel(this.models.smolLM, prompt);
        return {
          finalContent: fallback,
          usedModels: [this.models.smolLM],
          reasoning: 'Fallback to single model',
          confidence: 50
        };
      } catch (fallbackError) {
        throw new Error('All models failed');
      }
    }
  }

  async streamBestResponse(
    prompt: string,
    onChunk: (chunk: string) => void,
    context?: any
  ): Promise<void> {
    // For streaming, we'll use SmolLM3 with optimized prompt
    const enhancedPrompt = `
You are an AI assistant helping with ${context?.taskType || 'content creation'}.
${context?.goal ? `Goal: ${context.goal}\n` : ''}
User request: ${prompt}

Provide a thoughtful, helpful response.
`;

    await this.queryModelStream(this.models.smolLM, enhancedPrompt, onChunk, { temperature: 0.7 });
  }
}

export const modelOrchestrator = new ModelOrchestrator();