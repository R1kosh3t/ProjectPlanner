import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a task title and a list of subtasks based on a user prompt.
 */
export async function generateTaskSuggestions(prompt: string): Promise<{ title: string; subtasks: string[] }> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Based on the user's request, create a concise task title and a list of actionable subtasks. Request: "${prompt}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: 'A concise, actionable title for the task.'
            },
            subtasks: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
              },
              description: 'A list of small, actionable subtasks to complete the main task.'
            },
          },
          required: ["title", "subtasks"],
        },
      },
    });

    const jsonText = response.text.trim();
    // Handle cases where the model might wrap the JSON in markdown
    if (jsonText.startsWith('```json')) {
        const parsed = JSON.parse(jsonText.replace(/```json\n?|```/g, ''));
        return parsed;
    }
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error generating task suggestions:", error);
    throw new Error("Failed to generate AI suggestions. Please try again.");
  }
}
