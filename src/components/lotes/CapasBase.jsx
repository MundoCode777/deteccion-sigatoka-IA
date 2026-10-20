import { LayersControl, TileLayer } from "react-leaflet";

// Botón arriba a la derecha del mapa para cambiar entre Mapa y Satélite
export default function CapasBase() {
  return (
    <LayersControl position="topright">
      <LayersControl.BaseLayer checked name="Mapa">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={20}
          maxNativeZoom={19}
        />
      </LayersControl.BaseLayer>
      <LayersControl.BaseLayer name="Satélite">
        <TileLayer
          attribution="Imágenes &copy; Esri, Maxar, Earthstar Geographics"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxZoom={20}
          maxNativeZoom={18}
        />
      </LayersControl.BaseLayer>
    </LayersControl>
  );
}