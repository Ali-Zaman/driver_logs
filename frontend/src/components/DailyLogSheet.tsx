import Box from '@mui/material/Box'
import type { DailyLog, DutyStatus } from '../types'

const INK = '#1B2A4A'
const PAPER = '#FBF7ED'

const STATUS_INK: Record<DutyStatus, string> = {
  off_duty: '#1F8A5D',
  sleeper_berth: '#7C3AED',
  driving: '#D97706',
  on_duty: '#2563EB',
}

const ROWS: { status: DutyStatus; lines: string[] }[] = [
  { status: 'off_duty', lines: ['1. OFF DUTY'] },
  { status: 'sleeper_berth', lines: ['2. SLEEPER', 'BERTH'] },
  { status: 'driving', lines: ['3. DRIVING'] },
  { status: 'on_duty', lines: ['4. ON DUTY', '(NOT DRIVING)'] },
]

const X0 = 118
const HOUR_W = 34
const X1 = X0 + 24 * HOUR_W
const GRID_Y = 206
const ROW_H = 38
const GRID_BOTTOM = GRID_Y + 4 * ROW_H

const hourX = (hour: number) => X0 + hour * HOUR_W
const rowCenter = (status: DutyStatus) =>
  GRID_Y + ROWS.findIndex((row) => row.status === status) * ROW_H + ROW_H / 2

