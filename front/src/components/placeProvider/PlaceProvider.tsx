import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { PlaceContext } from "./PlaceContext";
import { useMapProvider } from "../mapProvider/MapContext";
import type { Place, UpdatePlace } from "../../types";
import type { PlaceContextValue } from "./PlaceContext";
import {
  listPlacesEndpointPlacesGetResponse,
  useCreatePlaceEndpointPlacesPost,
  useListPlacesEndpointPlacesGet,
} from "src/api/places/places";
import { Place as ApiPlace } from "src/api/model/place";
import { useInfiniteListPlacesEndpointPlacesGet } from "src/api/custom/places/places";
import { MAX_PLACES_ON_CLIENT } from "src/costants";

const hasPlaceId = (
  place: Place,
): place is Place & { id: NonNullable<Place["id"]> } =>
  place.id !== undefined && place.id !== null;

const mergePlacesById = (previous: Place[], incoming: Place[]): Place[] => {
  if (!incoming.length) {
    return previous;
  }

  const nextPlaces = [...previous];
  const indexById = new Map<NonNullable<Place["id"]>, number>();

  previous.forEach((place, index) => {
    if (!hasPlaceId(place) || indexById.has(place.id)) {
      return;
    }
    indexById.set(place.id, index);
  });

  incoming.forEach((place) => {
    if (!hasPlaceId(place)) {
      nextPlaces.push(place);
      return;
    }

    const existingIndex = indexById.get(place.id);

    if (existingIndex === undefined) {
      indexById.set(place.id, nextPlaces.length);
      nextPlaces.push(place);
      return;
    }

    nextPlaces[existingIndex] = place;
  });

  return nextPlaces;
};

const isLatLngLike = (value: unknown): value is google.maps.LatLngLiteral => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as { lat?: unknown; lng?: unknown };
  return typeof candidate.lat === "number" && typeof candidate.lng === "number";
};

const isBoundsLiteral = (
  value: unknown,
): value is google.maps.LatLngBoundsLiteral => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as {
    north?: unknown;
    south?: unknown;
    east?: unknown;
    west?: unknown;
  };
  return (
    typeof candidate.north === "number" &&
    typeof candidate.south === "number" &&
    typeof candidate.east === "number" &&
    typeof candidate.west === "number"
  );
};

const normalizeBounds = (
  bounds: unknown,
): google.maps.LatLngBoundsLiteral | null => {
  if (!bounds || typeof bounds !== "object") {
    return null;
  }

  if (isBoundsLiteral(bounds)) {
    return bounds;
  }

  const candidate = bounds as {
    northEast?: google.maps.LatLngLiteral;
    southWest?: google.maps.LatLngLiteral;
  };

  if (isLatLngLike(candidate.northEast) && isLatLngLike(candidate.southWest)) {
    return {
      north: candidate.northEast.lat,
      east: candidate.northEast.lng,
      south: candidate.southWest.lat,
      west: candidate.southWest.lng,
    };
  }

  return null;
};

const isWithinBounds = (
  position: google.maps.LatLngLiteral,
  bounds: unknown,
): boolean => {
  if (!isLatLngLike(position)) {
    return false;
  }

  const normalized = normalizeBounds(bounds);
  if (!normalized) {
    return true;
  }

  const { lat, lng } = position;
  return (
    lat >= normalized.south &&
    lat <= normalized.north &&
    lng >= normalized.west &&
    lng <= normalized.east
  );
};

type PlaceProviderProps = {
  children: ReactNode;
};

function PlaceProvider({ children }: PlaceProviderProps) {
  const { mapBounds } = useMapProvider();
  const { clusterCenter } = useMapProvider();
  const { mutate: createPlace } = useCreatePlaceEndpointPlacesPost();
  const [places, setPlaces] = useState<Place[]>([]);
  const { data, isLoading, hasNextPage, fetchNextPage } =
    useInfiniteListPlacesEndpointPlacesGet({
      lat: clusterCenter.lat,
      lng: clusterCenter.lng,
    });

  useEffect(() => {
    if (isLoading) return;
    if (!data) return;

    const currentPageNum = data?.pageParams.at(-1);
    const currentPage = data?.pages[currentPageNum];

    if (currentPage?.status !== 200) return;
    if (currentPage.data?.status !== "success") return;

    const payload = currentPage?.data?.payload;
    if (!Array.isArray(payload) || payload.length === 0) {
      return;
    }

    const newPlaces = payload.map<Place>((place: ApiPlace) => ({
      ...place,
      location: { lng: place.location[0], lat: place.location[1] },
    }));

    setPlaces((previous) => mergePlacesById(previous, newPlaces));
  }, [data, isLoading]);

  const addPlace = useCallback(
    (place: Place) => {
      if (
        !place ||
        typeof place !== "object" ||
        !isLatLngLike(place.location)
      ) {
        return;
      }

      setPlaces((previous) => [...previous, place]);

      const description = place.description?.trim();
      if (!description) {
        return;
      }

      createPlace(
        {
          data: {
            description,
            location: {
              lat: place.location.lat,
              lng: place.location.lng,
            },
          },
        },
        {
          onSuccess: (resp) => {
            if (resp.data?.status === "success") {
              place.id = resp.data?.payload?.id;
            }
          },
        },
      );
    },
    [createPlace],
  );

  useEffect(() => {
    console.log({ places });
  }, [places]);

  const updatePlace = useCallback<UpdatePlace>(
    (id, updates) => {
      if (!id || !updates || typeof updates !== "object") {
        return;
      }

      setPlaces((previous) => {
        let patched = false;

        const nextPlaces = previous.map((place) => {
          if (place.id !== id) {
            return place;
          }

          const nextPosition =
            updates.location && isLatLngLike(updates.location)
              ? updates.location
              : place.location;

          patched = true;
          return {
            ...place,
            ...updates,
            location: nextPosition,
          };
        });

        return patched ? nextPlaces : previous;
      });
    },
    [setPlaces],
  );

  const visiblePlaces = useMemo(() => {
    if (!mapBounds) {
      return places;
    }
    return places.filter((place) => isWithinBounds(place.location, mapBounds));
  }, [mapBounds, places]);

  useEffect(() => {
    if (!hasNextPage) return;
    if (places.length >= MAX_PLACES_ON_CLIENT) return;
    if (visiblePlaces.length < places.length) return;

    fetchNextPage().catch((error) => {
      console.error(error);
    });
  }, [hasNextPage, fetchNextPage, places, visiblePlaces]);

  const value = useMemo<PlaceContextValue>(
    () => ({
      places,
      addPlace,
      updatePlace,
      visiblePlaces,
    }),
    [places, addPlace, updatePlace, visiblePlaces],
  );

  return (
    <PlaceContext.Provider value={value}>{children}</PlaceContext.Provider>
  );
}

export default PlaceProvider;
