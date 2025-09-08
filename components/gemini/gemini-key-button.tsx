"use client";

import * as React from "react";
import { Key } from "lucide-react";
import { useGeminiKey } from "@/lib/gemini-key-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function GeminiKeyButton() {
  const { apiKey, setApiKey } = useGeminiKey();
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");

  React.useEffect(() => {
    // Reset draft value on open for security.
    if (open) setValue("");
  }, [open]);

  // If a key is cleared while dialog is open, start with an empty input.
  React.useEffect(() => {
    if (!apiKey) setValue("");
  }, [apiKey]);

  const onSave = () => {
    const v = value.trim();
    setApiKey(v.length ? v : null);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="relative h-10 w-10 rounded-full"
              aria-label={apiKey ? "Gemini API key set" : "Set Gemini API key"}
            >
              <Key className="h-5 w-5" />
              {apiKey ? (
                <span
                  aria-hidden
                  className="absolute -right-0.5 -top-0.5 inline-block h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-background"
                />
              ) : null}
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent sideOffset={6}>
          {apiKey ? "Gemini key set (memory only)" : "Set Gemini API key"}
        </TooltipContent>
      </Tooltip>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Gemini API Key</DialogTitle>
          <DialogDescription>
            Enter your Google Gemini API key. It is stored only in memory and
            will be lost when you reload this page.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 py-2">
          <Label htmlFor="gemini-key">API Key</Label>
          {apiKey ? (
            <Input
              id="gemini-key"
              type="password"
              readOnly
              value="********************************"
              className="select-none"
              aria-readonly
            />
          ) : (
            <Input
              id="gemini-key"
              placeholder="AIza... or similar"
              type="password"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoFocus
            />
          )}
          {apiKey ? (
            <p className="text-sm text-muted-foreground">
              A Gemini API key is set for this session. You can Clear to remove
              it.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              No key set yet. Paste your key to enable Gemini features.
            </p>
          )}
          <p className="mt-1 text-xs text-foreground/80">
            Note: The API key is saved only in memory and will be lost on site
            reload.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          {apiKey ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setApiKey(null)}
            >
              Clear
            </Button>
          ) : (
            <Button
              type="button"
              onClick={onSave}
              disabled={value.trim().length === 0}
            >
              Save
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
