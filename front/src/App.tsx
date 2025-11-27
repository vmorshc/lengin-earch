import { APIProvider } from "@vis.gl/react-google-maps";
import Base from "./components/Base";
import MapProvider from "./components/mapProvider/MapProvider";
import PlaceProvider from "./components/placeProvider/PlaceProvider";
import ThemeProvider from "./components/themeProvider/ThemeProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function App() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "";

  const queryClient = new QueryClient();

  return (
    <APIProvider apiKey={apiKey}>
      <QueryClientProvider client={queryClient}>
        <MapProvider>
          <PlaceProvider>
            <ThemeProvider>
              <Base />
            </ThemeProvider>
          </PlaceProvider>
        </MapProvider>
      </QueryClientProvider>
    </APIProvider>
  );
}

export default App;
