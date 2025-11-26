export interface Place {
  id?: string | number
  position: google.maps.LatLngLiteral
  description?: string
}

export type UpdatePlace = (id: Place['id'], updates: Partial<Place>) => void
