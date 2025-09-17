
import { GoogleGenAI, Content, Part } from "@google/genai";
import { Message } from '../types';

// Initialize Gemini API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

// Custom error for billing-related API issues
export class BillingError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "BillingError";
    }
}

/**
 * Centralized API error handler.
 * Logs the detailed error and returns a new error with a user-friendly message.
 * @param error - The original error caught.
 * @param context - A string describing the operation (e.g., 'geração de imagem').
 * @returns An instance of `Error` or `BillingError`.
 */
const handleApiError = (error: any, context: string): Error => {
    // Log the full technical error for debugging purposes
    console.error(`Error during ${context}:`, error);
    
    let errorMessage = 'An unknown error occurred.';
    if (typeof error === 'object' && error !== null) {
        // Handle nested API error structure: { error: { message: '...' } }
        if (error.error?.message) {
            errorMessage = String(error.error.message);
        } 
        // Handle standard Error objects or other objects with a 'message' property
        else if (error.message) {
            errorMessage = String(error.message);
        }
    } else if (typeof error === 'string') {
        errorMessage = error;
    }

    // Check for specific error messages from the API to provide better user feedback
    if (errorMessage.includes("billed users")) {
        const featureName = context.includes('imagem') ? 'geração de imagens' : context.includes('vídeo') ? 'geração de vídeo' : 'esta funcionalidade';
        return new BillingError(`A ${featureName} está indisponível. A API do Google requer que o faturamento esteja ativado para este recurso.`);
    }

    if (errorMessage.includes("API key not valid")) {
        return new Error("Sua chave de API é inválida. Por favor, verifique-a nas configurações e tente novamente.");
    }
    
    if (errorMessage.includes("quota")) {
        return new Error("Você atingiu sua cota de uso da API. Por favor, verifique seu plano ou tente novamente mais tarde.");
    }

    // Generic fallback for other errors
    return new Error(`Desculpe, ocorreu um erro inesperado durante a ${context}. Por favor, tente novamente.`);
};


// Helper to convert app's message format to Gemini's format for chat history
const messageToGemini = (message: Message): Content => {
    // Note: This simplified history conversion does not handle images in past messages,
    // as the app stores them as blob URLs which are not accessible here.
    return {
        role: message.sender,
        parts: [{ text: message.text }],
    };
};

/**
 * Generates content from the Gemini model in a streaming fashion.
 * @param prompt - The user's text prompt.
 * @param history - The chat history.
 * @param imagePart - Optional image data to include in the prompt.
 * @param language - The desired response language ('pt-BR' or 'en-US').
 * @returns An async generator that yields text chunks of the response.
 */
export async function* generateContentStream(prompt: string, history: Message[], imagePart: Part | null, language: string): AsyncGenerator<string> {
    const model = 'gemini-2.5-flash';

    // Convert all but the last message (which is the current prompt) to Gemini's history format
    const geminiHistory = history.slice(0, -1).map(messageToGemini);
    
    // Prepare the parts for the current user message
    const currentUserMessageParts: Part[] = [];

    if (imagePart) {
        // As per Gemini API docs, for multimodal input, image parts should ideally come before text parts.
        currentUserMessageParts.push(imagePart);
    }
    currentUserMessageParts.push({ text: prompt });

    // Combine history with the current message
    const contents: Content[] = [
        ...geminiHistory,
        { role: 'user', parts: currentUserMessageParts }
    ];
    
    const systemInstruction = language === 'pt-BR' 
        ? 'Responda em português do Brasil.' 
        : 'Respond in English.';

    try {
        const streamResult = await ai.models.generateContentStream({
            model: model,
            contents: contents,
            config: {
                systemInstruction: systemInstruction,
            }
        });

        for await (const chunk of streamResult) {
            // Yield the text part of each chunk as it arrives.
            // The .text property conveniently aggregates text from all parts.
            if (chunk.text) {
                yield chunk.text;
            }
        }
    } catch (error) {
        // Throw a processed, user-friendly error for the UI layer to catch and display
        throw handleApiError(error, 'resposta do chat');
    }
}


/**
 * Generates an image based on a text prompt using the Imagen model.
 * @param prompt - The description of the image to generate.
 * @returns A promise that resolves to the base64 encoded image string.
 */
export const generateImage = async (prompt: string): Promise<string> => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/png',
            },
        });

        const image = response.generatedImages?.[0];
        if (image?.image?.imageBytes) {
            return image.image.imageBytes; // This is the base64 string
        }
        
        // This case handles an API success response that didn't contain the expected image data.
        throw new Error("A API não retornou uma imagem válida.");

    } catch (error: any) {
        throw handleApiError(error, 'geração de imagem');
    }
};

/**
 * Generates a video based on a text prompt using the Veo model.
 * @param prompt - The description of the video to generate.
 * @returns A promise that resolves to the full video URL including the API key.
 */
export const generateVideo = async (prompt: string): Promise<string> => {
    try {
        let operation = await ai.models.generateVideos({
            model: 'veo-2.0-generate-001',
            prompt: prompt,
            config: {
                numberOfVideos: 1
            }
        });

        // Poll for completion, as video generation is a long-running operation
        while (!operation.done) {
            // Wait for 10 seconds before checking the operation status again
            await new Promise(resolve => setTimeout(resolve, 10000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

        if (downloadLink) {
            // The API key must be appended to the download link for it to be accessible
            return `${downloadLink}&key=${process.env.API_KEY}`;
        }
        
        throw new Error("A API não retornou um link de vídeo válido.");

    } catch (error: any) {
        throw handleApiError(error, 'geração de vídeo');
    }
};


/**
 * Generates a short title for a new chat session based on the first message.
 * @param firstMessage - The user's first message in the chat.
 * @param language - The desired language for the title.
 * @returns A promise that resolves to a concise chat title.
 */
export const generateChatTitle = async (firstMessage: string, language: string): Promise<string> => {
    try {
        const systemInstruction = language === 'pt-BR'
            ? `Você é um gerador de títulos para chats. Sua tarefa é criar um título curto e conciso (máximo 4 palavras) para a conversa, baseado na primeira mensagem do usuário. Responda *apenas* com o título, sem formatação extra, aspas, ou palavras como "Título:".`
            : `You are a chat title generator. Your task is to create a short and concise title (maximum 4 words) for the conversation, based on the user's first message. Respond with *only* the title, without extra formatting, quotes, or words like "Title:".`;

        const userPrompt = `Generate a title for a chat starting with: "${firstMessage}"`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userPrompt,
            config: {
                systemInstruction: systemInstruction,
            },
        });
        
        // Use the .text property to get the clean text output and trim whitespace
        let title = response.text.trim();
        
        // More robust cleaning:
        // 1. Remove common model prefixes like "Título: " or "Title: " (case-insensitive)
        title = title.replace(/^(título|title):?\s*/i, '');
        // 2. Remove any surrounding quotes, asterisks, or markdown characters from the start and end.
        title = title.replace(/^["'*#\s]+|["'*#\s]+$/g, '');

        const fallbackTitle = language === 'pt-BR' ? 'Novo Chat' : 'New Chat';

        // Ensure the title is not empty after cleaning, otherwise use the fallback.
        return title || fallbackTitle;
    } catch (error) {
        // A failed title generation shouldn't break the user experience.
        // Log the error for debugging and return a fallback title.
        console.error("Error generating chat title:", error);
        const fallbackTitle = language === 'pt-BR' ? 'Novo Chat' : 'New Chat';
        return fallbackTitle;
    }
};
