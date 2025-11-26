import { AdvancedMarker, Map, type MapMouseEvent } from '@vis.gl/react-google-maps'
import { useCallback, useEffect, useState } from 'react'
import type { Place } from '../types'
import { useTheme } from './themeProvider/ThemeContext'
import { useMapProvider } from './mapProvider/MapContext'
import { usePlaces } from './placeProvider/PlaceContext'
import PlacePanel from './PlacePanel'

type PendingPlace = {
  id?: Place['id']
  position: google.maps.LatLngLiteral
  description: string
}

const createPlaceId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function JourneyMap() {
  const { theme } = useTheme()
  const { cameraSettings, setCameraSettings } = useMapProvider()
  const { addPlace, updatePlace, visiblePlaces } = usePlaces()
  const [pendingPlace, setPendingPlace] = useState<PendingPlace | null>(null)
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  const mapId = `${import.meta.env.VITE_GOOGLE_MAP_ID ?? 'DEMO_MAP_ID'}`
  const mapColorScheme: 'DARK' | 'LIGHT' = theme === 'dark' ? 'DARK' : 'LIGHT'

  const persistPlace = useCallback(
    (place: PendingPlace | null) => {
      if (!place) {
        return
      }
      const description = place.description.trim()
      if (!description) {
        return
      }
      if (place.id) {
        updatePlace(place.id, {
          description,
          position: place.position,
        })
        return
      }

      addPlace({
        id: createPlaceId(),
        position: place.position,
        description,
      })
    },
    [addPlace, updatePlace],
  )
  const handleMarkerClick = useCallback(
    (place: Place) => {
      setPendingPlace({
        id: place.id,
        position: place.position,
        description: place.description ?? '',
      })
    },
    [setPendingPlace],
  )


  const handleMapClick = useCallback(
    (event: MapMouseEvent) => {
      if (pendingPlace) {
        return
      }

      const latLng = event.detail.latLng
      if (!latLng) {
        return
      }

      setPendingPlace({
        position: latLng,
        description: '',
      })
    },
    [pendingPlace],
  )

  const handlePanelClose = useCallback(() => {
    persistPlace(pendingPlace)
    setTimeout(() => {
      setPendingPlace(null)
    }, 300)
  }, [pendingPlace, persistPlace])

  const handleDescriptionChange = useCallback((value: string) => {
    setPendingPlace((previous) => {
      if (!previous) {
        return previous
      }

      return {
        ...previous,
        description: value,
      }
    })
  }, [])
  
  useEffect(() => {
    console.log({visiblePlaces, count: visiblePlaces ? visiblePlaces.length : 0});
  }, [visiblePlaces]);

  if (!apiKey) {
    return (
      <div className="alert alert-warning">
        <span>Set VITE_GOOGLE_MAPS_API_KEY in your .env file to load the map.</span>
      </div>
    )
  }

  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-box border border-base-300 bg-base-100"
      aria-label="Map for points">
      <Map
        style={{ width: '100%', height: '100%' }}
        center={cameraSettings.center}
        zoom={cameraSettings.zoom}
        gestureHandling="greedy"
        disableDefaultUI
        colorScheme={mapColorScheme}
        onClick={handleMapClick}
        onCameraChanged={(event) =>
          setCameraSettings({
            center: event.detail.center,
            zoom: event.detail.zoom,
            bounds: event.detail.bounds,
          })
        }
        mapId={mapId}
      >
        {visiblePlaces.map((place) => (
          <AdvancedMarker
            key={place.id ?? `${place.position.lat}-${place.position.lng}-${place.description ?? ''}`}
            position={place.position}
            title={place.description}
            onClick={() => handleMarkerClick(place)}
          />
        ))}
      </Map>

      {pendingPlace ? (
        <PlacePanel
          mode={pendingPlace.id ? 'edit' : 'create'}
          position={pendingPlace.position}
          description={pendingPlace.description}
          onDescriptionChange={handleDescriptionChange}
          onClose={handlePanelClose}
        />
      ) : null}
    </div>
  )
}

export default JourneyMap

