import { useEffect, useRef, useState } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert, Video, VideoOff } from "lucide-react";
import { toast } from "sonner";

// COCO-SSD classes treated as "digital gadgets" — if any of these are visible
// in the candidate's webcam feed, we trigger the warning + auto-submit flow.
const GADGET_CLASSES = new Set<string>([
  "cell phone",
  "laptop",
  "tv",
  "remote",
  "keyboard",
  "mouse",
  "tablet",
  "book", // often misclassified for phones/notes — treat as suspicious
]);

const GRACE_SECONDS = 5;

interface WebcamProctorProps {
  active: boolean;
  onAutoSubmit: () => void;
}

export default function WebcamProctor({ active, onAutoSubmit }: WebcamProctorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const modelRef = useRef<cocoSsd.ObjectDetection | null>(null);
  const detectIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submittedRef = useRef(false);
  const warnedOnceRef = useRef(false);

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [detectedGadget, setDetectedGadget] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(GRACE_SECONDS);

  // Initialize camera + model
  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: "user" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setCameraReady(true);

        const model = await cocoSsd.load();
        if (cancelled) return;
        modelRef.current = model;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unable to access webcam";
        setCameraError(msg);
        toast.error("Webcam required: " + msg);
      }
    })();

    return () => {
      cancelled = true;
      if (detectIntervalRef.current) clearInterval(detectIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      modelRef.current = null;
    };
  }, [active]);

  // Run detection loop
  useEffect(() => {
    if (!active || !cameraReady) return;

    const runDetection = async () => {
      if (!modelRef.current || !videoRef.current || videoRef.current.readyState < 2) return;
      if (submittedRef.current) return;
      try {
        const preds = await modelRef.current.detect(videoRef.current);
        const gadget = preds.find((p) => p.score > 0.55 && GADGET_CLASSES.has(p.class));
        if (gadget) {
          // Second offense: already warned once and cleared — submit immediately.
          if (warnedOnceRef.current && !detectedGadgetRef.current) {
            if (!submittedRef.current) {
              submittedRef.current = true;
              toast.error(`🚫 Gadget detected again (${gadget.class}). Auto-submitting your test.`);
              onAutoSubmit();
            }
            return;
          }
          setDetectedGadget((curr) => curr ?? gadget.class);
        } else {
          setDetectedGadget(null);
        }
      } catch {
        // ignore detection errors
      }
    };

    detectIntervalRef.current = setInterval(runDetection, 1500);
    return () => {
      if (detectIntervalRef.current) clearInterval(detectIntervalRef.current);
    };
  }, [active, cameraReady, onAutoSubmit]);

  // Track latest detectedGadget in a ref so detection loop can read it
  const detectedGadgetRef = useRef<string | null>(null);
  useEffect(() => {
    detectedGadgetRef.current = detectedGadget;
  }, [detectedGadget]);

  // Countdown when gadget detected (first offense only)
  useEffect(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    if (!detectedGadget) {
      setCountdown(GRACE_SECONDS);
      return;
    }

    // Mark that the candidate has now received their single warning.
    warnedOnceRef.current = true;
    toast.warning(`⚠️ Digital gadget detected (${detectedGadget}). Remove it within ${GRACE_SECONDS} seconds — next time the test will auto-submit immediately.`);
    setCountdown(GRACE_SECONDS);

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          if (!submittedRef.current) {
            submittedRef.current = true;
            toast.error("🚫 Gadget not removed in time. Auto-submitting your test.");
            onAutoSubmit();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [detectedGadget, onAutoSubmit]);

  if (!active) return null;

  return (
    <>
      {/* Floating webcam preview (bottom-right) */}
      <div className="fixed bottom-4 right-4 z-[60] w-48 overflow-hidden rounded-lg border-2 border-primary/40 bg-black shadow-lg">
        <div className="flex items-center justify-between bg-background/80 px-2 py-1 text-xs">
          <span className="flex items-center gap-1 font-medium">
            {cameraReady ? <Video className="h-3 w-3 text-green-500" /> : <VideoOff className="h-3 w-3 text-destructive" />}
            Proctor
          </span>
          {cameraReady && <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />}
        </div>
        <video ref={videoRef} muted playsInline className="h-32 w-full object-cover" />
        {cameraError && (
          <div className="bg-destructive/10 p-2 text-[10px] text-destructive">{cameraError}</div>
        )}
      </div>

      {/* Gadget detected warning banner */}
      {detectedGadget && (
        <div className="fixed left-1/2 top-4 z-[60] w-full max-w-xl -translate-x-1/2 px-4">
          <Alert variant="destructive" className="border-2 shadow-2xl">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Digital Gadget Detected: {detectedGadget}</AlertTitle>
            <AlertDescription>
              Please remove the gadget from view within <strong>{countdown}s</strong> or your test will be auto-submitted.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </>
  );
}
