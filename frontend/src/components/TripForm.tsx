import FlagIcon from '@mui/icons-material/Flag'
import MyLocationIcon from '@mui/icons-material/MyLocation'
import WarehouseIcon from '@mui/icons-material/Warehouse'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Slider from '@mui/material/Slider'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError, createTrip } from '../api'
import LocationField from './LocationField'

function localNowRoundedIso(): string {
  const now = new Date()
  now.setMinutes(now.getMinutes() + (15 - (now.getMinutes() % 15)), 0, 0)
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export default function TripForm() {
  const navigate = useNavigate()
  const [current, setCurrent] = useState('')
  const [pickup, setPickup] = useState('')
  const [dropoff, setDropoff] = useState('')
  const [cycleUsed, setCycleUsed] = useState(0)
  const [startTime, setStartTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const trip = await createTrip({
        current_location: current,
        pickup_location: pickup,
        dropoff_location: dropoff,
        cycle_used_hours: cycleUsed,
        start_time: startTime || localNowRoundedIso(),
        timezone_name: Intl.DateTimeFormat().resolvedOptions().timeZone,
      })
      navigate(`/trips/${trip.id}`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the server.')
      setLoading(false)
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={2.5}>
        <LocationField
          label="Current location"
          value={current}
          onChange={setCurrent}
          icon={<MyLocationIcon fontSize="small" />}
          placeholder="Chicago, IL"
        />
        <LocationField
          label="Pickup location"
          value={pickup}
          onChange={setPickup}
          icon={<WarehouseIcon fontSize="small" />}
          placeholder="Denver, CO"
        />
        <LocationField
          label="Dropoff location"
          value={dropoff}
          onChange={setDropoff}
          icon={<FlagIcon fontSize="small" />}
          placeholder="Los Angeles, CA"
        />

        <Box>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Typography variant="body2" color="text.secondary">
              Cycle used (70h / 8 days)
            </Typography>
            <Typography sx={{ fontFamily: '"IBM Plex Mono", monospace' }} color="primary">
              {cycleUsed.toFixed(1)} h
            </Typography>
          </Stack>
          <Slider
            value={cycleUsed}
            onChange={(_, value) => setCycleUsed(value as number)}
            min={0}
            max={70}
            step={0.5}
            marks={[0, 17.5, 35, 52.5, 70].map((v) => ({ value: v, label: `${v}` }))}
            sx={{ '& .MuiSlider-markLabel': { fontFamily: '"IBM Plex Mono", monospace', fontSize: '0.7rem' } }}
          />
        </Box>

        <TextField
          label="Departure time"
          type="datetime-local"
          value={startTime}
          onChange={(event) => setStartTime(event.target.value)}
          helperText="Leave empty to depart now"
          slotProps={{ inputLabel: { shrink: true } }}
        />

        {error && <Alert severity="error">{error}</Alert>}

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={loading || !current || !pickup || !dropoff}
          startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}
          sx={{ py: 1.4 }}
        >
          {loading ? 'Planning route…' : 'Plan trip & draw logs'}
        </Button>
      </Stack>
    </Box>
  )
}
