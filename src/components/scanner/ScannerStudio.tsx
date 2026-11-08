import React, { useState, useRef, useEffect } from 'react';
import {
  Scan,
  Camera,
  Upload,
  Copy,
  Check,
  QrCode,
  Barcode as BarcodeIcon,
  ExternalLink,
  Wifi,
  Globe,
  User,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface ScannerStudioProps {
  onSendToQr?: (code: string) => void;
  onSendToBarcode?: (code: string) => void;
}

interface ScanResult {
  rawValue: string;
  format: string;
  timestamp: number;
}

export const ScannerStudio: React.FC<ScannerStudioProps> = ({
  onSendToQr,
  onSendToBarcode,
}) => {
  const [activeMode, setActiveMode] = useState<'upload' | 'camera'>('upload');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Check if BarcodeDetector API exists
  const hasNativeBarcodeDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window;

  // Cleanup camera stream
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const startCamera = async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsScanning(true);
        scanVideoLoop();
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setErrorMsg(
        err.name === 'NotAllowedError'
          ? 'Camera permission was denied. Please allow camera access or use the Image Upload scanner.'
          : 'Unable to access camera on this device. Please use Image Upload mode.'
      );
    }
  };

  const scanVideoLoop = async () => {
    if (!videoRef.current || !isScanning) return;

    if (hasNativeBarcodeDetector) {
      try {
        // @ts-ignore
        const detector = new window.BarcodeDetector({
          formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'upc_a', 'itf', 'codabar'],
        });
        const barcodes = await detector.detect(videoRef.current);
        if (barcodes.length > 0) {
          const first = barcodes[0];
          setScanResult({
            rawValue: first.rawValue,
            format: first.format,
            timestamp: Date.now(),
          });
          stopCamera();
          return;
        }
      } catch (e) {
        // Continue loop
      }
    }

    animFrameRef.current = requestAnimationFrame(scanVideoLoop);
  };

  // Decode from an uploaded image file
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = async () => {
      URL.revokeObjectURL(url);
      await decodeImageElement(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      setErrorMsg('Failed to load image file.');
    };

    img.src = url;
  };

  const decodeImageElement = async (img: HTMLImageElement) => {
    if (hasNativeBarcodeDetector) {
      try {
        // @ts-ignore
        const detector = new window.BarcodeDetector({
          formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'upc_a', 'itf', 'codabar'],
        });
        const barcodes = await detector.detect(img);
        if (barcodes.length > 0) {
          const first = barcodes[0];
          setScanResult({
            rawValue: first.rawValue,
            format: first.format,
            timestamp: Date.now(),
          });
          return;
        } else {
          setErrorMsg('No QR code or barcode detected in this image. Try an image with higher contrast or closer framing.');
        }
      } catch (err: any) {
        console.error('Detector error:', err);
        setErrorMsg(`Decoding failed: ${err.message || 'Unsupported image'}`);
      }
    } else {
      // Fallback message when native API is missing in older browsers
      setErrorMsg(
        'Native BarcodeDetector API is not supported in this browser. Please use Chrome/Edge or Chromium-based browsers for live decoding.'
      );
    }
  };

  // Sample quick test
  const handleTestSample = () => {
    setScanResult({
      rawValue: 'https://omnicode.local/verify?id=OMNI-9942',
      format: 'qr_code',
      timestamp: Date.now(),
    });
  };

  const handleCopy = () => {
    if (!scanResult) return;
    navigator.clipboard.writeText(scanResult.rawValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Detect payload kind
  const parsedInfo = React.useMemo(() => {
    if (!scanResult) return null;
    const v = scanResult.rawValue;
    if (v.startsWith('http://') || v.startsWith('https://')) {
      return { type: 'URL', icon: Globe, label: 'Website Link', actionUrl: v };
    }
    if (v.startsWith('WIFI:')) {
      const ssid = v.match(/S:([^;]+)/)?.[1] || 'Unknown';
      const type = v.match(/T:([^;]+)/)?.[1] || 'WPA';
      return { type: 'WiFi', icon: Wifi, label: `Wi-Fi Network: "${ssid}" (${type})` };
    }
    if (v.startsWith('BEGIN:VCARD')) {
      const name = v.match(/FN:([^\n\r]+)/)?.[1] || 'Contact';
      return { type: 'vCard', icon: User, label: `Contact: ${name}` };
    }
    return { type: 'Text / Code', icon: Sparkles, label: 'Alphanumeric Code' };
  }, [scanResult]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start max-w-5xl mx-auto">
      {/* Scanner Control Box */}
      <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Scan className="w-5 h-5 text-blue-600" />
              Scanner & Validator
            </h2>
            <p className="text-xs text-slate-500">
              Verify and test your generated QR codes and Barcodes 100% locally
            </p>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
            <button
              onClick={() => {
                stopCamera();
                setActiveMode('upload');
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeMode === 'upload' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Upload Image
            </button>
            <button
              onClick={() => {
                setActiveMode('camera');
                startCamera();
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeMode === 'camera' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              Camera
            </button>
          </div>
        </div>

        {/* Upload Mode Area */}
        {activeMode === 'upload' && (
          <div className="space-y-4">
            <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/30 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all">
              <Upload className="w-10 h-10 text-slate-400 mb-2" />
              <span className="text-sm font-semibold text-slate-700">
                Click or Drag & Drop an image to scan
              </span>
              <span className="text-xs text-slate-400 mt-1">
                Supports PNG, JPG, SVG, WebP with QR or Barcode
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>Want to test the scanner immediately?</span>
              <button
                onClick={handleTestSample}
                className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Load Sample Test Scan
              </button>
            </div>
          </div>
        )}

        {/* Camera Mode Area */}
        {activeMode === 'camera' && (
          <div className="space-y-3">
            <div className="relative bg-black rounded-xl overflow-hidden aspect-video flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Scan Reticle */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-blue-500 rounded-lg relative">
                  <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-cyan-400"></div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-cyan-400"></div>
                  <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-cyan-400"></div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-cyan-400"></div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-500">
                {isScanning ? 'Aim viewfinder at QR code or barcode...' : 'Camera stopped'}
              </span>
              <button
                onClick={isScanning ? stopCamera : startCamera}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700"
              >
                {isScanning ? 'Stop Camera' : 'Start Camera'}
              </button>
            </div>
          </div>
        )}

        {/* Error notice if any */}
        {errorMsg && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-800">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Decoded Results Card */}
      <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
          <Check className="w-4 h-4 text-emerald-600" />
          Decoded Content
        </h3>

        {scanResult ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Symbology / Format
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                {scanResult.format.toUpperCase()}
              </span>
            </div>

            {/* Parsed type badge */}
            {parsedInfo && (
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-2.5">
                <parsedInfo.icon className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-xs font-medium text-blue-900">{parsedInfo.label}</span>
              </div>
            )}

            {/* Raw Decoded Text Box */}
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Raw Decoded Payload
              </label>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 break-all select-all">
                {scanResult.rawValue}
              </div>
            </div>

            {/* Actions on Scanned Result */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleCopy}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied to Clipboard!' : 'Copy Decoded Text'}
              </button>

              {parsedInfo?.actionUrl && (
                <a
                  href={parsedInfo.actionUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-all"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open Link in Browser
                </a>
              )}

              <div className="grid grid-cols-2 gap-2 pt-1">
                {onSendToQr && (
                  <button
                    onClick={() => onSendToQr(scanResult.rawValue)}
                    className="flex items-center justify-center gap-1.5 py-2 text-xs font-medium border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg"
                  >
                    <QrCode className="w-3.5 h-3.5 text-blue-600" />
                    Send to QR
                  </button>
                )}

                {onSendToBarcode && (
                  <button
                    onClick={() => onSendToBarcode(scanResult.rawValue)}
                    className="flex items-center justify-center gap-1.5 py-2 text-xs font-medium border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg"
                  >
                    <BarcodeIcon className="w-3.5 h-3.5 text-indigo-600" />
                    Send to Barcode
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Scan className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-xs">No code scanned yet.</p>
            <p className="text-[11px] text-slate-400">
              Upload an image or use the camera to see decoded results here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
