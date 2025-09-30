"use client"

import { useCallback, useState } from "react"

export interface ExportOptions {
  filename?: string
  format: "png" | "svg" | "csv" | "json"
  width?: number
  height?: number
  includeMetadata?: boolean
  compression?: number // For PNG (0-1)
}

export interface ExportState {
  isExporting: boolean
  lastExport?: {
    filename: string
    format: string
    timestamp: Date
  }
  error?: string
}

export interface UseChartExportProps {
  defaultFilename?: string
  onExportStart?: (() => void) | undefined
  onExportComplete?: ((filename: string, format: string) => void) | undefined
  onExportError?: ((error: string) => void) | undefined
}

export interface UseChartExportReturn {
  exportState: ExportState
  exportChart: (
    chartElement: HTMLElement | null,
    options: ExportOptions
  ) => Promise<void>
  exportData: <T>(data: T[], options: ExportOptions) => Promise<void>
  downloadFile: (content: string | Blob, filename: string) => void
}

/**
 * Custom hook for chart export functionality
 * Supports PNG, SVG, CSV, and JSON export formats
 */
export function useChartExport({
  defaultFilename = "chart",
  onExportStart,
  onExportComplete,
  onExportError,
}: UseChartExportProps = {}): UseChartExportReturn {
  const [exportState, setExportState] = useState<ExportState>({
    isExporting: false,
  })

  // Generate filename with timestamp
  const generateFilename = useCallback(
    (basename: string, format: string): string => {
      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/[:.]/g, "-")
      return `${basename}_${timestamp}.${format}`
    },
    []
  )

  // Download file helper
  const downloadFile = useCallback(
    (content: string | Blob, filename: string) => {
      const blob =
        content instanceof Blob
          ? content
          : new Blob([content], { type: "text/plain" })
      const url = URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    },
    []
  )

  // Convert SVG to PNG using canvas
  const svgToPng = useCallback(
    async (
      svgElement: SVGElement,
      width: number,
      height: number,
      compression = 0.9
    ): Promise<Blob> => {
      return new Promise((resolve, reject) => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")

        if (!ctx) {
          reject(new Error("Failed to get canvas context"))
          return
        }

        canvas.width = width
        canvas.height = height

        // Set white background
        ctx.fillStyle = "white"
        ctx.fillRect(0, 0, width, height)

        const svgData = new XMLSerializer().serializeToString(svgElement)
        const svgBlob = new Blob([svgData], {
          type: "image/svg+xml;charset=utf-8",
        })
        const url = URL.createObjectURL(svgBlob)

        const img = new Image()
        img.onload = () => {
          ctx.drawImage(img, 0, 0, width, height)
          canvas.toBlob(
            blob => {
              URL.revokeObjectURL(url)
              if (blob) {
                resolve(blob)
              } else {
                reject(new Error("Failed to create PNG blob"))
              }
            },
            "image/png",
            compression
          )
        }
        img.onerror = () => {
          URL.revokeObjectURL(url)
          reject(new Error("Failed to load SVG image"))
        }
        img.src = url
      })
    },
    []
  )

  // Export chart as image or SVG
  const exportChart = useCallback(
    async (
      chartElement: HTMLElement | null,
      options: ExportOptions
    ): Promise<void> => {
      if (!chartElement) {
        const error = "Chart element not found"
        setExportState(prev => ({ ...prev, error }))
        onExportError?.(error)
        return
      }

      setExportState(prev => ({
        ...prev,
        isExporting: true,
        error: undefined,
      }))

      onExportStart?.()

      try {
        const filename = generateFilename(
          options.filename || defaultFilename,
          options.format
        )
        const svgElement = chartElement.querySelector("svg")

        if (!svgElement) {
          throw new Error("SVG element not found in chart")
        }

        const rect = svgElement.getBoundingClientRect()
        const width = options.width || rect.width || 800
        const height = options.height || rect.height || 600

        // Clone SVG to avoid modifying original
        const clonedSvg = svgElement.cloneNode(true) as SVGElement
        clonedSvg.setAttribute("width", width.toString())
        clonedSvg.setAttribute("height", height.toString())

        // Add metadata if requested
        if (options.includeMetadata) {
          const metadata = document.createElementNS(
            "http://www.w3.org/2000/svg",
            "metadata"
          )
          metadata.textContent = JSON.stringify({
            exportedAt: new Date().toISOString(),
            format: options.format,
            dimensions: { width, height },
          })
          clonedSvg.insertBefore(metadata, clonedSvg.firstChild)
        }

        let content: string | Blob

        switch (options.format) {
          case "svg":
            content = new XMLSerializer().serializeToString(clonedSvg)
            downloadFile(content, filename)
            break

          case "png":
            content = await svgToPng(
              clonedSvg,
              width,
              height,
              options.compression
            )
            downloadFile(content, filename)
            break

          default:
            throw new Error(
              `Unsupported chart export format: ${options.format}`
            )
        }

        setExportState(prev => ({
          ...prev,
          isExporting: false,
          lastExport: {
            filename,
            format: options.format,
            timestamp: new Date(),
          },
        }))

        onExportComplete?.(filename, options.format)
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Export failed"
        setExportState(prev => ({
          ...prev,
          isExporting: false,
          error: errorMessage,
        }))
        onExportError?.(errorMessage)
      }
    },
    [
      defaultFilename,
      generateFilename,
      downloadFile,
      svgToPng,
      onExportStart,
      onExportComplete,
      onExportError,
    ]
  )

  // Export data as CSV or JSON
  const exportData = useCallback(
    async <T>(data: T[], options: ExportOptions): Promise<void> => {
      setExportState(prev => ({
        ...prev,
        isExporting: true,
        error: undefined,
      }))

      onExportStart?.()

      try {
        const filename = generateFilename(
          options.filename || defaultFilename,
          options.format
        )
        let content: string

        switch (options.format) {
          case "json":
            const jsonData = options.includeMetadata
              ? {
                  metadata: {
                    exportedAt: new Date().toISOString(),
                    recordCount: data.length,
                  },
                  data,
                }
              : data

            content = JSON.stringify(jsonData, null, 2)
            break

          case "csv":
            if (!data.length) {
              content = ""
              break
            }

            // Extract headers from first object
            const firstItem = data[0]
            const headers = Object.keys(firstItem as any)

            // Create CSV content
            const csvRows = [
              headers.join(","), // Header row
              ...data.map(item =>
                headers
                  .map(header => {
                    const value = (item as any)[header]
                    // Escape commas and quotes in values
                    if (
                      typeof value === "string" &&
                      (value.includes(",") || value.includes('"'))
                    ) {
                      return `"${value.replace(/"/g, '""')}"`
                    }
                    return value
                  })
                  .join(",")
              ),
            ]

            if (options.includeMetadata) {
              csvRows.unshift(`# Exported at: ${new Date().toISOString()}`)
              csvRows.unshift(`# Record count: ${data.length}`)
            }

            content = csvRows.join("\n")
            break

          default:
            throw new Error(`Unsupported data export format: ${options.format}`)
        }

        downloadFile(content, filename)

        setExportState(prev => ({
          ...prev,
          isExporting: false,
          lastExport: {
            filename,
            format: options.format,
            timestamp: new Date(),
          },
        }))

        onExportComplete?.(filename, options.format)
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Export failed"
        setExportState(prev => ({
          ...prev,
          isExporting: false,
          error: errorMessage,
        }))
        onExportError?.(errorMessage)
      }
    },
    [
      defaultFilename,
      generateFilename,
      downloadFile,
      onExportStart,
      onExportComplete,
      onExportError,
    ]
  )

  return {
    exportState,
    exportChart,
    exportData,
    downloadFile,
  }
}
