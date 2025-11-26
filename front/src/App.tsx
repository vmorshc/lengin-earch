import { APIProvider } from '@vis.gl/react-google-maps'
import Base from './components/Base'
import MapProvider from './components/mapProvider/MapProvider'
import PlaceProvider from './components/placeProvider/PlaceProvider'
import ThemeProvider from './components/themeProvider/ThemeProvider'

function App() {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? ''

  return (
    <APIProvider apiKey={apiKey}>
      <MapProvider>
        <PlaceProvider>
          <ThemeProvider>
            <Base />
          </ThemeProvider>
        </PlaceProvider>
      </MapProvider>
    </APIProvider>
  )
}

export default App