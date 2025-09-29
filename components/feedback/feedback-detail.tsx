"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { type Feedback } from "@/lib/actions/feedback"
import {
  MessageSquare,
  User,
  Route,
  Clock,
  Calendar,
  ImageIcon,
  ExternalLink,
  Copy,
  Check,
  Download,
  AlertCircle,
  Mail
} from "lucide-react"

interface FeedbackDetailProps {
  feedback: Feedback
  open: boolean
  onClose: () => void
}

export function FeedbackDetail({
  feedback,
  open,
  onClose
}: FeedbackDetailProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return {
        date: date.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric"
        }),
        time: date.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true
        }),
        relative: getRelativeTime(date)
      }
    } catch {
      return {
        date: "Invalid date",
        time: "Invalid time",
        relative: "Unknown"
      }
    }
  }

  // Get relative time description
  const getRelativeTime = (date: Date) => {
    const now = new Date()
    const diffInMilliseconds = now.getTime() - date.getTime()
    const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60))
    const diffInHours = Math.floor(diffInMinutes / 60)
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`
    if (diffInDays < 30) return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`
    return "More than a month ago"
  }

  // Format route for display
  const formatRoute = (route: string) => {
    return route.startsWith("/") ? route : `/${route}`
  }

  // Format file size
  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown size"
    const sizes = ["Bytes", "KB", "MB", "GB"]
    if (bytes === 0) return "0 Bytes"
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + " " + sizes[i]
  }

  // Copy to clipboard function
  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      console.error("Failed to copy to clipboard:", error)
    }
  }

  // Handle screenshot download
  const downloadScreenshot = () => {
    if (feedback.screenshot_url) {
      const link = document.createElement("a")
      link.href = feedback.screenshot_url
      link.download = `feedback-screenshot-${feedback.id}.${feedback.screenshot_mime_type?.split("/")[1] || "png"}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  // Handle screenshot error
  const handleImageError = () => {
    setImageError(true)
    setImageLoading(false)
  }

  // Handle screenshot load
  const handleImageLoad = () => {
    setImageLoading(false)
    setImageError(false)
  }

  const timestampInfo = formatTimestamp(feedback.timestamp)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Feedback Details
          </DialogTitle>
          <DialogDescription>
            Detailed view of user feedback submission
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Metadata Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* User Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  User Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Email:</span>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-mono">{feedback.user_email}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(feedback.user_email, "email")}
                    >
                      {copiedField === "email" ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open(`mailto:${feedback.user_email}`, "_blank")}
                  >
                    <Mail className="h-3 w-3 mr-2" />
                    Send Email
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Route Information */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Route className="h-4 w-4" />
                  Route Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Path:</span>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs font-mono">
                      {formatRoute(feedback.route)}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(feedback.route, "route")}
                    >
                      {copiedField === "route" ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => window.open(feedback.route, "_blank")}
                  >
                    <ExternalLink className="h-3 w-3 mr-2" />
                    Open Route
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Timestamp Information */}
            <Card className="md:col-span-2 lg:col-span-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Timestamp
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{timestampInfo.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{timestampInfo.time}</span>
                  </div>
                  <div className="text-xs text-muted-foreground pt-1">
                    {timestampInfo.relative}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Comment Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                User Comment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {feedback.comment}
                </p>
              </div>
              <div className="flex justify-end pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(feedback.comment, "comment")}
                >
                  {copiedField === "comment" ? (
                    <>
                      <Check className="h-3 w-3 mr-2 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3 mr-2" />
                      Copy Comment
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Screenshot Section */}
          {feedback.screenshot_url ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    Screenshot
                  </div>
                  <div className="flex items-center gap-2">
                    {feedback.screenshot_file_size && (
                      <Badge variant="secondary" className="text-xs">
                        {formatFileSize(feedback.screenshot_file_size)}
                      </Badge>
                    )}
                    {feedback.screenshot_mime_type && (
                      <Badge variant="outline" className="text-xs">
                        {feedback.screenshot_mime_type.split("/")[1]?.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded-lg overflow-hidden bg-muted/10">
                  {imageError ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Failed to load screenshot. The image may have been removed or is temporarily unavailable.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="relative">
                      {imageLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                          <div className="text-sm text-muted-foreground">Loading image...</div>
                        </div>
                      )}
                      <img
                        src={feedback.screenshot_url}
                        alt="User feedback screenshot"
                        className="w-full h-auto max-h-96 object-contain"
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                        style={{ display: imageError ? "none" : "block" }}
                      />
                    </div>
                  )}
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadScreenshot}
                    disabled={imageError}
                  >
                    <Download className="h-3 w-3 mr-2" />
                    Download Screenshot
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No screenshot was provided with this feedback.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">System Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Feedback ID:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono">{feedback.id}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={() => copyToClipboard(feedback.id, "id")}
                    >
                      {copiedField === "id" ? (
                        <Check className="h-2 w-2 text-green-600" />
                      ) : (
                        <Copy className="h-2 w-2" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-mono">{new Date(feedback.created_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Event Time:</span>
                  <span className="font-mono">{new Date(feedback.timestamp).toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}