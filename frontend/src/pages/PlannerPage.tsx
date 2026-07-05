import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listRecentTrips } from '../api'
import TripForm from '../components/TripForm'
import { formatMiles } from '../format'
import type { RecentTrip } from '../types'

const RULES = ['11h driving', '14h window', '30m break / 8h', '70h cycle', 'Fuel / 1,000 mi']

export default function PlannerPage() {
  const navigate = useNavigate()
  const [recent, setRecent] = useState<RecentTrip[]>([])

  useEffect(() => {
    listRecentTrips().then(setRecent).catch(() => {})
  }, [])

  return (
    <Box
      sx={{
        minHeight: '100%',
        background: `
          radial-gradient(ellipse 60% 40% at 15% 0%, rgba(255, 176, 32, 0.08), transparent),
          radial-gradient(ellipse 50% 40% at 90% 100%, rgba(88, 166, 255, 0.06), transparent),
          radial-gradient(circle, rgba(139, 148, 158, 0.09) 1px, transparent 1px)
        `,
        backgroundSize: 'auto, auto, 28px 28px',
      }}
    >
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2.5, md: 4 }, py: { xs: 4, md: 8 } }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={{ xs: 5, md: 8 }}
          sx={{ alignItems: { md: 'center' } }}
        >
          <Box sx={{ flex: 1.2 }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 3 }}>
              <LocalShippingIcon color="primary" />
              <Typography variant="overline" color="text.secondary">
                FMCSA HOS · Property-carrying · 70h / 8-day
              </Typography>
            </Stack>

            <Typography variant="h1" sx={{ fontSize: { xs: '3rem', md: '4.5rem' }, lineHeight: 1.05 }}>
              Plan the haul.
              <Box component="span" sx={{ color: 'primary.main', display: 'block' }}>
                Log every hour.
              </Box>
            </Typography>

            <Typography color="text.secondary" sx={{ mt: 2.5, mb: 4, maxWidth: 480, fontSize: '1.05rem' }}>
              Enter a trip and get the full picture: the route with every fuel stop, break and
              overnight reset — plus your daily log sheets, already drawn.
            </Typography>

            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
              {RULES.map((rule) => (
                <Chip key={rule} label={rule} variant="outlined" size="small" />
              ))}
            </Stack>

            {recent.length > 0 && (
              <Box sx={{ mt: 6 }} className="no-print">
                <Typography variant="overline" color="text.secondary">
                  Recent trips
                </Typography>
                <List dense disablePadding sx={{ mt: 1, maxWidth: 480 }}>
                  {recent.slice(0, 4).map((trip) => (
                    <ListItemButton
                      key={trip.id}
                      onClick={() => navigate(`/trips/${trip.id}`)}
                      sx={{ borderRadius: 2, px: 1.5 }}
                    >
                      <ListItemText
                        primary={
                          <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                            <Typography variant="body2" noWrap>
                              {trip.pickup_location}
                            </Typography>
                            <ArrowForwardIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                            <Typography variant="body2" noWrap>
                              {trip.dropoff_location}
                            </Typography>
                          </Stack>
                        }
                        secondary={`${formatMiles(trip.summary.total_miles)} · ${trip.summary.days} day${trip.summary.days > 1 ? 's' : ''}`}
                      />
                    </ListItemButton>
                  ))}
                </List>
              </Box>
            )}
          </Box>

          <Paper
            sx={{
              flex: 1,
              p: { xs: 3, md: 4 },
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background:
                  'repeating-linear-gradient(-45deg, #FFB020 0 12px, #14100A 12px 24px)',
              },
            }}
          >
            <Typography variant="h5" sx={{ mb: 0.5 }}>
              Trip details
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              1h pickup & dropoff assumed · fuel every 1,000 miles
            </Typography>
            <TripForm />
          </Paper>
        </Stack>
      </Box>
    </Box>
  )
}
