"use client"

import { useState } from "react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ScreenshotViewerProps {
  isOpen: boolean
  onClose: () => void
  screenshotUrl: string | null
  filename?: string
  mimeType?: string | null
  fileSize?: number | null
}

export function ScreenshotViewer({
  isOpen,
  onClose,
  screenshotUrl,
  filename = "screenshot",
  mimeType,
  fileSize,
}: ScreenshotViewerProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)
  const [zoom, setZoom] = useState(100)

  const handleDownload = async () => {
    if (!screenshotUrl) return

    try {
      const response = await fetch(screenshotUrl)
      const blob = await response.blob()

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url

      // Create filename with extension based on mime type
      const extension = mimeType?.includes("jpeg")
        ? "jpg"
        : mimeType?.includes("png")
          ? "png"
          : mimeType?.includes("webp")
            ? "webp"
            : "png"

      link.download = `${filename}.${extension}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error downloading screenshot:", error)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const zoomIn = () => setZoom(prev => Math.min(prev + 25, 300))
  const zoomOut = () => setZoom(prev => Math.max(prev - 25, 25))
  const resetZoom = () => setZoom(100)

  if (!screenshotUrl) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              No Screenshot Available
            </DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              This feedback item does not include a screenshot.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full h-[90vh] p-0">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="flex items-center justify-between">
            <span>Screenshot Viewer</span>
            <div className="flex items-center gap-2">
              {/* File info */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {mimeType && (
                  <Badge variant="secondary" className="text-xs">
                    {mimeType.split("/")[1]?.toUpperCase() || "IMAGE"}
                  </Badge>
                )}
                {fileSize && <span>{formatFileSize(fileSize)}</span>}
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={zoomOut}
                  disabled={zoom <= 25}
                  title="Zoom out"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetZoom}
                  title="Reset zoom"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={zoomIn}
                  disabled={zoom >= 300}
                  title="Zoom in"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>

                <div className="px-2 py-1 text-xs bg-muted rounded min-w-[50px] text-center">
                  {zoom}%
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  title="Download screenshot"
                >
                  <Download className="h-4 w-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto bg-muted/20">
          <div className="flex items-center justify-center min-h-full p-4">
            {imageError ? (
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  Failed to load screenshot
                </h3>
                <p className="text-muted-foreground mb-4">
                  The screenshot could not be loaded. It may have been moved or
                  deleted.
                </p>
                <Button onClick={onClose} variant="outline">
                  Close
                </Button>
              </div>
            ) : (
              <div
                className="relative"
                style={{
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: "center",
                  transition: "transform 0.2s ease-in-out",
                }}
              >
                {imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted rounded">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                  </div>
                )}

                <Image
                  src={screenshotUrl}
                  alt="Feedback Screenshot"
                  width={800}
                  height={600}
                  className={cn(
                    "max-w-full h-auto rounded-lg shadow-lg",
                    imageLoading && "opacity-0"
                  )}
                  onLoad={() => setImageLoading(false)}
                  onError={() => {
                    setImageError(true)
                    setImageLoading(false)
                  }}
                  priority
                />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default ScreenshotViewer
