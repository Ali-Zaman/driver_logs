import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import { formatClock, formatDay, formatHours } from '../format'
import type { TripPlan } from '../types'

export default function SummaryStats({ plan }: { plan: TripPlan }) {
  const { summary, stops } = plan
  const restStops = stops.filter((stop) => ['rest', 'restart', 'break'].includes(stop.type)).length
  const fuelStops = stops.filter((stop) => stop.type === 'fuel').length

  const stats = [
    { label: 'Total distance', value: Math.round(summary.total_miles).toLocaleString(), unit: 'mi' },
    { label: 'Driving time', value: formatHours(summary.driving_hours), unit: '' },
    { label: 'Trip duration', value: formatHours(summary.trip_hours), unit: '' },
    { label: 'Log sheets', value: String(summary.days), unit: summary.days > 1 ? 'days' : 'day' },
    { label: 'Rests & breaks', value: String(restStops), unit: '' },
    { label: 'Fuel stops', value: String(fuelStops), unit: '' },
    {
      label: 'Arrival',
      value: formatClock(summary.ends_at),
      unit: formatDay(summary.ends_at),
    },
  ]

  return (
    <Paper sx={{ display: 'flex', flexWrap: 'wrap', overflow: 'hidden' }}>
      {stats.map((stat) => (
        <Box
          key={stat.label}
          sx={{
            flex: '1 1 120px',
            px: 2.5,
            py: 2,
            borderRight: '1px solid',
            borderColor: 'divider',
            '&:last-child': { borderRight: 'none' },
          }}
        >
          <Typography variant="overline" color="text.secondary" sx={{ fontSize: '0.62rem' }}>
            {stat.label}
          </Typography>
          <Typography
            variant="h5"
            sx={{ fontFamily: '"IBM Plex Mono", monospace', fontWeight: 500, whiteSpace: 'nowrap' }}
          >
            {stat.value}
            {stat.unit && (
              <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.6 }}>
                {stat.unit}
              </Typography>
            )}
          </Typography>
        </Box>
      ))}
    </Paper>
  )
}
