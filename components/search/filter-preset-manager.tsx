"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  BookmarkPlus,
  Bookmark,
  Edit2,
  Trash2,
  Download,
  Upload,
  Copy,
  Check,
  AlertCircle,
  Folder,
  Star,
  Clock,
  Filter,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { SearchQuery } from "@/lib/services/search-service"

interface FilterPreset {
  id: string
  name: string
  description?: string
  query: SearchQuery
  category: string
  isStarred: boolean
  createdAt: Date
  lastUsed: Date
  useCount: number
}

type PresetCategory = "performance" | "recent" | "devices" | "custom" | "shared"

interface FilterPresetManagerProps {
  currentQuery: SearchQuery
  onLoadPreset: (query: SearchQuery) => void
  className?: string
  trigger?: React.ReactNode
  triggerAsChild?: boolean
}

const presetFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(50, "Name too long"),
  description: z.string().max(200, "Description too long").optional(),
  category: z.enum(["performance", "recent", "devices", "custom", "shared"]),
})

type PresetFormValues = z.infer<typeof presetFormSchema>

const PRESET_CATEGORIES = {
  performance: { label: "Performance Issues", icon: AlertCircle },
  recent: { label: "Recent Data", icon: Clock },
  devices: { label: "Device Specific", icon: Folder },
  custom: { label: "Custom", icon: Star },
  shared: { label: "Shared", icon: Copy },
}

