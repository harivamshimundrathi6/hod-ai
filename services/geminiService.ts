
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { CallLog } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Helper to execute API calls with exponential backoff retry logic.
 * Specifically targets 429 (Rate Limit) and 5xx (Server) errors.
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const isRetryable = error?.status === 429 || (error?.status >= 500 && error?.status <= 599);
    if (retries > 0 && isRetryable) {
      console.warn(`Gemini API error ${error.status}. Retrying in ${delay}ms... (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export const geminiService = {
  async generateSummary(transcript: CallLog['transcript']): Promise<string> {
    const textTranscript = transcript.map(t => `${t.speaker}: ${t.text}`).join('\n');
    return withRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Please provide a concise 1-sentence summary of this conversation between a caller and an AI department assistant:\n\n${textTranscript}`,
      });
      return response.text || "No summary available";
    });
  },

  async analyzeCall(transcript: CallLog['transcript']): Promise<{ 
    summary: string; 
    queryType: 'Exam' | 'Fee' | 'Attendance' | 'Admission' | 'Emergency' | 'Other';
    phoneNumber?: string;
    rollNumber?: string;
    callerName?: string;
    callerRole?: string;
  }> {
    const textTranscript = transcript.map(t => `${t.speaker}: ${t.text}`).join('\n');
    
    return withRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze the following transcript from a University Department AI Receptionist and provide:
        1. A professional 1-sentence summary.
        2. Classify the query into one of these categories: Exam, Fee, Attendance, Admission, Emergency, Other.
        3. Extract the caller's name, role, and university roll number (if mentioned, especially for students) or phone number (for non-students).
        
        Transcript:
        ${textTranscript}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              queryType: { 
                type: Type.STRING, 
                enum: ['Exam', 'Fee', 'Attendance', 'Admission', 'Emergency', 'Other'] 
              },
              phoneNumber: { type: Type.STRING, description: "Extract the 10-digit mobile number if mentioned" },
              rollNumber: { type: Type.STRING, description: "Extract the university roll number if mentioned (e.g., CS2024-005)"},
              callerName: { type: Type.STRING },
              callerRole: { type: Type.STRING }
            },
            required: ["summary", "queryType"]
          }
        }
      });

      try {
        return JSON.parse(response.text || '{}');
      } catch (e) {
        return { summary: "Call completed.", queryType: 'Other' };
      }
    });
  },

  async generateSmartAlerts(logs: any[]): Promise<{ title: string; severity: 'high' | 'medium' | 'low'; description: string }[]> {
    if (logs.length === 0) return [];
    
    const logData = logs.slice(0, 10).map(l => `[${l.queryType}] ${l.summary}`).join('\n');
    return withRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Act as a Department Head's Strategy Assistant. Review these recent call summaries and identify up to 3 critical trends or issues that need HOD attention. Return a list of alerts.
        
        LOG SUMMARIES:
        ${logData}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                severity: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
                description: { type: Type.STRING }
              },
              required: ["title", "severity", "description"]
            }
          }
        }
      });

      try {
        return JSON.parse(response.text || '[]');
      } catch (e) {
        return [];
      }
    });
  },

  async refinePromptScript(currentScript: string): Promise<string> {
    return withRetry(async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Act as an expert prompt engineer. Refine this HOD AI Receptionist prompt to be more efficient, professional, and clear. Keep the instructions for handling Student ID lookups, Emergency forwarding (9347216338), and multi-language support (English, Hindi, Telugu):\n\n${currentScript}`,
      });
      return response.text || currentScript;
    });
  },

  async generateTTS(transcript: { speaker: string; text: string }[]): Promise<string | undefined> {
    const prompt = `TTS the following conversation between the Caller and the AI Assistant:
      ${transcript.map(t => `${t.speaker}: ${t.text}`).join('\n')}`;

    return withRetry(async () => {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                {
                  speaker: 'Caller',
                  voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }
                },
                {
                  speaker: 'AI',
                  voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
                }
              ]
            }
          }
        }
      });

      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    });
  }
};

export function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
