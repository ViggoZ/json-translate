import OpenAI from "openai";

interface TranslateOptions {
  text: string;
  targetLang: string;
  apiKey: string;
  baseURL?: string;
  extraPrompt?: string;
  signal?: AbortSignal;
  onProgress?: (progress: number) => void;
  onStream?: (chunk: string) => void;
}

export async function translate(options: TranslateOptions): Promise<string> {
  const { text, targetLang, apiKey, baseURL, extraPrompt, signal, onProgress, onStream } = options;

  console.log(apiKey, baseURL, extraPrompt);

  if (!apiKey.startsWith("sk-")) {
    throw new Error("Invalid API Key format");
  }

  const openai = new OpenAI({
    apiKey,
    baseURL,
    dangerouslyAllowBrowser: true,
  });

  try {
    const prompt = `Please translate the following JSON content to ${targetLang}, keep the JSON structure unchanged, only translate the value part.
    Note:
    1. Keep all keys unchanged
    2. Only translate value parts
    3. Keep JSON format valid
    4. Keep all special characters and formats

    ${extraPrompt}
    
    JSON content:
    ${text}`;

    const response = await openai.chat.completions.create(
      {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a professional JSON translation assistant. Please return the translated JSON content directly, without adding any markdown tags or other formats.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        stream: true,
      },
      {
        signal,
      }
    );

    let fullContent = "";
    let tokenCount = 0;
    const estimatedTokens = text.length / 4; // Estimate total token count

    for await (const chunk of response) {
      const content = chunk.choices[0]?.delta?.content || "";
      fullContent += content;
      tokenCount += content.length / 4;

      // Calculate current progress
      const progress = Math.min(Math.round((tokenCount / estimatedTokens) * 100), 100);
      onProgress?.(progress);

      onStream?.(fullContent);
    }

    // Validate final JSON format
    try {
      const parsedJson = JSON.parse(fullContent);
      fullContent = JSON.stringify(parsedJson, null, 2);
    } catch (e) {
      if (signal?.aborted) {
        return "";
      }
      throw new Error(`Invalid translation result format: ${(e as Error).message}`);
    }

    return fullContent;
  } catch (error: unknown) {
    if (signal?.aborted || (error instanceof DOMException && error.name === "AbortError")) {
      return "";
    }

    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        throw new Error("Invalid or expired API Key");
      }

      if (error.status === 429) {
        throw new Error("API call limit reached");
      }
    }

    throw error;
  }
}

export async function validateApiKey(apiKey: string, baseURL?: string): Promise<boolean> {
  console.log("apiKey, baseURL");
  console.log(apiKey, baseURL);

  if (!apiKey.startsWith("sk-")) {
    throw new Error("Invalid API Key format");
  }

  const openai = new OpenAI({
    apiKey,
    baseURL,
    dangerouslyAllowBrowser: true,
  });

  try {
    // Send a minimal request to validate the API key
    await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "test" }],
      max_tokens: 1,
    });
    return true;
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        throw new Error("Invalid or expired API Key");
      }
      if (error.status === 429) {
        throw new Error("API call limit reached");
      }
    }
    throw error;
  }
}
