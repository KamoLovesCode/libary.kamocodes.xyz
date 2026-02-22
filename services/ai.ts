
import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
    const apiKey = (import.meta.env.VITE_GEMINI_API_KEY as string) || (import.meta.env.GEMINI_API_KEY as string);
    if (!apiKey) {
        throw new Error("API Key not found");
    }
    return new GoogleGenAI({ apiKey });
};

export const aiService = {
    async generateCompletion(prompt: string, systemInstruction?: string): Promise<string> {
        try {
            const ai = getAiClient();
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: {
                    systemInstruction: systemInstruction,
                }
            });
            return response.text || "";
        } catch (error) {
            console.error("AI Generation failed:", error);
            throw error;
        }
    }
};
