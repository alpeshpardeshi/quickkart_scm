import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, CameraOff, ScanLine } from 'lucide-react'
import { QkButton } from './QkButton'
import { QkInput } from './QkInput'

interface QkBarcodeScannerProps {
  onScan: (code: string) => void
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
}

type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue: string }>>
}

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats?: string[] }) => BarcodeDetectorLike
  }
}

export function QkBarcodeScanner({
  onScan,
  placeholder = 'SKU or barcode...',
  value,
  onChange,
}: QkBarcodeScannerProps) {
  const [manual, setManual] = useState(value || '')
  const [cameraOn, setCameraOn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [supported, setSupported] = useState(false)
  const [lastCode, setLastCode] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectorRef = useRef<BarcodeDetectorLike | null>(null)
  const rafRef = useRef<number>(0)
  const cooldownRef = useRef(0)

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && typeof window.BarcodeDetector === 'function')
  }, [])

  useEffect(() => {
    if (value !== undefined) setManual(value)
  }, [value])

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setCameraOn(false)
  }, [])

  useEffect(() => () => stopCamera(), [stopCamera])

  const emit = useCallback((code: string) => {
    const trimmed = code.trim()
    if (!trimmed) return
    const now = Date.now()
    if (trimmed === lastCode && now - cooldownRef.current < 1800) return
    cooldownRef.current = now
    setLastCode(trimmed)
    setManual(trimmed)
    onChange?.(trimmed)
    onScan(trimmed)
  }, [lastCode, onChange, onScan])

  const startCamera = async () => {
    setError(null)
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera is not available in this browser.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      if (window.BarcodeDetector) {
        detectorRef.current = new window.BarcodeDetector({
          formats: ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e'],
        })
      }
      setCameraOn(true)
    } catch {
      setError('Unable to access camera. Allow permission or enter the code manually.')
      stopCamera()
    }
  }

  useEffect(() => {
    if (!cameraOn || !supported || !detectorRef.current || !videoRef.current) return

    const tick = async () => {
      const video = videoRef.current
      const detector = detectorRef.current
      if (!video || !detector || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(tick)
        return
      }
      try {
        const codes = await detector.detect(video)
        if (codes[0]?.rawValue) emit(codes[0].rawValue)
      } catch {
        /* keep scanning */
      }
      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [cameraOn, supported, emit])

  const submitManual = () => {
    const code = manual.trim() || `SKU-1002${Math.floor(Math.random() * 8) + 1}`
    emit(code)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <QkInput
        label="Scan barcode"
        value={manual}
        placeholder={placeholder}
        onChange={(e) => {
          setManual(e.target.value)
          onChange?.(e.target.value)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            submitManual()
          }
        }}
      />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <QkButton leftIcon={<ScanLine size={14} />} variant="outline" onClick={submitManual}>
          Confirm code
        </QkButton>
        {!cameraOn ? (
          <QkButton leftIcon={<Camera size={14} />} onClick={startCamera}>
            Use camera
          </QkButton>
        ) : (
          <QkButton leftIcon={<CameraOff size={14} />} variant="danger" onClick={stopCamera}>
            Stop camera
          </QkButton>
        )}
      </div>

      {error && (
        <div style={{ fontSize: 12, color: 'var(--qk-danger)', background: 'var(--qk-danger-soft)', padding: '8px 10px', borderRadius: 6 }}>
          {error}
        </div>
      )}

      {cameraOn && (
        <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1px solid var(--qk-border)', background: '#0B1220' }}>
          <video
            ref={videoRef}
            muted
            playsInline
            style={{ width: '100%', maxHeight: 240, objectFit: 'cover', display: 'block' }}
          />
          <div
            style={{
              position: 'absolute',
              inset: '18% 16%',
              border: '2px solid rgba(111,164,216,0.85)',
              borderRadius: 8,
              pointerEvents: 'none',
            }}
          />
          <div style={{ position: 'absolute', left: 10, bottom: 10, fontSize: 11, color: '#F3F6FA', background: 'rgba(0,0,0,0.45)', padding: '4px 8px', borderRadius: 4 }}>
            {supported ? 'Point at barcode / QR' : 'Camera preview · enter code manually (BarcodeDetector unsupported)'}
          </div>
        </div>
      )}

      {!supported && (
        <div style={{ fontSize: 11, color: 'var(--qk-text-muted)' }}>
          Live decode needs Chrome/Edge BarcodeDetector. Camera still opens for aiming; use Confirm code or Enter.
        </div>
      )}
    </div>
  )
}
