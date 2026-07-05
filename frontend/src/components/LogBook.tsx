import PrintIcon from '@mui/icons-material/Print'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import { useMemo, useState } from 'react'
import { formatDay } from '../format'
import type { Trip } from '../types'
import DailyLogSheet from './DailyLogSheet'

export default function LogBook({ trip }: { trip: Trip }) {
  const [active, setActive] = useState(0)
  const logs = trip.plan.logs
  const manifest = `SPT-${trip.id.slice(0, 8).toUpperCase()}`

  const endpoints = useMemo(() => {
    let lastLocation = trip.plan.markers.current.name
    return logs.map((log) => {
      const locations = log.remarks
        .map((remark) => remark.text.split(' — ')[1])
        .filter(Boolean)
      const from = lastLocation
      const to = locations.length > 0 ? locations[locations.length - 1] : lastLocation
      lastLocation = to
      return { from, to }
    })
  }, [trip, logs])

  return (
    <Box>
      <Stack
        direction="row"
        sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
        className="no-print"
      >
        <Tabs
          value={active}
          onChange={(_, value) => setActive(value)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {logs.map((log, index) => (
            <Tab key={log.date} label={`Day ${index + 1} · ${formatDay(`${log.date}T00:00:00`)}`} />
          ))}
        </Tabs>
        <Button
          variant="outlined"
          size="small"
          startIcon={<PrintIcon />}
          onClick={() => window.print()}
          sx={{ flexShrink: 0, ml: 2 }}
        >
          Print all
        </Button>
      </Stack>

      {logs.map((log, index) => (
        <Box
          key={log.date}
          className="print-sheet"
          sx={{
            display: index === active ? 'block' : 'none',
            borderRadius: 2.5,
            overflow: 'hidden',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.45)',
          }}
        >
          <DailyLogSheet
            log={log}
            from={endpoints[index].from}
            to={endpoints[index].to}
            manifest={manifest}
          />
        </Box>
      ))}
    </Box>
  )
}
