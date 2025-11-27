import {
  createContext,
  useContext,
  type Dispatch,
  type SetStateAction,
} from "react";

type CameraSettings = {
  center: google.maps.LatLngLiteral;
  zoom: number;
};

type CameraSettingsUpdate = Partial<CameraSettings> & {
  bounds?: google.maps.LatLngBoundsLiteral;
};

type CameraSettingsUpdater =
  | CameraSettingsUpdate
  | ((previous: CameraSettings) => CameraSettingsUpdate | null);

interface MapContextValue {
  cameraSettings: CameraSettings;
  setCameraSettings: (updater: CameraSettingsUpdater) => void;
  mapBounds: google.maps.LatLngBoundsLiteral | null;
  setMapBounds: Dispatch<
    SetStateAction<google.maps.LatLngBoundsLiteral | null>
  >;
  clusterCenter: google.maps.LatLngLiteral;
  setClusterCenter: Dispatch<SetStateAction<google.maps.LatLngLiteral>>;
}

const MapContext = createContext<MapContextValue | null>(null);

const useMapProvider = (): MapContextValue => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error("useMapProvider must be used within a MapProvider");
  }
  return context;
};

export { MapContext, useMapProvider };
export type {
  CameraSettings,
  CameraSettingsUpdate,
  CameraSettingsUpdater,
  MapContextValue,
};
