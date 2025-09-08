"use client";

import "@xyflow/react/dist/style.css";
import { useCallback, useRef, useState } from "react";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react";
import { TextNode } from "@/components/nodes/text-node";
import { ImageNode } from "@/components/nodes/image-node";
import GeminiKeyButton from "@/components/gemini/gemini-key-button";
import { useGeminiKey } from "@/lib/gemini-key-context";
import { generateImageFromPrompt } from "@/lib/gemini";
import { toast } from "sonner";
import { X } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const nodeTypes = {
  textNode: TextNode,
  imageNode: ImageNode,
};

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

function Flow() {
  const [guideOpen, setGuideOpen] = useState(true);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, getEdges: rfGetEdges, getNodes: rfGetNodes } =
    useReactFlow();
  const { apiKey } = useGeminiKey();
  const lastDownloadAtRef = useRef<Map<string, number>>(new Map());

  const saveUrlAs = useCallback(async (url: string, name?: string) => {
    try {
      let blob: Blob;
      let mime = "image/png";
      const dataMatch = url.match(/^data:(.*?);base64,(.*)$/);
      if (dataMatch) {
        mime = dataMatch[1] || "image/png";
        const b64 = dataMatch[2];
        const bin = atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        blob = new Blob([bytes], { type: mime });
      } else {
        const resp = await fetch(url);
        blob = await resp.blob();
        mime = blob.type || mime;
      }
      const href = URL.createObjectURL(blob);
      const ext = mime.includes("jpeg") ? "jpg" : mime.split("/")[1] || "png";
      const a = document.createElement("a");
      a.href = href;
      a.download = name ?? `image-${Date.now()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(href), 1500);
    } catch (e) {
      console.error("download failed", e);
    }
  }, []);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const updateNodeData = useCallback(
    (nodeId: string, newData: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                ...newData,
              },
            };
          }
          return node;
        }),
      );
    },
    [setNodes],
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) =>
        eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
      );
    },
    [setNodes, setEdges],
  );

  const regenerateImageNode = useCallback(
    async (imageNodeId: string) => {
      const n = rfGetNodes().find((x) => x.id === imageNodeId);
      if (!n || n.type !== "imageNode") return;
      const prompt = ((n.data as any)?.prompt as string | undefined)?.trim() ?? "";
      const isLoading = !!(n.data as any)?.isLoading;
      if (isLoading) return;
      if (!prompt) return;
      if (!apiKey) {
        toast.error("Gemini API key is not set", {
          description: "Click the key icon in the top-right to add it.",
        });
        return;
      }

      updateNodeData(imageNodeId, { isLoading: true });

      try {
        // Collect incoming image sources connected to this image node
        const incomingSourceIds = rfGetEdges()
          .filter((e) => e.target === imageNodeId)
          .map((e) => e.source);
        const allNodes = rfGetNodes();
        const sources = incomingSourceIds
          .map((sid) => allNodes.find((x) => x.id === sid))
          .filter((src): src is Node => !!src && src.type === "imageNode")
          .map((src) => (src.data as any)?.imageUrl as string | undefined)
          .filter((u): u is string => !!u)
          .map((u) => {
            const m = u.match(/^data:(.*?);base64,(.*)$/);
            if (!m) return null;
            return { mimeType: m[1] || "image/png", data: m[2] };
          })
          .filter((s): s is { mimeType: string; data: string } => !!s);

        const { dataUrl } = await generateImageFromPrompt(apiKey, prompt, {
          sources,
        });
        updateNodeData(imageNodeId, { imageUrl: dataUrl, isLoading: false });
      } catch (err) {
        console.error("Gemini image regeneration failed", err);
        toast.error("Image regeneration failed", {
          description: err instanceof Error ? err.message : "Unknown error occurred.",
        });
        updateNodeData(imageNodeId, { isLoading: false });
      }
    },
    [apiKey, rfGetEdges, rfGetNodes, updateNodeData],
  );

  const handleSubmit = useCallback(
    (nodeId: string, text: string) => {
      const newImageId = `image-${Date.now()}`;
      let parentId: string | undefined;
      // Capture incoming edges to the text node using live React Flow state
      const incomingToText = rfGetEdges().filter((e) => e.target === nodeId);
      let parentPreviewUrl: string | undefined;

      setNodes((nds) => {
        const t = nds.find((n) => n.id === nodeId);
        if (!t) return nds;
        parentId = (t.data as any)?.parentId as string | undefined;
        // If this text came from clicking plus on an image node,
        // preload the new image node with the parent's current image as a blurred preview.
        if (parentId) {
          const parent = nds.find((n) => n.id === parentId && n.type === "imageNode");
          parentPreviewUrl = (parent?.data as any)?.imageUrl as string | undefined;
        }

        const newPos = parentId
          ? { x: t.position.x, y: t.position.y + 50 }
          : t.position;

         const newImageNode: Node = {
           id: newImageId,
           type: "imageNode",
           position: newPos,
           data: {
             prompt: text,
             imageUrl: parentPreviewUrl,
             isLoading: true,
             autoFocus: false,
             updateNodeData,
             onDelete: deleteNode,
             onAddNext: addTextBelow,
              onRegenerate: regenerateImageNode,
            onDownload: (id: string) => {
              const now = Date.now();
              const last = lastDownloadAtRef.current.get(id) || 0;
              if (now - last < 1200) return;
              lastDownloadAtRef.current.set(id, now);
              const n = rfGetNodes().find((x) => x.id === id);
              const url = (n?.data as any)?.imageUrl as string | undefined;
              if (url) void saveUrlAs(url);
            },
          },
        };

        // Remove the text node and add the new image node
        return nds.filter((n) => n.id !== nodeId).concat(newImageNode);
      });

      // Rewire: replace all incoming connections to the old text node
      // with connections to the new image node (top handle 't').
      setEdges((eds) => {
        // Remove any edges that referenced the old text node
        const filtered = eds.filter(
          (e) => e.source !== nodeId && e.target !== nodeId,
        );
        let next = filtered;
        for (const ie of incomingToText) {
          next = addEdge(
            {
              id: `e-${ie.source}-${newImageId}`,
              source: ie.source,
              target: newImageId,
              sourceHandle: ie.sourceHandle,
              targetHandle: "t",
            },
            next,
          );
        }
        return next;
      });

      // Generate image using Google Generative AI
      (async () => {
        if (!apiKey) {
          toast.error("Gemini API key is not set", {
            description: "Click the key icon in the top-right to add it.",
          });
          updateNodeData(newImageId, { isLoading: false });
          return;
        }
        try {
          // Collect all incoming image sources connected to this text node (left/top/right targets)
          const incomingSourceIds = rfGetEdges()
            .filter((e) => e.target === nodeId)
            .map((e) => e.source);

          const allNodes = rfGetNodes();
          const sources = incomingSourceIds
            .map((sid) => allNodes.find((n) => n.id === sid))
            .filter((n): n is Node => !!n && n.type === "imageNode")
            .map((n) => (n.data as any)?.imageUrl as string | undefined)
            .filter((u): u is string => !!u)
            .map((u) => {
              const m = u.match(/^data:(.*?);base64,(.*)$/);
              if (!m) return null;
              return { mimeType: m[1] || "image/png", data: m[2] };
            })
            .filter((s): s is { mimeType: string; data: string } => !!s);

          const { dataUrl } = await generateImageFromPrompt(apiKey, text, {
            sources,
          });
          updateNodeData(newImageId, { imageUrl: dataUrl, isLoading: false });
        } catch (err) {
          console.error("Gemini image generation failed", err);
          toast.error("Image generation failed", {
            description:
              err instanceof Error ? err.message : "Unknown error occurred.",
          });
          // remove loading state; node will show empty preview
          updateNodeData(newImageId, { isLoading: false });
        }
      })();
    },
    [deleteNode, setEdges, setNodes, updateNodeData, apiKey, rfGetEdges, rfGetNodes],
  );

  // Add a new Text node below a given node id (used by ImageNode plus button)
  const addTextBelow = useCallback(
    (sourceId: string) => {
      const newId = `text-${Date.now()}`;
      setNodes((nds) => {
        const src = nds.find((n) => n.id === sourceId);
        const base = src?.position ?? { x: 0, y: 0 };
        // Rough layout numbers: Image node ~350px width (same as text node).
        // Place text node centered under with a little gap.
        const horizontalOffset = 0; // equal widths => no horizontal offset
        const verticalOffset = 450; // slightly below with moderate gap

        const newNode: Node = {
          id: newId,
          type: "textNode",
          position: {
            x: base.x + horizontalOffset,
            y: base.y + verticalOffset,
          },
          data: {
            text: "",
            title: "New Text Node",
            autoFocus: true,
            parentId: sourceId,
            updateNodeData,
            onDelete: deleteNode,
            onSubmit: handleSubmit,
          },
        };

        return [...nds, newNode];
      });

      // Connect parent image (bottom handle) to this new text node (top handle)
      setEdges((eds) =>
        addEdge(
          {
            id: `e-${sourceId}-${newId}`,
            source: sourceId,
            target: newId,
            sourceHandle: "b",
            targetHandle: "t",
          },
          eds,
        ),
      );
    },
    [setNodes, setEdges, updateNodeData, deleteNode, handleSubmit],
  );

  const onPaneClick = useCallback(
    (event: React.MouseEvent) => {
      const cmdOrCtrl = event.metaKey || event.ctrlKey;
      if (!cmdOrCtrl) return;

      event.preventDefault();

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // Decide node type: Shift + Cmd/Ctrl -> image node, else text node
      const isImage = event.shiftKey;

      // Rough centering offsets (both widths 350)
      const halfWidth = 175;
      const halfHeight = isImage ? 260 : 30; // approximate

      const centeredPosition = {
        x: position.x - halfWidth,
        y: position.y - halfHeight,
      };

      const newNode: Node = isImage
        ? {
            id: `image-${Date.now()}`,
            type: "imageNode",
            position: centeredPosition,
            data: {
              prompt: "",
              autoFocus: true,
              updateNodeData,
              onDelete: deleteNode,
              onAddNext: addTextBelow,
              onRegenerate: regenerateImageNode,
              onDownload: (id: string) => {
                const now = Date.now();
                const last = lastDownloadAtRef.current.get(id) || 0;
                if (now - last < 1200) return;
                lastDownloadAtRef.current.set(id, now);
                const n = rfGetNodes().find((x) => x.id === id);
                const url = (n?.data as any)?.imageUrl as string | undefined;
                if (url) void saveUrlAs(url);
              },
            },
          }
        : {
            id: `text-${Date.now()}`,
            type: "textNode",
            position: centeredPosition,
            data: {
              text: "",
              title: "New Text Node",
              autoFocus: true,
              updateNodeData,
              onDelete: deleteNode,
              onSubmit: handleSubmit,
            },
          };

      setNodes((nds) => [...nds, newNode]);
    },
    [
      screenToFlowPosition,
      setNodes,
      updateNodeData,
      deleteNode,
      handleSubmit,
      addTextBelow,
    ],
  );

  // Drag-and-drop images to create image nodes
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files || []);
      const images = files.filter((f) => f.type.startsWith("image/"));
      if (images.length === 0) return;

      const basePos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      const halfWidth = 175;
      const halfHeight = 260;

      images.forEach((file, idx) => {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          const id = `image-${Date.now()}-${idx}`;
          const offsetX = (idx % 3) * 30;
          const offsetY = Math.floor(idx / 3) * 30;
          const node: Node = {
            id,
            type: "imageNode",
            position: {
              x: basePos.x - halfWidth + offsetX,
              y: basePos.y - halfHeight + offsetY,
            },
            data: {
              prompt: "",
              imageUrl: dataUrl,
              autoFocus: false,
              updateNodeData,
              onDelete: deleteNode,
              onAddNext: addTextBelow,
              onRegenerate: regenerateImageNode,
              onDownload: (id: string) => {
                const n = rfGetNodes().find((x) => x.id === id);
                const url = (n?.data as any)?.imageUrl as string | undefined;
                if (url) void saveUrlAs(url);
              },
            },
          };
          setNodes((nds) => [...nds, node]);
        };
        reader.readAsDataURL(file);
      });
    },
    [
      screenToFlowPosition,
      setNodes,
      updateNodeData,
      deleteNode,
      addTextBelow,
      regenerateImageNode,
      rfGetNodes,
      saveUrlAs,
    ],
  );

  return (
    <div
      ref={reactFlowWrapper}
      style={{ width: "100vw", height: "100vh" }}
      className="relative"
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* Top-left Intro / Guide (collapsible) */}
      {guideOpen ? (
        <div className="pointer-events-auto absolute left-4 top-4 z-50 w-[360px] max-w-[90vw]">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-black/70 to-black/50 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset] backdrop-blur">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <span role="img" aria-label="banana" className="text-sm leading-none opacity-80">🍌</span>
                <h2 className="text-sm font-semibold tracking-wide leading-snug">
                  <span>Nano Banana</span>
                  <span className="block text-white/80">Create, remix, download</span>
                </h2>
              </div>
              <button
                aria-label="Collapse guide"
                className="inline-flex h-7 px-2 items-center justify-center rounded-md bg-white/10 text-white hover:bg-white/20"
                onClick={() => setGuideOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <Accordion type="single" collapsible defaultValue="g1" className="text-white/90">
              <AccordionItem value="g1">
                <AccordionTrigger className="text-sm">Getting Started</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-xs text-white/80">
                    <p>• Click the key icon (top-right) to add your Gemini API key. It’s stored only in memory for this session.</p>
                    <p>• Drag & drop image file(s) anywhere on the canvas to create image nodes.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="g2">
                <AccordionTrigger className="text-sm">Create & Generate</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-xs text-white/80">
                    <p>• Cmd/Ctrl+Click to add a Text node. Shift+Cmd/Ctrl+Click to add an empty Image node.</p>
                    <p>• Connect Image bottom → Text top/left/right. You can connect multiple images into one text.</p>
                    <p>• Type a prompt in the Text node and submit (button or Cmd/Ctrl+Enter) to generate a new image.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="g3">
                <AccordionTrigger className="text-sm">Features</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-xs text-white/80">
                    <p>• Create images from text prompts.</p>
                    <p>• Edit images with text: connect image → text, then prompt.</p>
                    <p>• Combine images: connect multiple images into one text.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      ) : (
        <div className="pointer-events-auto absolute left-4 top-4 z-50">
          <button
            onClick={() => setGuideOpen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3 h-9 text-xs text-white hover:bg-black/70 backdrop-blur"
          >
            <span role="img" aria-label="banana" className="text-sm leading-none">🍌</span>
            <span>Guide</span>
          </button>
        </div>
      )}
      {/* Top-right Gemini API key button (in-memory only) */}
      <div className="pointer-events-auto absolute right-4 top-4 z-50">
        <GeminiKeyButton />
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        nodedraghandle=".drag-handle"
        colorMode="dark"
      >
        <Controls />
        <MiniMap />
        <Background
          variant={BackgroundVariant.Dots}
          gap={16}
          size={2}
          color="#303030"
        />
      </ReactFlow>
    </div>
  );
}

export default function Home() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}
