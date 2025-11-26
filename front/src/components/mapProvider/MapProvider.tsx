import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { MapContext } from './MapContext'
import type { CameraSettings, CameraSettingsUpdate, MapContextValue } from './MapContext'

const DEFAULT_CAMERA_SETTINGS: CameraSettings = {
  center: { lat: 40.71625, lng: -73.996221 },
  zoom: 17,
}

const URL_UPDATE_THROTTLE_MS = 1000

const cloneDefaults = (): CameraSettings => ({
  center: { ...DEFAULT_CAMERA_SETTINGS.center },
  zoom: DEFAULT_CAMERA_SETTINGS.zoom,
})

const parseOrDefault = (value: string | null, fallback: number) => {
  const parsed = Number.parseFloat(value ?? '')
  return Number.isFinite(parsed) ? parsed : fallback
}

const getInitialCameraSettings = (): CameraSettings => {
  const defaults = cloneDefaults()
  if (typeof window === 'undefined') {
    return defaults
  }

  const params = new URLSearchParams(window.location.search)
  return {
    center: {
      lat: parseOrDefault(params.get('lat'), defaults.center.lat),
      lng: parseOrDefault(params.get('lng'), defaults.center.lng),
    },
    zoom: parseOrDefault(params.get('zoom'), defaults.zoom),
  }
}

const mergeCameraSettings = (previous: CameraSettings, nextValue?: CameraSettingsUpdate | null) => {
  if (!nextValue) {
    return previous
  }

  const merged = {
    ...previous,
    ...nextValue,
  }

  if (nextValue.center) {
    merged.center = {
      ...previous.center,
      ...nextValue.center,
    }
  } else if (!merged.center) {
    merged.center = { ...previous.center }
  }

  if (typeof merged.zoom !== 'number') {
    merged.zoom = previous.zoom
  }

  if ('bounds' in merged) {
    delete merged.bounds
  }

  return merged
}

type MapProviderProps = {
  children: ReactNode
}

function MapProvider({ children }: MapProviderProps) {
  const [cameraSettings, updateCameraSettings] = useState<CameraSettings>(getInitialCameraSettings)
  const [mapBounds, setMapBounds] = useState<google.maps.LatLngBoundsLiteral | null>(null)
  const latestCameraRef = useRef<CameraSettings>(cameraSettings)
  const lastUrlUpdateRef = useRef<number>(0)
  const pendingUpdateRef = useRef<number | null>(null)

  const setCameraSettings = useCallback(
    (
      updater: CameraSettingsUpdate | ((previous: CameraSettings) => CameraSettingsUpdate | null),
    ) => {
      updateCameraSettings((previous) => {
        const value = typeof updater === 'function' ? updater(previous) : updater
        if (!value) {
          return previous
        }

        const { bounds, ...cameraUpdate } = value
        if (bounds) {
          setMapBounds(bounds)
        }

        return mergeCameraSettings(previous, cameraUpdate)
      })
    },
    [setMapBounds, updateCameraSettings],
  )

  const applyCameraSettingsToUrl = useCallback(() => {
    if (typeof window === 'undefined') {
      return
    }

    const params = new URLSearchParams(window.location.search)
    params.set('lat', String(latestCameraRef.current.center.lat))
    params.set('lng', String(latestCameraRef.current.center.lng))
    params.set('zoom', String(latestCameraRef.current.zoom))

    const nextSearch = params.toString()
    const nextQuery = nextSearch ? `?${nextSearch}` : ''
    if (window.location.search !== nextQuery) {
      const nextUrl = `${window.location.pathname}${nextQuery}${window.location.hash ?? ''}`
      window.history.replaceState(null, '', nextUrl)
    }

    lastUrlUpdateRef.current = Date.now()
    pendingUpdateRef.current = null
  }, [])

  const scheduleUrlUpdate = useCallback(() => {
    if (typeof window === 'undefined') {
      return
    }

    const now = Date.now()
    const elapsed = now - lastUrlUpdateRef.current

    if (elapsed >= URL_UPDATE_THROTTLE_MS) {
      applyCameraSettingsToUrl()
      return
    }

    if (pendingUpdateRef.current) {
      return
    }

    pendingUpdateRef.current = window.setTimeout(
      applyCameraSettingsToUrl,
      URL_UPDATE_THROTTLE_MS - elapsed,
    )
  }, [applyCameraSettingsToUrl])

  useEffect(() => {
    latestCameraRef.current = cameraSettings
    scheduleUrlUpdate()
  }, [cameraSettings, scheduleUrlUpdate])

  useEffect(
    () => () => {
      if (pendingUpdateRef.current && typeof window !== 'undefined') {
        window.clearTimeout(pendingUpdateRef.current)
      }
    },
    [],
  )

  const contextValue = useMemo<MapContextValue>(
    () => ({
      cameraSettings,
      setCameraSettings,
      mapBounds,
      setMapBounds,
    }),
    [cameraSettings, mapBounds, setCameraSettings, setMapBounds],
  )

  return <MapContext.Provider value={contextValue}>{children}</MapContext.Provider>
}

export default MapProvider


