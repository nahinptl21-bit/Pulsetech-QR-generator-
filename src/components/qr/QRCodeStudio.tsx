import React, { useState, useMemo } from 'react';
import {
  Globe,
  FileText,
  Wifi,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Copy,
  Download,
  Printer,
  Bookmark,
  Check,
  Layers,
  Sparkles,
  Sliders,
  Palette,
  Image as ImageIcon,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { renderQRCodeToSVG, QRDesignOptions, DotStyle, CornerFrameStyle, CornerDotStyle } from '../../lib/qr/render';
import { ErrorCorrectionLevel } from '../../lib/qr/qrcode';
import { downloadSvg, downloadPng, copyPngToClipboard } from '../../lib/export';
import { saveItem } from '../../lib/storage';

export type QRPreset =
  | 'url'
  | 'text'
  | 'wifi'
  | 'vcard'
  | 'email'
  | 'sms'
  | 'geo'
  | 'event'
  | 'payment';

interface QRCodeStudioProps {
  onSaveSuccess?: () => void;
  onSendToLabels?: (code: string, title?: string) => void;
  initialPayload?: string;
  initialTitle?: string;
}

export const QRCodeStudio: React.FC<QRCodeStudioProps> = ({
  onSaveSuccess,
  onSendToLabels,
  initialPayload,
  initialTitle,
}) => {
  // Preset type
  const [activePreset, setActivePreset] = useState<QRPreset>('url');

  // URL state
  const [url, setUrl] = useState(initialPayload || 'https://omnicode.local');

  // Text state
  const [rawText, setRawText] = useState('Welcome to OmniCode Zero-3rd-Party Generator');

  // WiFi state
  const [wifiSsid, setWifiSsid] = useState('Office_WiFi_5G');
  const [wifiPassword, setWifiPassword] = useState('SecurePass2026!');
  const [wifiType, setWifiType] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');
  const [wifiHidden, setWifiHidden] = useState(false);

  // vCard state
  const [vcardFirst, setVcardFirst] = useState('Alex');
  const [vcardLast, setVcardLast] = useState('Morgan');
  const [vcardOrg, setVcardOrg] = useState('Apex Innovations');
  const [vcardTitle, setVcardTitle] = useState('Product Director');
  const [vcardPhone, setVcardPhone] = useState('+1 (555) 234-5678');
  const [vcardEmail, setVcardEmail] = useState('alex.morgan@example.com');
  const [vcardWebsite, setVcardWebsite] = useState('https://example.com');

  // Email state
  const [emailTo, setEmailTo] = useState('support@example.com');
  const [emailSubject, setEmailSubject] = useState('Inquiry regarding services');
  const [emailBody, setEmailBody] = useState('Hello,\nI would like more information.');

  // Phone / SMS state
  const [phoneRecipient, setPhoneRecipient] = useState('+15551234567');
  const [smsMessage, setSmsMessage] = useState('Hi, I am interested in your listing!');

  // Geo state
  const [geoLat, setGeoLat] = useState('37.7749');
  const [geoLng, setGeoLng] = useState('-122.4194');

  // Event state
  const [eventTitle, setEventTitle] = useState('Tech Summit 2026');
  const [eventLocation, setEventLocation] = useState('Convention Center Hall A');
  const [eventStart, setEventStart] = useState('2026-11-15T09:00');
  const [eventEnd, setEventEnd] = useState('2026-11-15T17:00');

  // Payment state
  const [payeeVpa, setPayeeVpa] = useState('merchant@upi');
  const [payeeName, setPayeeName] = useState('Artisan Market');
  const [payAmount, setPayAmount] = useState('25.00');

  // Design Customization State
  const [ecLevel, setEcLevel] = useState<ErrorCorrectionLevel>('M');
  const [dotStyle, setDotStyle] = useState<DotStyle>('rounded');
  const [cornerFrameStyle, setCornerFrameStyle] = useState<CornerFrameStyle>('rounded');
  const [cornerDotStyle, setCornerDotStyle] = useState<CornerDotStyle>('circle');

  const [fgColor, setFgColor] = useState('#0f172a');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [useGradient, setUseGradient] = useState(false);
  const [gradientEnd, setGradientEnd] = useState('#2563eb');
  const [gradientAngle, setGradientAngle] = useState(45);
  const [customCornerColor, setCustomCornerColor] = useState(false);
  const [cornerColor, setCornerColor] = useState('#1d4ed8');

  // Logo / Icon State
  const [selectedLogo, setSelectedLogo] = useState<string>('');
  const [logoSizePercent, setLogoSizePercent] = useState<number>(18);

  // Banner State
  const [bannerPosition, setBannerPosition] = useState<'none' | 'bottom' | 'top'>('bottom');
  const [bannerText, setBannerText] = useState('SCAN ME');
  const [bannerSubtext, setBannerSubtext] = useState('Instant Mobile Access');
  const [bannerBgColor, setBannerBgColor] = useState('#0f172a');
  const [bannerTextColor, setBannerTextColor] = useState('#ffffff');

  // UI state
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [pngScale, setPngScale] = useState<number>(2);

  // Construct final QR payload based on active preset
  const qrPayload = useMemo(() => {
    switch (activePreset) {
      case 'url':
        return url.trim() || 'https://omnicode.local';
      case 'text':
        return rawText.trim() || ' ';
      case 'wifi':
        return `WIFI:S:${wifiSsid};T:${wifiType};P:${wifiPassword};H:${wifiHidden ? 'true' : 'false'};;`;
      case 'vcard':
        return [
          'BEGIN:VCARD',
          'VERSION:3.0',
          `N:${vcardLast};${vcardFirst};;;`,
          `FN:${vcardFirst} ${vcardLast}`.trim(),
          vcardOrg ? `ORG:${vcardOrg}` : '',
          vcardTitle ? `TITLE:${vcardTitle}` : '',
          vcardPhone ? `TEL;TYPE=CELL:${vcardPhone}` : '',
          vcardEmail ? `EMAIL:${vcardEmail}` : '',
          vcardWebsite ? `URL:${vcardWebsite}` : '',
          'END:VCARD',
        ]
          .filter(Boolean)
          .join('\n');
      case 'email':
        return `mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      case 'sms':
        return `SMSTO:${phoneRecipient}:${smsMessage}`;
      case 'geo':
        return `geo:${geoLat},${geoLng}`;
      case 'event': {
        const fmtDate = (d: string) => d.replace(/[-:]/g, '') + '00';
        return [
          'BEGIN:VEVENT',
          `SUMMARY:${eventTitle}`,
          `LOCATION:${eventLocation}`,
          `DTSTART:${fmtDate(eventStart)}`,
          `DTEND:${fmtDate(eventEnd)}`,
          'END:VEVENT',
        ].join('\n');
      }
      case 'payment':
        return `upi://pay?pa=${encodeURIComponent(payeeVpa)}&pn=${encodeURIComponent(payeeName)}&am=${encodeURIComponent(payAmount)}&cu=USD`;
      default:
        return url;
    }
  }, [
    activePreset,
    url,
    rawText,
    wifiSsid,
    wifiType,
    wifiPassword,
    wifiHidden,
    vcardFirst,
    vcardLast,
    vcardOrg,
    vcardTitle,
    vcardPhone,
    vcardEmail,
    vcardWebsite,
    emailTo,
    emailSubject,
    emailBody,
    phoneRecipient,
    smsMessage,
    geoLat,
    geoLng,
    eventTitle,
    eventLocation,
    eventStart,
    eventEnd,
    payeeVpa,
    payeeName,
    payAmount,
  ]);

  // Generate SVG string
  const svgOutput = useMemo(() => {
    try {
      const design: QRDesignOptions = {
        size: 380,
        margin: 4,
        foregroundColor: fgColor,
        backgroundColor: bgColor,
        gradientType: useGradient ? 'linear' : 'none',
        gradientColorEnd: gradientEnd,
        gradientAngle,
        dotStyle,
        cornerFrameStyle,
        cornerDotStyle,
        cornerColor: customCornerColor ? cornerColor : fgColor,
        cornerDotColor: customCornerColor ? cornerColor : fgColor,
        logoSrc: selectedLogo || undefined,
        logoSizePercent,
        bannerText: bannerPosition !== 'none' ? bannerText : '',
        bannerPosition,
        bannerBgColor,
        bannerTextColor,
        bannerSubtext: bannerPosition !== 'none' ? bannerSubtext : '',
      };

      return renderQRCodeToSVG(qrPayload, design, {
        errorCorrectionLevel: selectedLogo ? 'H' : ecLevel,
      });
    } catch (err: any) {
      console.error('QR Render Error:', err);
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 380"><rect width="380" height="380" fill="#fef2f2"/><text x="190" y="190" text-anchor="middle" fill="#ef4444" font-size="14">Error: ${err?.message || 'Invalid Data'}</text></svg>`;
    }
  }, [
    qrPayload,
    fgColor,
    bgColor,
    useGradient,
    gradientEnd,
    gradientAngle,
    dotStyle,
    cornerFrameStyle,
    cornerDotStyle,
    customCornerColor,
    cornerColor,
    selectedLogo,
    logoSizePercent,
    bannerText,
    bannerPosition,
    bannerBgColor,
    bannerTextColor,
    bannerSubtext,
    ecLevel,
  ]);

  // Handle image upload for logo
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSelectedLogo(ev.target?.result as string);
        setEcLevel('H'); // Auto switch to High EC for logo safety
      };
      reader.readAsDataURL(file);
    }
  };

  // Preset built-in logo SVG icons
  const builtInLogos = [
    {
      id: 'globe',
      label: 'Globe',
      svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%232563eb" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>`,
    },
    {
      id: 'wifi',
      label: 'WiFi',
      svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%23059669" stroke-width="2.5"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>`,
    },
    {
      id: 'star',
      label: 'Star',
      svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23eab308" stroke="%23ca8a04" stroke-width="1.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    },
    {
      id: 'check',
      label: 'Verify',
      svg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2310b981" stroke="%23ffffff" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`,
    },
  ];

  const handleCopy = async () => {
    const success = await copyPngToClipboard(svgOutput);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSave = () => {
    const title = initialTitle || `${activePreset.toUpperCase()} QR: ${qrPayload.substring(0, 30)}`;
    saveItem({
      kind: 'qr',
      title,
      payload: qrPayload,
      config: {
        preset: activePreset,
        fgColor,
        bgColor,
        dotStyle,
        cornerFrameStyle,
        cornerDotStyle,
        bannerText: bannerPosition !== 'none' ? bannerText : '',
      },
      favorite: false,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
    if (onSaveSuccess) onSaveSuccess();
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print QR Code</title>
          <style>
            @page { margin: 10mm; }
            body { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 90vh; font-family: sans-serif; }
            .container { text-align: center; }
            svg { width: 340px; height: auto; }
            .meta { margin-top: 12px; font-size: 13px; color: #475569; word-break: break-all; max-width: 360px; }
          </style>
        </head>
        <body>
          <div class="container">
            ${svgOutput}
            <div class="meta">${escapeHtml(qrPayload)}</div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  function escapeHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Form & Style Controls */}
      <div className="lg:col-span-7 space-y-6">
        {/* Preset Selector */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
            Select Data Payload Type
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
            {[
              { id: 'url', label: 'Website URL', icon: Globe },
              { id: 'text', label: 'Plain Text', icon: FileText },
              { id: 'wifi', label: 'Wi-Fi Network', icon: Wifi },
              { id: 'vcard', label: 'Contact vCard', icon: User },
              { id: 'email', label: 'Email', icon: Mail },
              { id: 'sms', label: 'SMS / Phone', icon: Phone },
              { id: 'geo', label: 'Location Map', icon: MapPin },
              { id: 'event', label: 'Calendar Event', icon: Calendar },
              { id: 'payment', label: 'Payment / UPI', icon: CreditCard },
            ].map((p) => {
              const Icon = p.icon;
              const isSel = activePreset === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setActivePreset(p.id as QRPreset)}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-xs font-medium transition-all ${
                    isSel
                      ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4 mb-1" />
                  <span>{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Input Details based on Preset */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              Configure QR Code Details
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {qrPayload.length} characters
            </span>
          </div>

          {activePreset === 'url' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Target URL / Web Link
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {activePreset === 'text' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Plain Text or Custom Structured Data
              </label>
              <textarea
                rows={3}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Enter any text, instructions, serial numbers..."
                className="w-full p-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          {activePreset === 'wifi' && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Network Name (SSID)
                  </label>
                  <input
                    type="text"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Wi-Fi Password
                  </label>
                  <input
                    type="text"
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 pt-1">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-slate-700">Security:</label>
                  <select
                    value={wifiType}
                    onChange={(e) => setWifiType(e.target.value as any)}
                    className="px-2.5 py-1 text-xs border border-slate-300 rounded-md bg-white"
                  >
                    <option value="WPA">WPA / WPA2 / WPA3</option>
                    <option value="WEP">WEP</option>
                    <option value="nopass">Open (No Password)</option>
                  </select>
                </div>
                <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wifiHidden}
                    onChange={(e) => setWifiHidden(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  Hidden Network
                </label>
              </div>
            </div>
          )}

          {activePreset === 'vcard' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    value={vcardFirst}
                    onChange={(e) => setVcardFirst(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    value={vcardLast}
                    onChange={(e) => setVcardLast(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Company / Org</label>
                  <input
                    type="text"
                    value={vcardOrg}
                    onChange={(e) => setVcardOrg(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Job Title</label>
                  <input
                    type="text"
                    value={vcardTitle}
                    onChange={(e) => setVcardTitle(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={vcardPhone}
                    onChange={(e) => setVcardPhone(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={vcardEmail}
                    onChange={(e) => setVcardEmail(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {activePreset === 'email' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Recipient Email</label>
                <input
                  type="email"
                  value={emailTo}
                  onChange={(e) => setEmailTo(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Message Body</label>
                <textarea
                  rows={2}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          )}

          {activePreset === 'sms' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Recipient Phone</label>
                <input
                  type="tel"
                  value={phoneRecipient}
                  onChange={(e) => setPhoneRecipient(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Pre-filled SMS</label>
                <textarea
                  rows={2}
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          )}

          {activePreset === 'payment' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Payee ID / VPA</label>
                  <input
                    type="text"
                    value={payeeVpa}
                    onChange={(e) => setPayeeVpa(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Payee Name</label>
                  <input
                    type="text"
                    value={payeeName}
                    onChange={(e) => setPayeeName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Amount ($ / Currency)</label>
                <input
                  type="text"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
            </div>
          )}
        </div>

        {/* Visual Styling Customizer */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
            <Palette className="w-4 h-4 text-indigo-600" />
            Visual Customization & Details
          </h3>

          {/* Module Shapes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Dot & Module Shape</label>
            <div className="grid grid-cols-5 gap-2">
              {[
                { id: 'square', label: 'Square' },
                { id: 'rounded', label: 'Rounded' },
                { id: 'dots', label: 'Circles' },
                { id: 'diamond', label: 'Diamond' },
                { id: 'classy', label: 'Classy' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setDotStyle(s.id as DotStyle)}
                  className={`py-2 px-2 text-xs rounded-lg border font-medium transition-all ${
                    dotStyle === s.id
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Corner Eyes Shapes */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Corner Eye Frame
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['square', 'rounded', 'circle'] as CornerFrameStyle[]).map((cf) => (
                  <button
                    key={cf}
                    onClick={() => setCornerFrameStyle(cf)}
                    className={`py-1.5 text-xs rounded-md border capitalize font-medium ${
                      cornerFrameStyle === cf
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    {cf}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Corner Eye Center
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['square', 'circle', 'diamond'] as CornerDotStyle[]).map((cd) => (
                  <button
                    key={cd}
                    onClick={() => setCornerDotStyle(cd)}
                    className={`py-1.5 text-xs rounded-md border capitalize font-medium ${
                      cornerDotStyle === cd
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    {cd}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Color Palettes */}
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Foreground Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-24 px-2 py-1 text-xs font-mono border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Background Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-24 px-2 py-1 text-xs font-mono border border-slate-300 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Error Correction
                </label>
                <select
                  value={ecLevel}
                  onChange={(e) => setEcLevel(e.target.value as ErrorCorrectionLevel)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white"
                >
                  <option value="L">Low (7% recovery)</option>
                  <option value="M">Medium (15% recovery)</option>
                  <option value="Q">Quartile (25% recovery)</option>
                  <option value="H">High (30% - best with logo)</option>
                </select>
              </div>
            </div>

            {/* Gradient toggle */}
            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-1.5 text-xs text-slate-700 font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={useGradient}
                  onChange={(e) => setUseGradient(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                Enable Color Gradient
              </label>

              {useGradient && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">To:</span>
                  <input
                    type="color"
                    value={gradientEnd}
                    onChange={(e) => setGradientEnd(e.target.value)}
                    className="w-6 h-6 rounded border border-slate-300 cursor-pointer"
                  />
                  <span className="text-xs text-slate-500">Angle:</span>
                  <input
                    type="number"
                    min="0"
                    max="360"
                    step="15"
                    value={gradientAngle}
                    onChange={(e) => setGradientAngle(parseInt(e.target.value, 10) || 0)}
                    className="w-14 px-1.5 py-0.5 text-xs border border-slate-300 rounded"
                  />
                  <span className="text-xs text-slate-400">deg</span>
                </div>
              )}
            </div>
          </div>

          {/* Logo / Badge in Center */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-700 mb-2 flex items-center justify-between">
              <span>Center Logo / Badge Overlay</span>
              {selectedLogo && (
                <button
                  onClick={() => setSelectedLogo('')}
                  className="text-xs text-rose-600 hover:underline"
                >
                  Remove Logo
                </button>
              )}
            </label>

            <div className="flex items-center gap-3">
              {/* Preset icon buttons */}
              <div className="flex items-center gap-1.5">
                {builtInLogos.map((lg) => (
                  <button
                    key={lg.id}
                    onClick={() => {
                      setSelectedLogo(lg.svg);
                      setEcLevel('H');
                    }}
                    className={`w-9 h-9 rounded-lg border flex items-center justify-center p-1.5 transition-all ${
                      selectedLogo === lg.svg
                        ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                    title={lg.label}
                  >
                    <img src={lg.svg} alt={lg.label} className="w-5 h-5 object-contain" />
                  </button>
                ))}
              </div>

              <span className="text-xs text-slate-400">or</span>

              {/* Upload file */}
              <label className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer flex items-center gap-1.5 border border-slate-200">
                <ImageIcon className="w-3.5 h-3.5" />
                Upload Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Banner / Frame Option */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Call-to-Action Banner / Frame
              </label>
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                {(['none', 'bottom', 'top'] as const).map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setBannerPosition(pos)}
                    className={`px-2.5 py-1 text-xs rounded-md capitalize font-medium ${
                      bannerPosition === pos ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    {pos}
                  </button>
                ))}
              </div>
            </div>

            {bannerPosition !== 'none' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Main Banner Text
                  </label>
                  <input
                    type="text"
                    value={bannerText}
                    onChange={(e) => setBannerText(e.target.value)}
                    placeholder="SCAN ME"
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Secondary Subtext
                  </label>
                  <input
                    type="text"
                    value={bannerSubtext}
                    onChange={(e) => setBannerSubtext(e.target.value)}
                    placeholder="Instant Access"
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Live High-Def Preview & Export Hub */}
      <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-20">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-center">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Live Real-Time Preview
            </span>
            <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-medium">
              Zero 3rd-Party SVG
            </span>
          </div>

          {/* Rendered Output Display */}
          <div className="flex items-center justify-center p-4 bg-slate-50/80 rounded-xl border border-slate-100 min-h-[340px]">
            <div
              className="max-w-full drop-shadow-sm transition-all"
              dangerouslySetInnerHTML={{ __html: svgOutput }}
            />
          </div>

          {/* Quick Stats */}
          <div className="mt-4 flex items-center justify-around py-2 border-y border-slate-100 text-xs text-slate-500">
            <div>
              <span className="font-semibold text-slate-700">Type: </span>
              {activePreset.toUpperCase()}
            </div>
            <div>
              <span className="font-semibold text-slate-700">EC Level: </span>
              {selectedLogo ? 'H (30%)' : ecLevel}
            </div>
            <div>
              <span className="font-semibold text-slate-700">Format: </span>
              Pure SVG / Vector
            </div>
          </div>

          {/* Primary Export Actions */}
          <div className="mt-5 space-y-2.5">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => downloadSvg(svgOutput, `qrcode-${activePreset}-${Date.now()}.svg`)}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
              >
                <Download className="w-4 h-4" />
                Download SVG
              </button>

              <button
                onClick={() => downloadPng(svgOutput, `qrcode-${activePreset}-${Date.now()}.png`, pngScale)}
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
              >
                <Download className="w-4 h-4" />
                Download PNG ({pngScale}x)
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center justify-center gap-1 px-2.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy PNG'}
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-1 px-2.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Label
              </button>

              <button
                onClick={handleSave}
                className="flex items-center justify-center gap-1 px-2.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium"
              >
                {savedSuccess ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Bookmark className="w-3.5 h-3.5" />
                )}
                {savedSuccess ? 'Saved!' : 'Save Item'}
              </button>
            </div>

            {/* PNG Resolution Selector */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span>PNG Resolution:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 4].map((s) => (
                  <button
                    key={s}
                    onClick={() => setPngScale(s)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                      pngScale === s ? 'bg-blue-100 text-blue-700 font-bold' : 'text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    {s}x {s === 4 ? '(Print 300DPI)' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Send to Label Sheet button */}
            {onSendToLabels && (
              <button
                onClick={() => onSendToLabels(qrPayload, bannerText || 'Product QR')}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 mt-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-800 rounded-lg text-xs font-medium hover:bg-blue-100 transition-all"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Send to Printable Avery Label Sheet</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
