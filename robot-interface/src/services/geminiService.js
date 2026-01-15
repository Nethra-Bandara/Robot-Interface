import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
    console.warn("VITE_GEMINI_API_KEY is not set in .env file. Chatbot will not function.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Sends a message to the Gemini model and returns the response.
 * @param {string} prompt - The user's message.
 * @returns {Promise<string>} - The model's text response.
 */
export const sendMessageToGemini = async (prompt) => {
    try {
        if (!API_KEY) throw new Error("API Key missing");

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // For a simple chat interface, we can use generateContent. 
        // For maintaining history, we would use startChat.
        // Starting with simple one-off for now, or startChat if context is needed.
        // Let's use simple generation for the MVP integration.

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error communicating with Gemini:", error);
        return "Error: Could not connect to the assistant.";
    }
};
