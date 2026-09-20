"use client";

import * as React from "react";
import { TOOLS } from "@/lib/tools-data";
import { ToolPageShell } from "@/components/shared/ToolPageShell";
import { FileDropzone } from "@/components/shared/FileDropzone";
import { ProcessingOverlay } from "@/components/shared/ProcessingOverlay";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { extractTextFromPdf } from "@/lib/pdf/pdf-utils";
import { formatBytes } from "@/lib/utils";
import { addRecentFile } from "@/lib/storage/db";
import { Volume2, Play, Pause, Square, VolumeX } from "lucide-react";

const pdfToAudioTool = TOOLS.find((t) => t.id === "pdf-to-audio")!;

export default function PdfToAudioPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [extractedText, setExtractedText] = React.useState<string | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);

  // Speech Synthesis states
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);
  const [rate, setRate] = React.useState(1.0);
  const [pitch, setPitch] = React.useState(1.0);
  const [voices, setVoices] = React.useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = React.useState<string>("");

  React.useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const updateVoices = () => {
        const available = window.speechSynthesis.getVoices();
        setVoices(available);
        if (available.length > 0 && !selectedVoice) {
          setSelectedVoice(available[0].name);
        }
      };
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, [selectedVoice]);

  const handleFileSelected = (files: File[]) => {
    if (files.length > 0) setFile(files[0]);
  };

  const handleExtractAndRead = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(30);

    try {
      setProgress(60);
      const text = await extractTextFromPdf(file);
      setProgress(90);

      setExtractedText(text);

      await addRecentFile({
        name: file.name,
        size: file.size,
        type: file.type,
        toolSlug: "pdf-to-audio",
        resultSize: text.length,
      });
      setProgress(100);
    } catch (err: unknown) {
      alert(`Failed to extract text for audio reading: ${(err as Error).message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlaySpeech = () => {
    if (!extractedText || typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Speech Synthesis is not supported in this browser.");
      return;
    }

    if (isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(extractedText);
    utterance.rate = rate;
    utterance.pitch = pitch;

    if (selectedVoice) {
      const v = voices.find((voice) => voice.name === selectedVoice);
      if (v) utterance.voice = v;
    }

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsPaused(false);
  };

  const handlePauseSpeech = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.pause();
      setIsPaused(true);
      setIsPlaying(false);
    }
  };

  const handleStopSpeech = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsPaused(false);
    }
  };

  const handleReset = () => {
    handleStopSpeech();
    setFile(null);
    setExtractedText(null);
    setProgress(0);
  };

  return (
    <ToolPageShell tool={pdfToAudioTool}>
      {extractedText !== null ? (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
            <div className="flex items-center space-x-3">
              <Volume2 className="h-6 w-6 text-[var(--accent)]" />
              <div>
                <h3 className="font-semibold text-[var(--foreground)]">Browser Speech Reader ({file?.name})</h3>
                <p className="text-xs text-[var(--muted-foreground)]">100% Client-side browser Speech Synthesis</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Load Another PDF
            </Button>
          </div>

          {/* Player Controls */}
          <div className="flex flex-wrap items-center justify-center gap-4 bg-[var(--card)] p-6 rounded-md border border-[var(--border)]">
            {!isPlaying ? (
              <Button variant="primary" size="lg" onClick={handlePlaySpeech} className="space-x-2">
                <Play className="h-5 w-5" />
                <span>{isPaused ? "Resume Reading" : "Read Aloud"}</span>
              </Button>
            ) : (
              <Button variant="outline" size="lg" onClick={handlePauseSpeech} className="space-x-2">
                <Pause className="h-5 w-5" />
                <span>Pause</span>
              </Button>
            )}

            <Button variant="outline" size="lg" onClick={handleStopSpeech} disabled={!isPlaying && !isPaused} className="space-x-2">
              <Square className="h-5 w-5" />
              <span>Stop</span>
            </Button>
          </div>

          {/* Voice Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-[var(--border)] pt-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-[var(--foreground)]">Select Voice</label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
              >
                {voices.map((v) => (
                  <option key={v.name} value={v.name}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-[var(--foreground)]">Speed Rate ({rate}x)</label>
              <input
                type="range"
                min={0.5}
                max={2.0}
                step={0.1}
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-[var(--foreground)]">Pitch ({pitch})</label>
              <input
                type="range"
                min={0.5}
                max={1.5}
                step={0.1}
                value={pitch}
                onChange={(e) => setPitch(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--muted-foreground)]">Extracted Text Content</label>
            <textarea
              readOnly
              value={extractedText}
              className="w-full h-48 p-4 rounded-md bg-[var(--background)] border border-[var(--border)] text-xs font-mono text-[var(--foreground)] resize-y focus:outline-none"
            />
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {!file ? (
            <FileDropzone
              onFilesSelected={handleFileSelected}
              accept={[".pdf", "application/pdf"]}
              label="Drag & drop PDF to read text aloud"
              helperText="Listen to PDF contents using native browser Speech Synthesis (no cloud AI API)."
            />
          ) : (
            <Card className="p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                <div className="flex items-center space-x-3">
                  <Volume2 className="h-6 w-6 text-[var(--accent)]" />
                  <div>
                    <h3 className="font-semibold text-[var(--foreground)]">{file.name}</h3>
                    <p className="text-xs text-[var(--muted-foreground)]">{formatBytes(file.size)}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setFile(null)}>
                  Change File
                </Button>
              </div>

              <div className="pt-2 flex justify-end">
                <Button variant="primary" size="lg" onClick={handleExtractAndRead}>
                  Extract Text & Launch Audio Player
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      <ProcessingOverlay
        isOpen={isProcessing}
        progress={progress}
        title="Preparing Audio Reader..."
        statusText="Extracting text layers and initializing speech engine..."
      />
    </ToolPageShell>
  );
}
