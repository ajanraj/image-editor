"use client";

import { memo, useCallback, useEffect, useRef } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Download, Plus, Trash2, Loader2, RefreshCw } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

type ImageNodeData = {
  prompt?: string;
  imageUrl?: string; // optional, falls back to placeholder
  autoFocus?: boolean;
  isLoading?: boolean;
  error?: string;
  updateNodeData: (id: string, data: Record<string, unknown>) => void;
  onDelete: (id: string) => void;
  onDownload?: (id: string) => void;
  onAddNext?: (id: string) => void;
  onRegenerate?: (id: string) => void;
};

export const ImageNode = memo(function ImageNode({
  id,
  data,
}: NodeProps<ImageNodeData>) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!data.autoFocus) return;
    const el = inputRef.current;
    if (!el) return;
    const raf = requestAnimationFrame(() => {
      el.focus({ preventScroll: true });
      const len = el.value.length;
      try {
        el.setSelectionRange(len, len);
      } catch {}
    });
    return () => cancelAnimationFrame(raf);
  }, [data.autoFocus]);

  const onPromptChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      data.updateNodeData?.(id, { prompt: e.target.value });
    },
    [data, id],
  );

  const imageSrc = data.imageUrl;
  const isLoading = !!data.isLoading;

  return (
    <div className="group relative w-[350px] select-none">
      {/* Connectors */}
      <Handle
        id="t"
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !bg-white !border !border-black/30 !z-20 opacity-0 transition-opacity duration-150 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
      />
      <Handle
        id="b"
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !bg-white !border !border-black/30 !z-0 opacity-0 transition-opacity duration-150 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
      />
      {/* Delete */}
      <button
        aria-label="Delete"
        onClick={() => data.onDelete?.(id)}
        className="absolute -right-3 -top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-sm transition hover:bg-red-600"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {/* Card wrapper / drag handle */}
      <div className="peer drag-handle rounded-2xl border border-white/10 bg-black/40 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset] backdrop-blur">
        {/* Prompt label + input */}
        <div className="px-1">
          <div className="mb-1 text-sm text-white/60">Prompt:</div>
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={data.prompt ?? ""}
              onChange={onPromptChange}
              placeholder="Describe the image..."
              className="nodrag nopan w-full bg-transparent text-xl font-medium leading-7 text-white placeholder:text-white/50 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => data.onRegenerate?.(id)}
              title="Regenerate"
              disabled={isLoading || !(data.prompt && (data.prompt as string).trim().length > 0)}
              className="nodrag nopan inline-flex h-9 w-9 items-center justify-center rounded-md bg-neutral-300/20 text-white transition hover:bg-neutral-300/30 disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Image preview (no inner padding) */}
        <div className="group mt-3 overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/70 relative">
          <AspectRatio ratio={1}>
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={data.prompt ?? "Generated image"}
                className={`h-full w-full object-cover transition-[filter] duration-200 ${
                  isLoading ? "blur" : ""
                }`}
                draggable={false}
              />
            ) : (
              <div className={`h-full w-full bg-neutral-800/50 ${isLoading ? "blur" : ""}`} />
            )}
            {isLoading && (
              <div className="absolute inset-0 z-20 grid place-items-center rounded-2xl bg-black/50">
                <div className="flex items-center gap-2 text-white/90">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">Generating…</span>
                </div>
              </div>
            )}
          </AspectRatio>

          {/* Bottom controls (optional hooks) */}
          <div className="relative overflow-visible">
            {/* download: always clickable on mobile; hover-revealed on desktop */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                data.onDownload?.(id);
              }}
              title="Download image"
              disabled={isLoading || !imageSrc}
              className="absolute bottom-2 right-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-black transition-opacity duration-150 hover:bg-white/90 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 disabled:opacity-50"
            >
              <Download className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Plus: half outside bottom center of the card (like delete) */}
      <button
        type="button"
        onClick={() => data.onAddNext?.(id)}
        title="Add next"
        className="absolute left-1/2 -bottom-5 z-10 -translate-x-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-sm transition-transform duration-150 hover:scale-110"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
});

export default ImageNode;
