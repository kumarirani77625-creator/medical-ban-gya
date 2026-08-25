import React, { useEffect, useRef, useState } from "react";
import { Camera, X, RefreshCw, Check, AlertCircle, Sparkles } from "lucide-react";
import { Language } from "../types.ts";

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (base64Image: string) => void;
  language: Language;
  highContrast: boolean;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  language,
  highContrast,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedImage(null);
      setCameraError(null);
      return;
    }

    startCamera(facingMode);

    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async (mode: "environment" | "user") => {
    setIsInitializing(true);
    setCameraError(null);
    stopCamera();

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          language === "hi"
            ? "आपके ब्राउज़र में कैमरा सुविधा उपलब्ध नहीं है।"
            : "Camera API is not supported in this browser."
        );
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      let errorMsg =
        language === "hi"
          ? "कैमरा शुरू नहीं हो सका। कृपया कैमरा अनुमति (Permission) की जाँच करें।"
          : "Could not access camera. Please allow camera permissions in your browser.";

      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errorMsg =
          language === "hi"
            ? "कैमरा अनुमति अस्वीकार कर दी गई है। कृपया ब्राउज़र सेटिंग्स में जाकर कैमरा अनुमति चालू करें।"
            : "Camera permission was denied. Please allow camera access in browser settings.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errorMsg =
          language === "hi"
            ? "कोई कैमरा उपकरण नहीं मिला।"
            : "No camera device was detected on your device.";
      } else if (
        err.name === "NotReadableError" ||
        err.name === "TrackStartError" ||
        String(err.message || "").toLowerCase().includes("in use")
      ) {
        errorMsg =
          language === "hi"
            ? "कैमरा किसी अन्य ऐप (जैसे Zoom, Teams, या अन्य टैब) द्वारा उपयोग में है। कृपया अन्य ऐप्स बंद करें या नीचे 'गैलरी / फ़ाइल से चुनें' का उपयोग करें।"
            : "Camera is currently in use by another application or browser tab. Please close other camera apps, or use the file upload / photo selector below.";
      }
      setCameraError(errorMsg);
    } finally {
      setIsInitializing(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          // ignore
        }
      });
      setStream(null);
    }
    if (videoRef.current) {
      try {
        videoRef.current.srcObject = null;
      } catch (e) {
        // ignore
      }
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera(facingMode);
  };

  const confirmPhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      onClose();
    }
  };

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-6 backdrop-blur-sm">
      <div
        className={`w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border flex flex-col max-h-[95vh] ${
          highContrast
            ? "bg-black border-yellow-400 text-yellow-300"
            : "bg-slate-900 text-white border-slate-700"
        }`}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">
                {language === "hi" ? "दवा की फोटो लें" : "Take Medicine Photo"}
              </h3>
              <p className="text-xs text-slate-300 font-medium">
                {language === "hi"
                  ? "दवा के पत्ते को रोशनी में साफ़ दिखाएँ"
                  : "Hold medicine label clearly under good lighting"}
              </p>
            </div>
          </div>

          <button
            id="btn-close-camera-modal"
            onClick={onClose}
            className="p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            aria-label="Close Camera"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="relative flex-1 bg-black flex items-center justify-center min-h-[300px] sm:min-h-[400px] overflow-hidden">
          {cameraError ? (
            <div className="p-6 text-center max-w-md space-y-4">
              <AlertCircle className="w-16 h-16 text-amber-400 mx-auto" />
              <h4 className="text-lg font-bold text-amber-300">
                {language === "hi" ? "कैमरा उपलब्ध नहीं है" : "Camera Access Notice"}
              </h4>
              <p className="text-sm text-slate-300 font-medium leading-relaxed">{cameraError}</p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => startCamera(facingMode)}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xs inline-flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>{language === "hi" ? "पुनः प्रयास करें" : "Retry Camera"}</span>
                </button>

                <label
                  htmlFor="medicine-file-input"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm shadow-xs inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{language === "hi" ? "गैलरी से फोटो चुनें" : "Upload File Instead"}</span>
                </label>
              </div>
            </div>
          ) : isInitializing ? (
            <div className="text-center space-y-3 p-6">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm font-medium text-slate-300">
                {language === "hi" ? "कैमरा चालू हो रहा है..." : "Starting camera..."}
              </p>
            </div>
          ) : capturedImage ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={capturedImage}
                alt="Captured medicine preview"
                className="max-h-[460px] w-auto object-contain rounded-xl"
              />
              <div className="absolute top-4 left-4 bg-green-700/90 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md">
                <Check className="w-4 h-4" />
                <span>{language === "hi" ? "फोटो तैयार है" : "Photo Captured"}</span>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain max-h-[460px]"
              />
              {/* Aiming Guide Overlay */}
              <div className="absolute inset-8 sm:inset-12 border-2 border-dashed border-blue-400/70 rounded-2xl pointer-events-none flex flex-col justify-between p-4">
                <span className="text-xs bg-black/70 text-blue-200 px-2.5 py-1 rounded-md self-center font-bold">
                  {language === "hi" ? "दवा को इस बॉक्स के बीच में रखें" : "Position medicine name inside this box"}
                </span>
                <span className="text-2xs text-slate-400 text-center font-bold tracking-wider uppercase">CareMitra AI Guide</span>
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        {/* Action Controls Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
          {!capturedImage && !cameraError && (
            <>
              <button
                id="btn-switch-camera"
                onClick={toggleFacingMode}
                className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm flex items-center gap-2 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{language === "hi" ? "कैमरा बदलें" : "Flip Camera"}</span>
              </button>

              <button
                id="btn-capture-camera"
                onClick={capturePhoto}
                className="flex-1 max-w-xs mx-auto px-8 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-lg sm:text-xl flex items-center justify-center gap-3 shadow-xs active:scale-95 transition-transform"
              >
                <Camera className="w-6 h-6" />
                <span>{language === "hi" ? "फोटो खींचें" : "Capture Photo"}</span>
              </button>

              <button
                id="btn-cancel-camera"
                onClick={onClose}
                className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-all"
              >
                {language === "hi" ? "रद्द करें" : "Cancel"}
              </button>
            </>
          )}

          {capturedImage && (
            <div className="w-full flex items-center justify-between gap-4">
              <button
                id="btn-retake-photo"
                onClick={retakePhoto}
                className="flex-1 px-6 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-base flex items-center justify-center gap-2 transition-all"
              >
                <RefreshCw className="w-5 h-5" />
                <span>{language === "hi" ? "दोबारा फोटो लें" : "Retake Photo"}</span>
              </button>

              <button
                id="btn-confirm-use-photo"
                onClick={confirmPhoto}
                className="flex-1 px-6 py-3.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-extrabold text-lg flex items-center justify-center gap-2 shadow-xs transition-all"
              >
                <Check className="w-6 h-6" />
                <span>{language === "hi" ? "इस फोटो की जाँच करें" : "Use This Photo"}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
