import Autocomplete from '@mui/material/Autocomplete'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import { useEffect, useState, type ReactNode } from 'react'

interface Props {
  label: string
  value: string
  onChange: (value: string) => void
  icon: ReactNode
  placeholder?: string
}

interface PhotonFeature {
  properties: {
    name?: string
    city?: string
    state?: string
    country?: string
  }
}

function suggestionLabel(feature: PhotonFeature): string {
  const { name, city, state, country } = feature.properties
  const parts = [name ?? city, city !== name ? city : undefined, state, country]
  return [...new Set(parts.filter(Boolean))].join(', ')
}

export default function LocationField({ label, value, onChange, icon, placeholder }: Props) {
  const [options, setOptions] = useState<string[]>([])

  useEffect(() => {
    if (value.trim().length < 3) {
      setOptions([])
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://photon.komoot.io/api?q=${encodeURIComponent(value)}&limit=5&lang=en`,
          { signal: controller.signal },
        )
        const data = await response.json()
        const labels = data.features.map(suggestionLabel).filter(Boolean)
        setOptions([...new Set<string>(labels)])
      } catch {
        /* stale or aborted request */
      }
    }, 250)

    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [value])

  return (
    <Autocomplete
      freeSolo
      options={options}
      inputValue={value}
      onInputChange={(_, newValue) => onChange(newValue)}
      filterOptions={(x) => x}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          required
          slotProps={{
            ...params.slotProps,
            input: {
              ...params.slotProps.input,
              startAdornment: (
                <>
                  <InputAdornment position="start">{icon}</InputAdornment>
                  {params.slotProps.input.startAdornment}
                </>
              ),
            },
          }}
        />
      )}
    />
  )
}
