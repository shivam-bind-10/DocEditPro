"use client";

import * as React from "react";
import { TOOLS } from "@/lib/tools-data";
import { ToolPageShell } from "@/components/shared/ToolPageShell";
import { ProcessingOverlay } from "@/components/shared/ProcessingOverlay";
import { ResultDownloadCard } from "@/components/shared/ResultDownloadCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { convertHtmlToPdf } from "@/lib/convert/html-markdown-utils";
import { addRecentFile } from "@/lib/storage/db";
import { Mic, MicOff, AlertCircle } from "lucide-react";

const audioToPdfTool = TOOLS.find((t) => t.id === "audio-to-pdf")!;

export default function AudioToPdfPage() {
  const [isListening, setIsListening] = React.useState(false);
  const [transcript, setTranscript] = React.useState("");
  const [isSupported, setIsSupported] = React.useState(true);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [resultBytes, setResultBytes] = React.useState<Uint8Array | null>(null);
  const [outFilename, setOutFilename] = React.useState<string>("speech-transcript.pdf");

  // SpeechRecognition ref
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = React.useRef<any>(null);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setIsSupported(false);
      } else {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-US";

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rec.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript + " ";
          }
          setTranscript(currentTranscript);
        };

        rec.onerror = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleCreatePdf = async () => {
    if (!transcript || transcript.trim().length === 0) {
      alert("Please record or speak text before generating PDF.");
      return;
    }

    setIsProcessing(true);
    setProgress(30);

    try {
      const htmlContent = `
        <div style="padding: 24px; font-family: sans-serif;">
          <h1>Audio Speech Transcript</h1>
          <p style="color: #6b7280; font-size: 12px;">Recorded on ${new Date().toLocaleString()}</p>
          <hr style="margin: 16px 0; border: none; border-top: 1px solid #e5e7eb;"/>
          <p style="font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${transcript.trim()}</p>
        </div>
      `;

      setProgress(60);
      const pdfBytes = await convertHtmlToPdf(htmlContent);
      setProgress(90);

      setResultBytes(pdfBytes);
      setOutFilename(`speech-transcript-${Date.now()}.pdf`);

      await addRecentFile({
        name: "speech-transcript.pdf",
        size: pdfBytes.length,
        type: "application/pdf",
        toolSlug: "audio-to-pdf",
        resultSize: pdfBytes.length,
      });
      setProgress(100);
    } catch (err: unknown) {
      alert(`Failed to generate PDF from transcript: ${(err as Error).message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setResultBytes(null);
    setTranscript("");
    setIsListening(false);
    setProgress(0);
  };

  return (
    <ToolPageShell tool={audioToPdfTool}>
      {resultBytes ? (
        <ResultDownloadCard
          filename={outFilename}
          blob={resultBytes}
          onReset={handleReset}
          actionTitle="Audio Transcript Exported to PDF!"
        />
      ) : (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
            <div className="flex items-center space-x-3">
              <Mic className="h-6 w-6 text-[var(--accent)]" />
              <div>
                <h3 className="font-semibold text-[var(--foreground)]">Audio Speech to PDF</h3>
                <p className="text-xs text-[var(--muted-foreground)]">Record dictation directly into a structured PDF document.</p>
              </div>
            </div>
          </div>

          {!isSupported && (
            <div className="p-4 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center space-x-3 text-xs">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>
                Web Speech Recognition API is not supported in this browser. Please use Google Chrome, Edge, or Safari to use microphone dictation.
              </span>
            </div>
          )}

          {/* Recording Microphone Controls */}
          <div className="flex flex-col items-center justify-center p-8 rounded-md bg-[var(--card)] border border-[var(--border)] space-y-4">
            <button
              onClick={toggleListening}
              disabled={!isSupported}
              className={`h-20 w-20 rounded-full flex items-center justify-center transition-all ${
                isListening
                  ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                  : "bg-[var(--accent)] hover:opacity-90 text-white"
              }`}
            >
              {isListening ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
            </button>
            <p className="text-sm font-medium text-[var(--foreground)]">
              {isListening ? "Listening... Speak into your microphone" : "Click microphone to start dictating"}
            </p>
          </div>

          {/* Transcript Box */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--foreground)]">Live Speech Transcript</label>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Your live dictation text will appear here..."
              className="w-full h-48 p-4 rounded-md bg-[var(--background)] border border-[var(--border)] text-sm font-mono text-[var(--foreground)] resize-y focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button variant="primary" size="lg" onClick={handleCreatePdf} disabled={!transcript.trim()}>
              Export Transcript as PDF
            </Button>
          </div>
        </Card>
      )}

      <ProcessingOverlay
        isOpen={isProcessing}
        progress={progress}
        title="Generating Transcript PDF..."
        statusText="Formatting dictation text into PDF layout..."
      />
    </ToolPageShell>
  );
}
