"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGeminiKey } from "@/lib/gemini-key-context";

const STORAGE_KEY = "nb_onboarding_dismissed_v1";

export default function Onboarding() {
  const [open, setOpen] = React.useState(false);
  const { apiKey, setApiKey } = useGeminiKey();
  const [draftKey, setDraftKey] = React.useState("");

  // Detect platform for shortcut icons
  const isMac = React.useMemo(() => {
    if (typeof navigator === "undefined") return false;
    const p = navigator.platform || "";
    const ua = (navigator as any).userAgentData?.platform || navigator.userAgent || "";
    return /Mac|iPhone|iPad|iPod/i.test(p) || /Mac|iPhone|iPad|iPod/i.test(ua);
  }, []);
  const cmd = isMac ? "⌘" : "Ctrl";
  const shift = isMac ? "⇧" : "Shift";

  React.useEffect(() => {
    try {
      const dismissed = typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY);
      if (!dismissed) setOpen(true);
    } catch {
      setOpen(true);
    }
  }, []);

  const close = React.useCallback(() => setOpen(false), []);
  const dontShowAgain = React.useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setOpen(false);
  }, []);

  const saveKey = React.useCallback(() => {
    const v = draftKey.trim();
    setApiKey(v.length ? v : null);
    setDraftKey("");
  }, [draftKey, setApiKey]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <div className="mx-auto grid place-items-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-yellow-400/20 ring-1 ring-white/10">
              <span role="img" aria-label="banana" className="text-2xl">🍌</span>
            </div>
          </div>
          <DialogTitle className="text-center">Welcome to Nano Banana</DialogTitle>
          <DialogDescription className="text-center">
            Create, remix, download — start by typing a prompt or dropping an image.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 text-sm">
          <div className="rounded-md border border-white/10 bg-black/30 p-3">
            <div className="font-medium text-white mb-1">How it works</div>
            <ul className="list-disc pl-5 space-y-1 text-white/80">
              <li>Drag & drop image file(s) anywhere to create Image cards.</li>
              <li>
                <span className="inline-block rounded bg-white/10 px-1.5 py-0.5">{cmd}</span>
                +Click to add a Text card.
              </li>
              <li>
                <span className="inline-block rounded bg-white/10 px-1.5 py-0.5">{shift}</span>
                +<span className="inline-block rounded bg-white/10 px-1.5 py-0.5">{cmd}</span>
                +Click to add an Image card.
              </li>
              <li>Connect Image → Text, then prompt to edit or combine images.</li>
              <li>Press <span className="inline-block rounded bg-white/10 px-1.5 py-0.5">{cmd}</span>+Enter or click the arrow to generate.</li>
              <li>Use the download button on images to save.</li>
            </ul>
          </div>
          <div className="rounded-md border border-white/10 bg-black/30 p-3">
            <div className="font-medium text-white mb-1">Slash commands</div>
            <p className="text-white/80 mb-2">Type <span className="inline-block rounded bg-white/10 px-1.5 py-0.5">/</span> in a Text card to access powerful presets:</p>
            <ul className="list-disc pl-5 space-y-1 text-white/80">
              <li><span className="text-yellow-400">/film</span> - Apply Fujifilm film simulations</li>
              <li><span className="text-yellow-400">/retouch</span> - Professional skin, eyes, teeth retouching</li>
              <li><span className="text-yellow-400">/makeup</span> - Add or adjust makeup styles</li>
              <li><span className="text-yellow-400">/remove</span> - Remove people, objects from scenes</li>
              <li><span className="text-yellow-400">/weather</span> - Change time, weather, season</li>
              <li><span className="text-yellow-400">/hair</span> - Edit hairstyle and color</li>
              <li><span className="text-yellow-400">/outfit</span> - Change clothing styles</li>
              <li><span className="text-yellow-400">/background</span> - Replace backgrounds</li>
              <li><span className="text-yellow-400">/style</span> - Apply color grading & styles</li>
            </ul>
          </div>
          <div className="rounded-md border border-white/10 bg-black/30 p-3">
            <div className="font-medium text-white mb-1">Gemini key</div>
            <p className="text-white/80 mb-2">Add your Google Gemini API key here. It’s stored only in memory for this session.</p>
            {apiKey ? (
              <div className="flex items-center gap-2">
                <Input type="password" value="********************************" readOnly className="select-none" aria-readonly />
                <Button variant="secondary" onClick={() => setApiKey(null)}>Clear</Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Label htmlFor="nb-gemini-key" className="sr-only">Gemini API Key</Label>
                <Input
                  id="nb-gemini-key"
                  placeholder="AIza..."
                  type="password"
                  value={draftKey}
                  onChange={(e) => setDraftKey(e.target.value)}
                />
                <Button onClick={saveKey} disabled={draftKey.trim().length === 0}>Save</Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="secondary" onClick={dontShowAgain}>Don’t show again</Button>
          <Button onClick={close}>Get started</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
