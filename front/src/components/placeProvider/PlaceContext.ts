import { createContext, useContext } from 'react'
import type { Place, UpdatePlace } from '../../types'

export interface PlaceContextValue {
  places: Place[]
  addPlace: (place: Place) => void
  updatePlace: UpdatePlace
  visiblePlaces: Place[]
}

const PlaceContext = createContext<PlaceContextValue | null>(null)

const usePlaces = (): PlaceContextValue => {
  const context = useContext(PlaceContext)
  if (!context) {
    throw new Error('usePlaces must be used within a PlaceProvider')
  }
  return context
}

export { PlaceContext, usePlaces }
