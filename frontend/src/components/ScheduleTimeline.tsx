import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useMemo } from 'react'
import { formatClock, formatDate, formatHours } from '../format'
import { statusColors, statusLabels } from '../theme'
import type { TripPlan, TripSegment } from '../types'

function groupByDay(segments: TripSegment[]): Map<string, TripSegment[]> {
  const days = new Map<string, TripSegment[]>()
  for (const segment of segments) {
    const date = segment.start.slice(0, 10)
    days.set(date, [...(days.get(date) ?? []), segment])
  }
  return days
}

export default function ScheduleTimeline({ plan }: { plan: TripPlan }) {
  const days = useMemo(() => groupByDay(plan.segments), [plan])

  return (
    <Paper sx={{ height: '100%', overflow: 'auto' }}>
      {[...days.entries()].map(([date, segments], dayIndex) => (
        <Box key={date}>
          <Box
            sx={{
              position: 'sticky',
              top: 0,
              zIndex: 1,
              px: 2.5,
              py: 1,
              bgcolor: 'background.paper',
              borderBottom: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="overline" color="primary">
              Day {dayIndex + 1} — {formatDate(date)}
            </Typography>
          </Box>

          {segments.map((segment, index) => (
            <Stack
              key={index}
              direction="row"
              spacing={1.5}
              sx={{ alignItems: 'center', px: 2.5, py: 1.1, borderBottom: '1px solid', borderColor: 'divider' }}
            >
              <Typography
                variant="caption"
                sx={{ fontFamily: '"IBM Plex Mono", monospace', width: 64, flexShrink: 0 }}
                color="text.secondary"
              >
                {formatClock(segment.start)}
              </Typography>
              <Box
                sx={{
                  width: 4,
                  alignSelf: 'stretch',
                  borderRadius: 2,
                  bgcolor: statusColors[segment.status],
                  flexShrink: 0,
                }}
              />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="body2" noWrap>
                  {segment.label}
                  {segment.miles > 0 && (
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                      {Math.round(segment.miles)} mi
                    </Typography>
                  )}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {statusLabels[segment.status]} · {formatHours((new Date(segment.end).getTime() - new Date(segment.start).getTime()) / 3600000)}
                </Typography>
              </Box>
            </Stack>
          ))}
        </Box>
      ))}
    </Paper>
  )
}
