import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: "positive" | "negative" | "neutral"
  icon?: React.ReactNode
  description?: string
  trend?: "up" | "down" | "stable"
  className?: string
}

export function MetricCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon,
  description,
  trend,
  className,
}: MetricCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return ""
      case "down":
        return ""
      case "stable":
        return ""
      default:
        return null
    }
  }

  const getChangeColor = () => {
    switch (changeType) {
      case "positive":
        return "text-green-600 dark:text-green-400"
      case "negative":
        return "text-red-600 dark:text-red-400"
      default:
        return "text-muted-foreground"
    }
  }

  const formatValue = (val: string | number) => {
    if (typeof val === "number") {
      // Format large numbers with commas
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`
      } else if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`
      } else if (val % 1 !== 0) {
        return val.toFixed(2)
      }
      return val.toLocaleString()
    }
    return val
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <span className="text-xl">{icon}</span>}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline space-x-2">
          <div className="text-2xl font-bold">{formatValue(value)}</div>
          {trend && <span className="text-lg">{getTrendIcon()}</span>}
        </div>
        {(change || description) && (
          <div className="mt-1">
            {change && (
              <p className={cn("text-xs", getChangeColor())}>{change}</p>
            )}
            {description && (
              <p className="text-xs text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
