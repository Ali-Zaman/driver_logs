import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ShareIcon from '@mui/icons-material/Share'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Snackbar from '@mui/material/Snackbar'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError, getTrip } from '../api'
import LogBook from '../components/LogBook'
import RouteMap from '../components/RouteMap'
import ScheduleTimeline from '../components/ScheduleTimeline'
import SummaryStats from '../components/SummaryStats'
import { formatClock, formatDay } from '../format'
import type { Trip } from '../types'

export default function TripPage() {
  const { id } = useParams<{ id: string }>()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!id) return
    getTrip(id)
      .then(setTrip)
      .catch((err) =>
        setError(err instanceof ApiError && err.status === 404 ? 'Trip not found.' : 'Could not load this trip.'),
      )
  }, [id])

  if (error) {
    return (
      <Stack spacing={2} sx={{ alignItems: 'center', pt: 12 }}>
        <Alert severity="error">{error}</Alert>
        <Button component={Link} to="/" startIcon={<ArrowBackIcon />}>
          Plan a new trip
        </Button>
      </Stack>
    )
  }

  if (!trip) {
    return (
      <Stack spacing={2} sx={{ alignItems: 'center', pt: 12 }}>
        <CircularProgress color="primary" />
        <Typography color="text.secondary">Loading trip plan…</Typography>
      </Stack>
    )
  }

  const { plan } = trip

  return (
    <Box sx={{ maxWidth: 1320, mx: 'auto', px: { xs: 2, md: 4 }, py: 3 }}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 3 }} className="no-print">
        <IconButton component={Link} to="/" aria-label="Back to planner">
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h4" noWrap sx={{ lineHeight: 1.1 }}>
            {plan.markers.pickup.name.split(',')[0]}
            <Box component="span" sx={{ color: 'primary.main', mx: 1 }}>
              →
            </Box>
            {plan.markers.dropoff.name.split(',')[0]}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Departs {formatDay(plan.summary.starts_at)} · {formatClock(plan.summary.starts_at)} · cycle
            used {trip.cycle_used_hours}h
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<ShareIcon />}
          onClick={() => {
            navigator.clipboard.writeText(window.location.href)
            setCopied(true)
          }}
        >
          Share
        </Button>
      </Stack>

      <Box className="no-print">
        <SummaryStats plan={plan} />

        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2.5} sx={{ mt: 2.5 }}>
          <Box sx={{ flex: 7, height: { xs: 400, lg: 540 } }}>
            <RouteMap plan={plan} />
          </Box>
          <Box sx={{ flex: 5, height: { xs: 400, lg: 540 } }}>
            <ScheduleTimeline plan={plan} />
          </Box>
        </Stack>
      </Box>

      <Box sx={{ mt: 5 }}>
        <Typography variant="h5" sx={{ mb: 0.5 }} className="no-print">
          Daily log sheets
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }} className="no-print">
          {plan.logs.length} sheet{plan.logs.length > 1 ? 's' : ''} · one per calendar day, drawn to
          the FMCSA grid
        </Typography>
        <LogBook trip={trip} />
      </Box>

      <Snackbar
        open={copied}
        autoHideDuration={2500}
        onClose={() => setCopied(false)}
        message="Link copied to clipboard"
      />
    </Box>
  )
}
