import { useEffect, useRef } from "react";

type PlacePanelMode = "create" | "view";

type PlacePanelProps = {
  position: google.maps.LatLngLiteral;
  description: string;
  onDescriptionChange: (value: string) => void;
  onClose: () => void;
  mode?: PlacePanelMode;
};

const formatCoordinate = (value: number) => value.toFixed(6);

function PlacePanel({
  position,
  description,
  onDescriptionChange,
  onClose,
  mode = "create",
}: PlacePanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const isViewMode = mode === "view";

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!panelRef.current) {
        return;
      }
      if (panelRef.current.contains(event.target as Node)) {
        return;
      }
      onClose();
    };

    const controller = new AbortController();
    document.addEventListener("pointerdown", handlePointerDown, {
      signal: controller.signal,
    });
    return () => controller.abort();
  }, [onClose]);

  return (
    <aside
      ref={panelRef}
      className="absolute right-4 top-4 z-10 w-80 max-w-full rounded-box border border-base-300 bg-base-100 p-4 shadow-lg"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">
          {isViewMode ? "Place details" : "New place"}
        </h2>
        <span className="text-xs uppercase tracking-wide text-base-content/60">
          {!isViewMode ? "click outside to save" : "click outside to close"}
        </span>
      </div>

      <div className="mt-4 space-y-2 text-sm">
        <span className="font-medium text-base-content/80">Coordinates</span>
        <div className="grid grid-cols-2 gap-3 rounded-box bg-base-200/80 p-3 text-xs text-base-content/80">
          <div>
            <div className="uppercase tracking-wide text-base-content/60">
              Latitude
            </div>
            <div className="text-base-content">
              {formatCoordinate(position.lat)}
            </div>
          </div>
          <div>
            <div className="uppercase tracking-wide text-base-content/60">
              Longitude
            </div>
            <div className="text-base-content">
              {formatCoordinate(position.lng)}
            </div>
          </div>
        </div>
      </div>

      <label
        className="mt-4 block text-sm font-medium text-base-content/80"
        htmlFor="new-place-description"
      >
        Description
      </label>
      <textarea
        id="new-place-description"
        className="textarea textarea-bordered mt-2 h-24 w-full resize-none"
        placeholder="Add a short note about this place"
        value={description}
        onChange={(event) => onDescriptionChange(event.target.value)}
        readOnly={isViewMode}
      />

      <p className="mt-2 text-xs text-base-content/60">
        {!isViewMode
          ? "We save the place automatically when you close this panel."
          : ""}
      </p>
    </aside>
  );
}

export default PlacePanel;
