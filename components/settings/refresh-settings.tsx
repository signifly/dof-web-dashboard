"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { RefreshCw, Clock, Settings, Save, RotateCcw } from "lucide-react"
import {
  RefreshConfig,
  DEFAULT_REFRESH_CONFIG,
  loadRefreshConfig,
  saveRefreshConfig,
} from "@/lib/utils/refresh-config"

interface RefreshSettingsProps {
  /** Show only specific sections */
  sections?: ("intervals" | "behavior")[]
  /** Compact mode */
  compact?: boolean
  /** Called when settings change */
  onChange?: (config: RefreshConfig) => void
  /** Custom className */
  className?: string
}

export function RefreshSettings({
  sections = ["intervals", "behavior"],
  compact = false,
  onChange,
  className,
}: RefreshSettingsProps) {
  const [config, setConfig] = useState<RefreshConfig>(DEFAULT_REFRESH_CONFIG)
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Load saved config on mount
  useEffect(() => {
    const savedConfig = loadRefreshConfig()
    setConfig(savedConfig)
  }, [])

  // Handle config change
  const handleConfigChange = (updates: Partial<RefreshConfig>) => {
    const newConfig = { ...config, ...updates }
    setConfig(newConfig)
    setHasChanges(true)
    onChange?.(newConfig)
  }

  // Save settings
  const handleSave = async () => {
    setIsSaving(true)
    try {
      saveRefreshConfig(config)
      setHasChanges(false)
    } catch (error) {
      console.error("Failed to save refresh settings:", error)
    } finally {
      setIsSaving(false)
    }
  }

  // Reset to defaults
  const handleReset = () => {
    setConfig(DEFAULT_REFRESH_CONFIG)
    setHasChanges(true)
    onChange?.(DEFAULT_REFRESH_CONFIG)
  }

  // Convert milliseconds to minutes for display
  const msToMinutes = (ms: number): number => Math.round(ms / 60000)
  const minutesToMs = (minutes: number): number => minutes * 60000

  // Format interval display
  const formatInterval = (ms: number): string => {
    const minutes = msToMinutes(ms)
    if (minutes < 60) {
      return `${minutes}m`
    } else {
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60
      return remainingMinutes > 0
        ? `${hours}h ${remainingMinutes}m`
        : `${hours}h`
    }
  }

  const intervalSettings = [
    {
      key: "active" as keyof RefreshConfig,
      label: "Active Data",
      description: "Real-time performance metrics, live charts",
      icon: RefreshCw,
      color: "bg-green-500",
    },
    {
      key: "summary" as keyof RefreshConfig,
      label: "Summary Data",
      description: "Aggregated analytics, dashboard summaries",
      icon: Clock,
      color: "bg-blue-500",
    },
    {
      key: "background" as keyof RefreshConfig,
      label: "Background",
      description: "When tab is not active or visible",
      icon: Settings,
      color: "bg-gray-500",
    },
    {
      key: "interactive" as keyof RefreshConfig,
      label: "Interactive",
      description: "When user is actively using the page",
      icon: RefreshCw,
      color: "bg-orange-500",
    },
  ]

  if (compact) {
    return (
      <div className={className}>
        <div className="space-y-4">
          {sections.includes("intervals") && (
            <div className="grid grid-cols-2 gap-4">
              {intervalSettings.slice(0, 2).map(setting => {
                const _Icon = setting.icon
                return (
                  <div key={setting.key} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${setting.color}`}
                      />
                      <Label className="text-sm">{setting.label}</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        max="60"
                        value={msToMinutes(config[setting.key])}
                        onChange={e => {
                          const minutes = parseInt(e.target.value) || 1
                          handleConfigChange({
                            [setting.key]: minutesToMs(minutes),
                          })
                        }}
                        className="h-8"
                      />
                      <span className="text-xs text-muted-foreground">min</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {hasChanges && (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1"
              >
                <Save className="h-3 w-3 mr-1" />
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleReset}
                disabled={isSaving}
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Auto-Refresh Settings
        </CardTitle>
        <CardDescription>
          Configure how often different types of data are refreshed
          automatically.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {sections.includes("intervals") && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-3">Refresh Intervals</h4>
              <div className="grid gap-4">
                {intervalSettings.map(setting => {
                  const Icon = setting.icon
                  return (
                    <div
                      key={setting.key}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${setting.color}`}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <Label className="font-medium">
                              {setting.label}
                            </Label>
                            <Badge variant="outline" className="text-xs">
                              {formatInterval(config[setting.key])}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {setting.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="1"
                          max="120"
                          value={msToMinutes(config[setting.key])}
                          onChange={e => {
                            const minutes = parseInt(e.target.value) || 1
                            handleConfigChange({
                              [setting.key]: minutesToMs(minutes),
                            })
                          }}
                          className="w-20 h-8"
                        />
                        <span className="text-sm text-muted-foreground">
                          min
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {sections.includes("behavior") && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-semibold mb-3">Behavior</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Pause on interaction</Label>
                    <p className="text-sm text-muted-foreground">
                      Pause auto-refresh when actively using the page
                    </p>
                  </div>
                  <Switch
                    checked={true} // This would be controlled by a separate setting
                    onCheckedChange={() => {
                      // This would update interaction pause setting
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Reduce frequency when inactive</Label>
                    <p className="text-sm text-muted-foreground">
                      Use longer intervals when tab is not active
                    </p>
                  </div>
                  <Switch
                    checked={true} // This would be controlled by a separate setting
                    onCheckedChange={() => {
                      // This would update background frequency setting
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {hasChanges && (
          <div className="flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              You have unsaved changes
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={isSaving}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
