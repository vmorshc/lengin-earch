export interface Place {
  id?: string | number;
  location: google.maps.LatLngLiteral;
  description?: string;
}

export type UpdatePlace = (id: Place["id"], updates: Partial<Place>) => void;