export function FilterPresetManager({
  currentQuery,
  onLoadPreset,
  className,
  trigger,
  triggerAsChild = false,
}: FilterPresetManagerProps) {
  const [presets, setPresets] = useState<FilterPreset[]>([])
  const [selectedCategory, setSelectedCategory] = useState<
    PresetCategory | "all"
  >("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingPreset, setEditingPreset] = useState<FilterPreset | null>(null)
  const [copiedPresetId, setCopiedPresetId] = useState<string | null>(null)

  const form = useForm<PresetFormValues>({
    resolver: zodResolver(presetFormSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "custom",
    },
  })

  // Load presets from localStorage on mount
  useEffect(() => {
    loadPresets()
  }, [])

  // Load presets from localStorage
  const loadPresets = () => {
    try {
      const stored = localStorage.getItem("search-presets")
      if (stored) {
        const parsedPresets = JSON.parse(stored).map((preset: any) => ({
          ...preset,
          createdAt: new Date(preset.createdAt),
          lastUsed: new Date(preset.lastUsed),
        }))
        setPresets(parsedPresets)
      }
    } catch (error) {
      console.error("Error loading presets:", error)
      setPresets([])
    }
  }

  // Save presets to localStorage
  const savePresets = (newPresets: FilterPreset[]) => {
    try {
      localStorage.setItem("search-presets", JSON.stringify(newPresets))
      setPresets(newPresets)
    } catch (error) {
      console.error("Error saving presets:", error)
    }
  }

  // Create a new preset
  const createPreset = (values: PresetFormValues) => {
    const newPreset: FilterPreset = {
      id: crypto.randomUUID(),
      name: values.name,
      description: values.description,
      query: currentQuery,
      category: values.category,
      isStarred: false,
      createdAt: new Date(),
      lastUsed: new Date(),
      useCount: 0,
    }

    const newPresets = [...presets, newPreset]
    savePresets(newPresets)
    setIsCreateDialogOpen(false)
    form.reset()
  }

  // Update existing preset
  const updatePreset = (values: PresetFormValues) => {
    if (!editingPreset) return

    const updatedPresets = presets.map(preset =>
      preset.id === editingPreset.id
        ? {
            ...preset,
            name: values.name,
            description: values.description,
            category: values.category,
            query: currentQuery,
          }
        : preset
    )

    savePresets(updatedPresets)
    setEditingPreset(null)
    form.reset()
  }

  // Delete preset
  const deletePreset = (presetId: string) => {
    const newPresets = presets.filter(preset => preset.id !== presetId)
    savePresets(newPresets)
  }

  // Toggle star status
  const toggleStar = (presetId: string) => {
    const updatedPresets = presets.map(preset =>
      preset.id === presetId
        ? { ...preset, isStarred: !preset.isStarred }
        : preset
    )
    savePresets(updatedPresets)
  }

  // Load preset
  const loadPreset = (preset: FilterPreset) => {
    const updatedPresets = presets.map(p =>
      p.id === preset.id
        ? {
            ...p,
            lastUsed: new Date(),
            useCount: p.useCount + 1,
          }
        : p
    )
    savePresets(updatedPresets)
    onLoadPreset(preset.query)
  }

  // Start editing
  const startEdit = (preset: FilterPreset) => {
    setEditingPreset(preset)
    form.reset({
      name: preset.name,
      description: preset.description || "",
      category: preset.category,
    })
    setIsCreateDialogOpen(true)
  }

  // Copy preset query
  const copyPreset = async (preset: FilterPreset) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(preset.query, null, 2))
      setCopiedPresetId(preset.id)
      setTimeout(() => setCopiedPresetId(null), 2000)
    } catch (error) {
      console.error("Error copying preset:", error)
    }
  }

  // Export presets
  const exportPresets = () => {
    try {
      const exportData = {
        presets: presets,
        exportedAt: new Date().toISOString(),
        version: "1.0",
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `search-presets-${new Date().toISOString().split("T")[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error exporting presets:", error)
    }
  }

  // Import presets
  const importPresets = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = e => {
      try {
        const content = e.target?.result as string
        const importData = JSON.parse(content)

        if (importData.presets && Array.isArray(importData.presets)) {
          const importedPresets = importData.presets.map((preset: any) => ({
            ...preset,
            id: crypto.randomUUID(), // Generate new IDs to avoid conflicts
            createdAt: new Date(preset.createdAt),
            lastUsed: new Date(preset.lastUsed),
          }))

          const newPresets = [...presets, ...importedPresets]
          savePresets(newPresets)
        }
      } catch (error) {
        console.error("Error importing presets:", error)
      }
    }
    reader.readAsText(file)
    event.target.value = "" // Reset file input
  }

  // Filter presets by category
  const filteredPresets = presets.filter(
    preset => selectedCategory === "all" || preset.category === selectedCategory
  )

  // Sort presets (starred first, then by last used)
  const sortedPresets = filteredPresets.sort((a, b) => {
    if (a.isStarred && !b.isStarred) return -1
    if (!a.isStarred && b.isStarred) return 1
    return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime()
  })

  // Check if current query has filters
  const hasCurrentFilters = () => {
    return !!(
      currentQuery.text?.trim() ||
      currentQuery.devices?.length ||
      currentQuery.platforms?.length ||
      currentQuery.appVersions?.length ||
      currentQuery.metricTypes?.length ||
      currentQuery.dateRange ||
      (currentQuery.metrics && Object.keys(currentQuery.metrics).length > 0)
    )
  }

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Bookmark className="h-4 w-4 mr-2" />
      Presets ({presets.length})
    </Button>
  )

  return (
    <div className={className}>
      <Sheet>
        <SheetTrigger asChild={triggerAsChild}>
          {trigger || defaultTrigger}
        </SheetTrigger>
        <SheetContent className="w-full max-w-md sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Bookmark className="h-5 w-5" />
              Filter Presets
            </SheetTitle>
            <SheetDescription>
              Save and manage your search filter configurations
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 mt-6">
            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <Dialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    disabled={!hasCurrentFilters()}
                    onClick={() => {
                      setEditingPreset(null)
                      form.reset({
                        name: "",
                        description: "",
                        category: "custom",
                      })
                    }}
                  >
                    <BookmarkPlus className="h-4 w-4 mr-2" />
                    Save Current
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingPreset ? "Edit Preset" : "Save Search Preset"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingPreset
                        ? "Update your existing search preset"
                        : "Save your current search filters as a preset"}
                    </DialogDescription>
                  </DialogHeader>

                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(
                        editingPreset ? updatePreset : createPreset
                      )}
                      className="space-y-4"
                    >
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., High CPU Usage Issues"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Brief description of what this preset searches for..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <FormControl>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(PRESET_CATEGORIES).map(
                                    ([key, category]) => (
                                      <SelectItem key={key} value={key}>
                                        {category.label}
                                      </SelectItem>
                                    )
                                  )}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormDescription>
                              Organize your presets into categories
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsCreateDialogOpen(false)
                            setEditingPreset(null)
                            form.reset()
                          }}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">
                          {editingPreset ? "Update" : "Save"} Preset
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              <Button variant="outline" size="sm" onClick={exportPresets}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>

              <label>
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".json"
                  onChange={importPresets}
                  className="hidden"
                />
              </label>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Filter by Category</label>
              <Select
                value={selectedCategory}
                onValueChange={value =>
                  setSelectedCategory(value as PresetCategory | "all")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Object.entries(PRESET_CATEGORIES).map(([key, category]) => {
                    const Icon = category.icon
                    return (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {category.label}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Presets List */}
            <div className="space-y-3">
              {sortedPresets.length === 0 ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-8">
                    <div className="text-center text-muted-foreground">
                      <Filter className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No presets found</p>
                      {selectedCategory !== "all" && (
                        <p className="text-sm">
                          Try selecting a different category
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                sortedPresets.map(preset => {
                  const categoryInfo = PRESET_CATEGORIES[preset.category]
                  const CategoryIcon = categoryInfo.icon

                  return (
                    <Card key={preset.id} className="relative">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-sm flex items-center gap-2">
                                {preset.isStarred && (
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                )}
                                {preset.name}
                              </CardTitle>
                            </div>
                            {preset.description && (
                              <CardDescription className="text-xs mt-1">
                                {preset.description}
                              </CardDescription>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleStar(preset.id)}
                            >
                              <Star
                                className={cn(
                                  "h-4 w-4",
                                  preset.isStarred
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-muted-foreground"
                                )}
                              />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startEdit(preset)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deletePreset(preset.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              <CategoryIcon className="h-3 w-3 mr-1" />
                              {categoryInfo.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Used {preset.useCount} times
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {preset.lastUsed.toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => loadPreset(preset)}
                            className="flex-1"
                          >
                            Load Filters
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyPreset(preset)}
                          >
                            {copiedPresetId === preset.id ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
