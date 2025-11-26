import { useCallback, useMemo, useState, type ReactNode, useEffect } from 'react'
import { PlaceContext } from './PlaceContext'
import { useMapProvider } from '../mapProvider/MapContext'
import type { Place, UpdatePlace } from '../../types'
import type { PlaceContextValue } from './PlaceContext'

const isLatLngLike = (value: unknown): value is google.maps.LatLngLiteral => {
  if (!value || typeof value !== 'object') {
    return false
  }
  const candidate = value as { lat?: unknown; lng?: unknown }
  return typeof candidate.lat === 'number' && typeof candidate.lng === 'number'
}

const isBoundsLiteral = (value: unknown): value is google.maps.LatLngBoundsLiteral => {
  if (!value || typeof value !== 'object') {
    return false
  }
  const candidate = value as {
    north?: unknown
    south?: unknown
    east?: unknown
    west?: unknown
  }
  return (
    typeof candidate.north === 'number' &&
    typeof candidate.south === 'number' &&
    typeof candidate.east === 'number' &&
    typeof candidate.west === 'number'
  )
}

const normalizeBounds = (bounds: unknown): google.maps.LatLngBoundsLiteral | null => {
  if (!bounds || typeof bounds !== 'object') {
    return null
  }

  if (isBoundsLiteral(bounds)) {
    return bounds
  }

  const candidate = bounds as {
    northEast?: google.maps.LatLngLiteral
    southWest?: google.maps.LatLngLiteral
  }

  if (isLatLngLike(candidate.northEast) && isLatLngLike(candidate.southWest)) {
    return {
      north: candidate.northEast.lat,
      east: candidate.northEast.lng,
      south: candidate.southWest.lat,
      west: candidate.southWest.lng,
    }
  }

  return null
}

const isWithinBounds = (position: google.maps.LatLngLiteral, bounds: unknown): boolean => {
  if (!isLatLngLike(position)) {
    return false
  }

  const normalized = normalizeBounds(bounds)
  if (!normalized) {
    return true
  }

  const { lat, lng } = position
  return (
    lat >= normalized.south &&
    lat <= normalized.north &&
    lng >= normalized.west &&
    lng <= normalized.east
  )
}

type PlaceProviderProps = {
  children: ReactNode
}

function PlaceProvider({ children }: PlaceProviderProps) {
  const [places, setPlaces] = useState<Place[]>([])
  const { mapBounds } = useMapProvider()
  
  useEffect(() => {
    console.log({places, count: places ? places.length : 0});
  }, [places]);

  const addPlace = useCallback(
    (place: Place) => {
      if (!place || typeof place !== 'object') {
        return
      }

      setPlaces((previous) => {
        if (!isLatLngLike(place.position)) {
          return previous
        }

        return [...previous, place]
      })
    },
    [setPlaces],
  )

  const updatePlace = useCallback<UpdatePlace>(
    (id, updates) => {
      if (!id || !updates || typeof updates !== 'object') {
        return
      }

      setPlaces((previous) => {
        let patched = false

        const nextPlaces = previous.map((place) => {
          if (place.id !== id) {
            return place
          }

          const nextPosition =
            updates.position && isLatLngLike(updates.position) ? updates.position : place.position

          patched = true
          return {
            ...place,
            ...updates,
            position: nextPosition,
          }
        })

        return patched ? nextPlaces : previous
      })
    },
    [setPlaces],
  )

  const visiblePlaces = useMemo(() => {
    if (!mapBounds) {
      return places
    }
    return places.filter((place) => isWithinBounds(place.position, mapBounds))
  }, [mapBounds, places])
  
  const value = useMemo<PlaceContextValue>(
    () => ({
      places,
      addPlace,
      updatePlace,
      visiblePlaces,
    }),
    [places, addPlace, updatePlace, visiblePlaces],
  )

  return <PlaceContext.Provider value={value}>{children}</PlaceContext.Provider>
}

export default PlaceProvider

