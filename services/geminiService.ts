import { GoogleGenAI } from "@google/genai";

export const executeGeminiQuery = async (
    prompt: string,
    model: string,
    temperature: number,
    topP: number,
    maxOutputTokens: number
): Promise<string> => {
    // FIX: Reverted to process.env.API_KEY to fix runtime error in the execution environment.
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
        // FIX: Updated the error message to be more generic and align with the environment's use of secrets.
        throw new Error("Gemini API key is not configured. Please ensure the API_KEY is set in your environment secrets.");
    }
    try {
        const ai = new GoogleGenAI({ apiKey });
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