export type TrendResult = {
  trend: number | 'N/A' // The raw percentage or 'N/A'
  trendflow: 'High' | 'Low' | 'Neutral' // For UI styling (e.g., green/red/grey)
  label: string // Human-readable string (e.g., "2.5% Higher than last week")
}