function fmtHM(hours: number): string {
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h}:${String(m).padStart(2, '0')}`
}

function hourLabel(hour: number): string {
  if (hour === 0 || hour === 24) return 'Mid'
  if (hour === 12) return 'Noon'
  return String(hour % 12)
}

interface Props {
  log: DailyLog
  from: string
  to: string
  manifest: string
}

export default function DailyLogSheet({ log, from, to, manifest }: Props) {
  const [year, month, day] = log.date.split('-')
  const caption = { fontSize: 7.5, fill: INK, opacity: 0.75 }
  const mono = { fontFamily: '"IBM Plex Mono", monospace', fill: INK }
  const condensed = { fontFamily: '"Barlow Condensed", sans-serif', fill: INK }

  return (
    <Box
      component="svg"
      viewBox="0 0 1000 672"
      sx={{ width: '100%', display: 'block', fontFamily: '"Barlow", sans-serif' }}
      role="img"
      aria-label={`Daily log for ${log.date}`}
    >
      <rect width={1000} height={672} fill={PAPER} rx={4} />
      <rect x={10} y={10} width={980} height={652} fill="none" stroke={INK} strokeWidth={1.5} rx={2} />

      {/* Header */}
      <text x={28} y={52} {...condensed} fontSize={27} fontWeight={700} letterSpacing={1}>
        DRIVER'S DAILY LOG
      </text>
      <text x={28} y={68} fontSize={8.5} fill={INK} letterSpacing={1.4}>
        (ONE CALENDAR DAY — 24 HOURS)
      </text>

      {[
        [month, '(MONTH)', 400],
        [day, '(DAY)', 470],
        [year, '(YEAR)', 540],
      ].map(([value, label, x]) => (
        <g key={label as string}>
          <text x={(x as number) + 25} y={50} {...mono} fontSize={15} textAnchor="middle">
            {value}
          </text>
          <line x1={x as number} y1={56} x2={(x as number) + 50} y2={56} stroke={INK} strokeWidth={0.8} />
          <text x={(x as number) + 25} y={66} {...caption} textAnchor="middle">
            {label}
          </text>
        </g>
      ))}

      <text x={972} y={42} fontSize={8} fill={INK} textAnchor="end">
        ORIGINAL — File at home terminal.
      </text>
      <text x={972} y={54} fontSize={8} fill={INK} textAnchor="end">
        DUPLICATE — Driver retains possession for 8 days.
      </text>

      {/* From / To */}
      <text x={28} y={95} fontSize={10} fill={INK} fontWeight={600}>
        From:
      </text>
      <text x={265} y={94} {...mono} fontSize={10.5} textAnchor="middle">
        {from}
      </text>
      <line x1={62} y1={98} x2={468} y2={98} stroke={INK} strokeWidth={0.8} />
      <text x={520} y={95} fontSize={10} fill={INK} fontWeight={600}>
        To:
      </text>
      <text x={758} y={94} {...mono} fontSize={10.5} textAnchor="middle">
        {to}
      </text>
      <line x1={545} y1={98} x2={972} y2={98} stroke={INK} strokeWidth={0.8} />

      {/* Miles + carrier boxes */}
      <rect x={28} y={114} width={170} height={34} fill="none" stroke={INK} strokeWidth={1} />
      <text x={113} y={136} {...mono} fontSize={14} textAnchor="middle">
        {Math.round(log.miles).toLocaleString()}
      </text>
      <text x={113} y={160} {...caption} textAnchor="middle">
        Total Miles Driving Today
      </text>

      <rect x={218} y={114} width={170} height={34} fill="none" stroke={INK} strokeWidth={1} />
      <text x={303} y={136} {...mono} fontSize={12} textAnchor="middle">
        TRK-4127 / TRL-889
      </text>
      <text x={303} y={160} {...caption} textAnchor="middle">
        Truck/Tractor & Trailer Numbers
      </text>

      <text x={766} y={124} {...mono} fontSize={11} textAnchor="middle">
        Spotter Freightways Inc.
      </text>
      <line x1={560} y1={128} x2={972} y2={128} stroke={INK} strokeWidth={0.8} />
      <text x={766} y={137} {...caption} textAnchor="middle">
        Name of Carrier
      </text>
      <text x={766} y={152} {...mono} fontSize={11} textAnchor="middle">
        600 W Chicago Ave, Chicago, IL
      </text>
      <line x1={560} y1={156} x2={972} y2={156} stroke={INK} strokeWidth={0.8} />
      <text x={766} y={165} {...caption} textAnchor="middle">
        Main Office Address
      </text>

      {/* Hour scale */}
      {Array.from({ length: 25 }, (_, hour) => (
        <text key={hour} x={hourX(hour)} y={198} {...mono} fontSize={8} textAnchor="middle">
          {hourLabel(hour)}
        </text>
      ))}
      <text x={953} y={192} {...caption} fontSize={7} textAnchor="middle">
        TOTAL
      </text>
      <text x={953} y={200} {...caption} fontSize={7} textAnchor="middle">
        HOURS
      </text>

      {/* Grid */}
      {ROWS.map((row, index) => (
        <g key={row.status}>
          <rect
            x={X0}
            y={GRID_Y + index * ROW_H}
            width={X1 - X0}
            height={ROW_H}
            fill={STATUS_INK[row.status]}
            opacity={0.04}
          />
          {row.lines.map((line, lineIndex) => (
            <text
              key={line}
              x={X0 - 8}
              y={GRID_Y + index * ROW_H + ROW_H / 2 + lineIndex * 10 - (row.lines.length - 1) * 4}
              {...condensed}
              fontSize={9.5}
              fontWeight={600}
              textAnchor="end"
            >
              {line}
            </text>
          ))}
        </g>
      ))}

      {Array.from({ length: 25 }, (_, hour) => (
        <line
          key={hour}
          x1={hourX(hour)}
          y1={GRID_Y}
          x2={hourX(hour)}
          y2={GRID_BOTTOM}
          stroke={INK}
          strokeWidth={hour % 12 === 0 ? 1 : 0.4}
          opacity={hour % 12 === 0 ? 0.9 : 0.45}
        />
      ))}

      {Array.from({ length: 24 }, (_, hour) =>
        ROWS.map((_, rowIndex) =>
          [8.5, 17, 25.5].map((offset, tickIndex) => (
            <line
              key={`${hour}-${rowIndex}-${tickIndex}`}
              x1={hourX(hour) + offset}
              y1={GRID_Y + rowIndex * ROW_H}
              x2={hourX(hour) + offset}
              y2={GRID_Y + rowIndex * ROW_H + (tickIndex === 1 ? 9 : 5)}
              stroke={INK}
              strokeWidth={0.5}
              opacity={0.6}
            />
          )),
        ),
      )}

      {[0, 1, 2, 3, 4].map((index) => (
        <line
          key={index}
          x1={X0}
          y1={GRID_Y + index * ROW_H}
          x2={X1}
          y2={GRID_Y + index * ROW_H}
          stroke={INK}
          strokeWidth={index === 0 || index === 4 ? 1.5 : 0.8}
        />
      ))}
      <rect x={X0} y={GRID_Y} width={X1 - X0} height={4 * ROW_H} fill="none" stroke={INK} strokeWidth={1.5} />

      {/* Duty status line */}
      {log.entries.map((entry, index) => {
        const previous = log.entries[index - 1]
        const y = rowCenter(entry.status)
        return (
          <g key={index}>
            {previous && previous.status !== entry.status && (
              <line
                x1={hourX(entry.start_hour)}
                y1={rowCenter(previous.status)}
                x2={hourX(entry.start_hour)}
                y2={y}
                stroke={INK}
                strokeWidth={1.6}
              />
            )}
            <line
              x1={hourX(entry.start_hour)}
              y1={y}
              x2={hourX(entry.end_hour)}
              y2={y}
              stroke={STATUS_INK[entry.status]}
              strokeWidth={3}
              strokeLinecap="round"
            >
              <title>{`${entry.label}: ${fmtHM(entry.start_hour)} – ${fmtHM(entry.end_hour)}`}</title>
            </line>
          </g>
        )
      })}

      {/* Totals column */}
      <line x1={972} y1={GRID_Y} x2={972} y2={GRID_BOTTOM} stroke={INK} strokeWidth={1.5} />
      {ROWS.map((row) => (
        <text
          key={row.status}
          x={953}
          y={rowCenter(row.status) + 4}
          {...mono}
          fontSize={11.5}
          textAnchor="middle"
        >
          {fmtHM(log.totals[row.status])}
        </text>
      ))}
      <text x={953} y={GRID_BOTTOM + 16} {...mono} fontSize={11} textAnchor="middle" fontWeight={600}>
        = 24:00
      </text>

      {/* Remarks */}
      <text x={28} y={392} {...condensed} fontSize={12} fontWeight={700} letterSpacing={1}>
        REMARKS
      </text>
      <line x1={X0} y1={410} x2={X1} y2={410} stroke={INK} strokeWidth={0.8} />
      {log.remarks.map((remark, index) => (
        <g key={index}>
          <line
            x1={hourX(remark.hour)}
            y1={402}
            x2={hourX(remark.hour)}
            y2={414}
            stroke={INK}
            strokeWidth={1.2}
          />
          <text
            transform={`translate(${hourX(remark.hour) + 3}, 418) rotate(45)`}
            fontSize={9}
            fontStyle="italic"
            fill={INK}
          >
            {remark.text.length > 32 ? `${remark.text.slice(0, 31)}…` : remark.text}
          </text>
        </g>
      ))}
      <line x1={18} y1={508} x2={982} y2={508} stroke={INK} strokeWidth={0.6} opacity={0.5} />

      {/* Shipping documents */}
      <text x={28} y={528} {...condensed} fontSize={11} fontWeight={600} letterSpacing={0.8}>
        SHIPPING DOCUMENTS:
      </text>
      <text x={290} y={545} {...mono} fontSize={10} textAnchor="middle">
        {manifest}
      </text>
      <line x1={160} y1={549} x2={430} y2={549} stroke={INK} strokeWidth={0.8} />
      <text x={295} y={559} {...caption} textAnchor="middle">
        DVL or Manifest No.
      </text>
      <text x={290} y={574} {...mono} fontSize={10} textAnchor="middle">
        General Freight
      </text>
      <line x1={160} y1={578} x2={430} y2={578} stroke={INK} strokeWidth={0.8} />
      <text x={295} y={588} {...caption} textAnchor="middle">
        Shipper & Commodity
      </text>

      <text x={560} y={534} fontSize={7.5} fill={INK} opacity={0.8}>
        Enter name of place you reported and where released from work and when
      </text>
      <text x={560} y={544} fontSize={7.5} fill={INK} opacity={0.8}>
        and where each change of duty occurred. Use time standard of home terminal.
      </text>

      {/* Recap */}
      <line x1={18} y1={598} x2={982} y2={598} stroke={INK} strokeWidth={0.6} opacity={0.5} />
      <text x={28} y={618} {...condensed} fontSize={11} fontWeight={700} letterSpacing={1}>
        RECAP — 70 HOUR / 8 DAY
      </text>
      {[
        [fmtHM(log.recap.on_duty_today), 'On duty hours today', 250],
        [fmtHM(log.recap.cycle_used), 'A. Total on duty last 8 days', 430],
        [fmtHM(log.recap.cycle_available), 'B. Available tomorrow (70 − A)', 610],
      ].map(([value, label, x]) => (
        <g key={label as string}>
          <rect x={x as number} y={606} width={150} height={30} fill="none" stroke={INK} strokeWidth={1} />
          <text x={(x as number) + 75} y={626} {...mono} fontSize={12.5} textAnchor="middle">
            {value}
          </text>
          <text x={(x as number) + 75} y={648} {...caption} textAnchor="middle">
            {label}
          </text>
        </g>
      ))}
      <line x1={800} y1={632} x2={972} y2={632} stroke={INK} strokeWidth={0.8} />
      <text x={886} y={644} {...caption} textAnchor="middle">
        Driver's Signature in Full
      </text>
    </Box>
  )
}
