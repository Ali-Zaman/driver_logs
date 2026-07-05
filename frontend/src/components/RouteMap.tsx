import FlagIcon from '@mui/icons-material/Flag'
import HotelIcon from '@mui/icons-material/Hotel'
import LocalCafeIcon from '@mui/icons-material/LocalCafe'
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation'
import MyLocationIcon from '@mui/icons-material/MyLocation'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import WarehouseIcon from '@mui/icons-material/Warehouse'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import { useMemo, useState } from 'react'
import { Layer, Map, Marker, NavigationControl, Popup, Source } from 'react-map-gl/maplibre'
import { formatClock, formatDay, formatHours, formatMiles } from '../format'
import type { Stop, StopType, TripPlan } from '../types'

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

const STOP_STYLES: Record<StopType, { color: string; icon: React.ReactNode; label: string }> = {
  start: { color: '#58A6FF', icon: <MyLocationIcon sx={{ fontSize: 13 }} />, label: 'Start' },
  pickup: { color: '#FFB020', icon: <WarehouseIcon sx={{ fontSize: 13 }} />, label: 'Pickup' },
  dropoff: { color: '#3ECF8E', icon: <FlagIcon sx={{ fontSize: 13 }} />, label: 'Dropoff' },
  fuel: { color: '#F0883E', icon: <LocalGasStationIcon sx={{ fontSize: 13 }} />, label: 'Fuel' },
  break: { color: '#2DD4BF', icon: <LocalCafeIcon sx={{ fontSize: 13 }} />, label: '30m break' },
  rest: { color: '#A78BFA', icon: <HotelIcon sx={{ fontSize: 13 }} />, label: '10h reset' },
  restart: { color: '#F472B6', icon: <RestartAltIcon sx={{ fontSize: 13 }} />, label: '34h restart' },
}

export default function RouteMap({ plan }: { plan: TripPlan }) {
  const [selected, setSelected] = useState<Stop | null>(null)

  const bounds = useMemo(() => {
    const lons = plan.route.geometry.map(([lon]) => lon)
    const lats = plan.route.geometry.map(([, lat]) => lat)
    return [
      [Math.min(...lons), Math.min(...lats)],
      [Math.max(...lons), Math.max(...lats)],
    ] as [[number, number], [number, number]]
  }, [plan])

  const routeGeoJson = useMemo(
    () => ({
      type: 'Feature' as const,
      properties: {},
      geometry: { type: 'LineString' as const, coordinates: plan.route.geometry },
    }),
    [plan],
  )

  const legendTypes = useMemo(() => {
    const present = new Set(plan.stops.map((stop) => stop.type))
    return (Object.keys(STOP_STYLES) as StopType[]).filter((type) => present.has(type))
  }, [plan])

  return (
    <Box sx={{ position: 'relative', height: '100%', minHeight: 420 }}>
      <Map
        initialViewState={{ bounds, fitBoundsOptions: { padding: 60 } }}
        mapStyle={MAP_STYLE}
        style={{ position: 'absolute', inset: 0, borderRadius: 10 }}
        attributionControl={{ compact: true }}
      >
        <NavigationControl position="top-right" showCompass={false} />

        <Source id="route" type="geojson" data={routeGeoJson}>
          <Layer
            id="route-casing"
            type="line"
            paint={{ 'line-color': '#0D1117', 'line-width': 7, 'line-opacity': 0.9 }}
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
          />
          <Layer
            id="route-line"
            type="line"
            paint={{ 'line-color': '#FFB020', 'line-width': 3.5 }}
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
          />
        </Source>

        {plan.stops.map((stop, index) => (
          <Marker
            key={index}
            longitude={stop.lon}
            latitude={stop.lat}
            anchor="center"
            onClick={(event) => {
              event.originalEvent.stopPropagation()
              setSelected(stop)
            }}
          >
            <Box
              sx={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: STOP_STYLES[stop.type].color,
                color: '#0D1117',
                border: '2px solid #0D1117',
                boxShadow: '0 0 10px rgba(0,0,0,0.6)',
                cursor: 'pointer',
                transition: 'transform 0.15s',
                '&:hover': { transform: 'scale(1.25)' },
              }}
            >
              {STOP_STYLES[stop.type].icon}
            </Box>
          </Marker>
        ))}

        {selected && (
          <Popup
            longitude={selected.lon}
            latitude={selected.lat}
            anchor="bottom"
            offset={16}
            onClose={() => setSelected(null)}
            closeButton={false}
          >
            <Box sx={{ color: '#1B2A4A', minWidth: 180 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {selected.label}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block' }}>
                {selected.location}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5, opacity: 0.75 }}>
                {formatDay(selected.start)} · {formatClock(selected.start)}
                {selected.duration_hours > 0 && ` · ${formatHours(selected.duration_hours)}`}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.75 }}>
                Mile {formatMiles(selected.trip_miles)}
              </Typography>
            </Box>
          </Popup>
        )}
      </Map>

      <Paper
        className="no-print"
        sx={{
          position: 'absolute',
          left: 12,
          bottom: 12,
          px: 1.5,
          py: 1,
          bgcolor: 'rgba(13, 17, 23, 0.85)',
          backdropFilter: 'blur(6px)',
        }}
      >
        <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap' }}>
          {legendTypes.map((type) => (
            <Stack key={type} direction="row" spacing={0.6} sx={{ alignItems: 'center' }}>
              <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: STOP_STYLES[type].color }} />
              <Typography variant="caption" color="text.secondary">
                {STOP_STYLES[type].label}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </Paper>
    </Box>
  )
}
