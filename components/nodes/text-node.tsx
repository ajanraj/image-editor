"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ArrowRight, Trash2, Plus, X } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SLASH_COMMANDS, filterSlashCommands } from "@/lib/slash-commands";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type TextNodeData = {
  text?: string;
  title?: string;
  autoFocus?: boolean;
  updateNodeData: (
    id: string,
    data: { text?: string; title?: string; autoFocus?: boolean },
  ) => void;
  onDelete: (id: string) => void;
  onSubmit: (id: string, text: string) => void;
};

export const TextNode = memo(function TextNode({
  id,
  data,
}: NodeProps<TextNodeData>) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const inputAnchorRef = useRef<HTMLDivElement | null>(null);
  const [showSlash, setShowSlash] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [activeCmdId, setActiveCmdId] = useState<string | null>(null);
  const activeCmd = useMemo(() => SLASH_COMMANDS.find((c) => c.id === activeCmdId) || null, [activeCmdId]);
  const [cmdValues, setCmdValues] = useState<Record<string, string>>({});
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});
  const [customOptions, setCustomOptions] = useState<Record<string, string[]>>({});

  const autoresize = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    autoresize(textareaRef.current);
  }, [data.text, autoresize]);

  // Autofocus when inserted (delay until after pane click completes)
  const didFocusRef = useRef(false);
  useEffect(() => {
    if (!data.autoFocus || didFocusRef.current) return;
    const el = textareaRef.current;
    if (!el) return;
    const doFocus = () => {
      el.focus({ preventScroll: true });
      const len = el.value.length;
      try {
        el.setSelectionRange(len, len);
      } catch {}
      autoresize(el);
      didFocusRef.current = true;
    };
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(doFocus);
      return () => cancelAnimationFrame(raf2);
    });
    const t = setTimeout(doFocus, 50);
    return () => {
      cancelAnimationFrame(raf1);
      clearTimeout(t);
    };
  }, [data.autoFocus, autoresize]);

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      data.updateNodeData?.(id, { text: val });
      const startsWithSlash = val.startsWith("/") && !val.includes("\n") && val.length <= 64;
      setShowSlash(startsWithSlash);
      setSlashQuery(startsWithSlash ? val.slice(1) : "");
      autoresize(e.currentTarget);
    },
    [data, id, autoresize],
  );

  const submit = useCallback(() => {
    const text = (data.text ?? "").trim();
    if (text.length === 0) return;
    data.onSubmit?.(id, text);
  }, [data, id]);

  const onSelectSlash = useCallback((cmdId: string) => {
    setActiveCmdId(cmdId);
    const cmd = SLASH_COMMANDS.find((c) => c.id === cmdId);
    const init: Record<string, string> = {};
    if (cmd) {
      for (const f of cmd.fields) {
        if (f.options && f.options.length > 0 && (f.required || f.name === "gender" || f.name === "subject")) {
          init[f.name] = f.options[0];
        }
      }
    }
    setCmdValues(init);
    setShowSlash(false);
  }, []);

  const applySlashPrompt = useCallback(() => {
    if (!activeCmd) return;
    const prompt = activeCmd.buildPrompt(cmdValues);
    data.updateNodeData?.(id, { text: prompt });
    setActiveCmdId(null);
    // re-autosize to fit inserted text
    autoresize(textareaRef.current);
  }, [activeCmd, cmdValues, data, id, autoresize]);

  return (
    <div className="group relative w-[350px] select-none">
      {/* Connectors: top (target), left/right (sources) */}
      <Handle
        id="t"
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !bg-white !border !border-black/30 !z-20 opacity-0 transition-opacity duration-150 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
      />
      <Handle
        id="l"
        type="target"
        position={Position.Left}
        className="!h-3 !w-3 !bg-white !border !border-black/30 !z-20 !top-1/2 !-translate-y-1/2 opacity-0 transition-opacity duration-150 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
      />
      <Handle
        id="r"
        type="target"
        position={Position.Right}
        className="!h-3 !w-3 !bg-white !border !border-black/30 !z-20 !top-1/2 !-translate-y-1/2 opacity-0 transition-opacity duration-150 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
      />
      {/* Delete button */}
      <button
        aria-label="Delete"
        onClick={() => data.onDelete?.(id)}
        className="absolute -right-3 -top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-sm transition hover:bg-red-600"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {/* Card (also serves as drag handle) */}
      <div className="drag-handle rounded-2xl border border-white/10 bg-black/40 p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset] backdrop-blur">
        <div ref={inputAnchorRef} className="flex items-start gap-2 rounded-xl border border-white/10 bg-neutral-900/70 px-4 py-3 relative">
          <textarea
            ref={textareaRef}
            rows={1}
            value={data.text ?? ""}
            onChange={onChange}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                submit();
              }
              if (e.key === "Escape") {
                setShowSlash(false);
              }
            }}
            placeholder="Describe the image you want to generate..."
            autoFocus={data.autoFocus}
            className="nodrag nopan mr-2 max-h-[60vh] flex-1 resize-none overflow-hidden bg-transparent text-sm leading-6 text-white placeholder:text-white/60 focus:outline-none"
          />
          <button
            type="button"
            onClick={submit}
            className="nodrag nopan inline-flex h-9 w-9 items-center justify-center rounded-full bg-neutral-300/20 text-white transition hover:bg-neutral-300/30 self-start"
            aria-label="Submit"
            title="Submit"
          >
            <ArrowRight className="h-5 w-5" />
          </button>

          {/* Slash popover anchored to this container */}
          <Popover open={showSlash} onOpenChange={setShowSlash}>
            <PopoverTrigger asChild>
              <span className="absolute left-0 top-0 h-0 w-0" />
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-0" align="start" sideOffset={8}>
              <Command shouldFilter={false}>
                <CommandInput
                  value={slashQuery}
                  onValueChange={(v) => setSlashQuery(v)}
                  placeholder="Type a command…"
                />
                <CommandList>
                  <CommandEmpty>No commands.</CommandEmpty>
                  <CommandGroup heading="Commands">
                    {filterSlashCommands(slashQuery).map((cmd) => (
                      <CommandItem key={cmd.id} value={cmd.id} onSelect={() => onSelectSlash(cmd.id)}>
                        <span className="font-medium">/{cmd.id}</span>
                        <span className="ml-2 text-xs opacity-70">{cmd.title}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Slash params dialog */}
      <Dialog open={!!activeCmd} onOpenChange={(o) => !o && setActiveCmdId(null)}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>{activeCmd ? `${activeCmd.title} (/${activeCmd.id})` : ""}</DialogTitle>
          </DialogHeader>
          {/* Hair gender tabs */}
          {activeCmd?.id === "hair" && (
            <div className="mb-2">
              <Tabs
                value={(cmdValues["gender"] as string) || "women"}
                onValueChange={(v) => {
                  setCmdValues((s) => ({ ...s, gender: v, style: "", color: "", vibe: "" }));
                }}
              >
                <TabsList>
                  <TabsTrigger value="women">Women</TabsTrigger>
                  <TabsTrigger value="men">Men</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          )}

          {/* Presets */}
          {activeCmd?.presets && activeCmd.presets.length > 0 && (
            <div className="mb-3">
              <div className="mb-1 text-xs text-white/70">Presets</div>
              <div className="flex flex-wrap gap-1.5">
                {(activeCmd.id === "hair"
                  ? activeCmd.presets.filter((p) => (cmdValues["gender"] || "women") === (p.values["gender"] || "women"))
                  : activeCmd.presets
                ).map((p) => {
                  const isActive = Object.entries(p.values).every(([k, v]) => (cmdValues[k] ?? "") === v);
                  return (
                    <Button
                      key={p.label}
                      type="button"
                      size="sm"
                      variant={isActive ? "secondary" : "outline"}
                      onClick={() => setCmdValues(p.values)}
                    >
                      {p.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid gap-3 py-2">
            {activeCmd?.fields.map((f) => {
              // Dynamic variant options (e.g. gender for /hair)
              const genderVal = activeCmd?.id === "hair" ? (cmdValues["gender"] || "women") : undefined;
              const variantOptions = genderVal && activeCmd?.variants?.[genderVal]?.[f.name] ? activeCmd?.variants?.[genderVal]?.[f.name] : [];
              const baseOptions = f.options || [];
              const userOptions = customOptions[f.name] || [];
              // Merge and dedupe (case-insensitive). If variant options exist, prefer showing only variants + user for this field.
              const seen = new Set<string>();
              const addDedup = (arr: string[]) => arr.filter((o) => {
                const k = o.toLowerCase();
                if (seen.has(k)) return false;
                seen.add(k);
                return true;
              });
              const allOptions = variantOptions.length > 0
                ? [...addDedup(variantOptions), ...addDedup(userOptions)]
                : [...addDedup(baseOptions), ...addDedup(userOptions)];
              const hasOptions = allOptions.length > 0;
              const val = cmdValues[f.name] ?? "";
              const isSelected = (opt: string) => (val || "").toLowerCase() === opt.toLowerCase();
              return (
                <div key={f.name} className="grid gap-2">
                  <div className="text-xs text-white/80">{f.label}</div>
                  {hasOptions && (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {allOptions.map((opt) => {
                        const isUser = userOptions.some((o) => o.toLowerCase() === opt.toLowerCase());
                        return (
                          <div key={`opt-${opt}`} className="relative">
                            <Button
                              type="button"
                              size="sm"
                              variant={isSelected(opt) ? "secondary" : "outline"}
                              onClick={() => setCmdValues((s) => ({ ...s, [f.name]: opt }))}
                            >
                              {opt}
                            </Button>
                            {isUser && (
                              <button
                                type="button"
                                aria-label="Remove custom option"
                                className="absolute -right-2 -top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/90 text-black shadow hover:bg-white"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCustomOptions((prev) => {
                                    const next = { ...(prev || {}) };
                                    next[f.name] = (next[f.name] || []).filter((o) => o !== opt);
                                    return next;
                                  });
                                  setCmdValues((s) => {
                                    if (isSelected(opt)) {
                                      const clone = { ...s };
                                      delete clone[f.name];
                                      return clone;
                                    }
                                    return s;
                                  });
                                }}
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                      <div className="flex gap-1 items-center">
                        <Input
                          id={`sc-${id}-${f.name}`}
                          value={customInputs[f.name] ?? ""}
                          onChange={(e) => setCustomInputs((s) => ({ ...s, [f.name]: e.target.value }))}
                          placeholder={"Add your own"}
                          className="h-8 w-[140px]"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const v = (customInputs[f.name] ?? "").trim();
                              if (!v) return;
                              const exists = allOptions.some((o) => o.toLowerCase() === v.toLowerCase());
                              if (!exists) {
                                setCustomOptions((prev) => ({
                                  ...prev,
                                  [f.name]: [...(prev[f.name] || []), v],
                                }));
                              }
                              setCmdValues((s) => ({ ...s, [f.name]: v }));
                              setCustomInputs((s) => ({ ...s, [f.name]: "" }));
                            }
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant={"outline"}
                          onClick={() => {
                            const v = (customInputs[f.name] ?? "").trim();
                            if (!v) return;
                            const exists = allOptions.some((o) => o.toLowerCase() === v.toLowerCase());
                            if (!exists) {
                              setCustomOptions((prev) => ({
                                ...prev,
                                [f.name]: [...(prev[f.name] || []), v],
                              }));
                            }
                            setCmdValues((s) => ({ ...s, [f.name]: v }));
                            setCustomInputs((s) => ({ ...s, [f.name]: "" }));
                          }}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                  {!hasOptions && (
                    <Input
                      id={`sc-${id}-${f.name}`}
                      value={val}
                      onChange={(e) => setCmdValues((s) => ({ ...s, [f.name]: e.target.value }))}
                      placeholder={f.placeholder || "Add your own"}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setActiveCmdId(null)}>
              Cancel
            </Button>
            <Button onClick={applySlashPrompt}>Insert</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

export default TextNode;
