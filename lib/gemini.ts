"use client";

import { GoogleGenAI, createPartFromBase64 } from "@google/genai"; // official Google GenAI SDK

// Minimal helper for Google Generative AI (image generation)
// Uses model: gemini-2.5-flash-image-preview

export type GenerateImageResult = {
  dataUrl: string;
  mimeType: string;
};

export type SourceImageInline = {
  data: string; // base64 data (no data: prefix)
  mimeType: string;
};

export async function generateImageFromPrompt(
  apiKey: string,
  prompt: string,
  opts?: {
    signal?: AbortSignal;
    // Support multiple input images. If present, all are sent.
    sources?: SourceImageInline[] | null;
    // Back-compat: single source (deprecated in our code path)
    source?: SourceImageInline | null;
  },
): Promise<GenerateImageResult> {
  const ai = new GoogleGenAI({ apiKey });

  // Only use the preview model as requested.
  const model = "gemini-2.5-flash-image-preview";
  const imageParts =
    opts?.sources && opts.sources.length
      ? opts.sources.map((s) => createPartFromBase64(s.data, s.mimeType))
      : opts?.source
        ? [createPartFromBase64(opts.source.data, opts.source.mimeType)]
        : [];

  const contents = imageParts.length
    ? [
        ...imageParts,
        `${imageParts.length > 1 ? "Edit these images:" : "Edit this image:"} ${prompt}`,
      ]
    : [`Generate an image: ${prompt}`];

  const res = await ai.models.generateContent({
    model,
    contents,
    config: opts?.signal ? { abortSignal: opts.signal } : undefined,
  });

  const candidates = res?.candidates ?? [];
  for (const c of candidates) {
    const parts = c?.content?.parts ?? [];
    for (const p of parts) {
      const inline = (p as any)?.inlineData;
      if (inline?.data) {
        const mimeType = inline?.mimeType || "image/png";
        const dataUrl = `data:${mimeType};base64,${inline.data}`;
        return { dataUrl, mimeType };
      }
    }
  }

  throw new Error("No image returned. Try a more specific prompt.");
}
