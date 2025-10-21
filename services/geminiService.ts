
import { GoogleGenAI } from "@google/genai";

// This is a placeholder for a secure way to get the API key.
// In a real production app, this should never be hardcoded or directly exposed in the client.
const API_KEY = process.env.API_KEY;

export const executeGeminiQuery = async (
    prompt: string,
    model: string,
    temperature: number,
    topP: number,
    maxOutputTokens: number
): Promise<string> => {
    if (!API_KEY) {
        throw new Error("Gemini API key is not configured.");
    }
    try {
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                temperature,
                topP,
                maxOutputTokens,
            },
        });
        return response.text;
    } catch (error) {
        console.error("Gemini API call failed:", error);
        if (error instanceof Error) {
           return `Error: ${error.message}`;
        }
        return "An unknown error occurred while contacting the Gemini API.";
    }
};
