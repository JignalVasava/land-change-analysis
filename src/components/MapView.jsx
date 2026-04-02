import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { useState } from "react";

const baseMapUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const satelliteBaseMapUrl =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

const DEFAULT_CLASSIFICATION_LEGEND = [
  { label: "Agriculture", color: "#90EE90" },
  { label: "Urban", color: "#FF6B6B" },
  { label: "Water", color: "#4ECDC4" },
  { label: "Barren Land", color: "#95A5A6" },
];

function MapClickHandler({ onInspect }) {
  const map = useMap();
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onInspect({
        lat: lat.toFixed(4),
        lng: lng.toFixed(4),
        zoom: map.getZoom(),
      });
    },
  });
  return null;
}

export default function MapView({
  tileUrl,
  center = [37.45, -122.15],
  zoom = 9,
  legendItems = null,
  legendSections = null,
  legendTitle = "Legend",
  analysisSubtitle = null,
  analysisLayerLabel = "Earth Engine Analysis",
  analysisLayers = null,
}) {
  const [baseMap, setBaseMap] = useState("osm");
  const [showAnalysisLayer, setShowAnalysisLayer] = useState(true);
  const [opacity, setOpacity] = useState(0.7);
  const [mousePos, setMousePos] = useState(null);

  const items = legendItems?.length ? legendItems : DEFAULT_CLASSIFICATION_LEGEND;
  const layers =
    analysisLayers?.length
      ? analysisLayers
      : [
          {
            id: "default-analysis-layer",
            label: analysisLayerLabel,
            subtitle: analysisSubtitle,
            tileUrl,
            defaultVisible: true,
            defaultOpacity: 0.7,
          },
        ];
  const [layerStates, setLayerStates] = useState(() =>
    layers.reduce((acc, layer) => {
      acc[layer.id] = {
        visible: layer.defaultVisible ?? true,
        opacity: layer.defaultOpacity ?? 0.7,
      };
      return acc;
    }, {}),
  );
  const resolvedLegendSections =
    legendSections?.length ? legendSections : [{ id: "default-legend", title: legendTitle, items }];

  const baseMapOptions = {
    osm: {
      url: baseMapUrl,
      attribution: "© OpenStreetMap contributors",
      label: "OpenStreetMap",
    },
    satellite: {
      url: satelliteBaseMapUrl,
      attribution: "© Esri",
      label: "Satellite",
    },
  };

  return (
    <div className="gee-map-container" style={{ display: "flex", gap: "0", height: "600px" }}>
      <div
        className="gee-layers-panel"
        style={{
          width: "280px",
          background: "#f0f0f0",
          borderRight: "1px solid #ddd",
          padding: "16px",
          overflowY: "auto",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <h3 style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: "600", color: "#333" }}>
          Layers
        </h3>

        <div style={{ marginBottom: "16px" }}>
          <label
            style={{
              fontSize: "12px",
              fontWeight: "600",
              color: "#666",
              display: "block",
              marginBottom: "8px",
            }}
          >
            Base Map
          </label>
          <select
            value={baseMap}
            onChange={(e) => setBaseMap(e.target.value)}
            style={{
              width: "100%",
              padding: "6px",
              fontSize: "12px",
              border: "1px solid #ccc",
              borderRadius: "4px",
              background: "white",
            }}
          >
            {Object.entries(baseMapOptions).map(([key, { label }]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {layers.map((layer) => {
          const layerState = layerStates[layer.id] ?? {
            visible: layer.defaultVisible ?? true,
            opacity: layer.defaultOpacity ?? 0.7,
          };

          return (
            <div
              key={layer.id}
              style={{
                marginBottom: "16px",
                padding: "12px",
                background: "white",
                borderRadius: "4px",
                border: "1px solid #ddd",
              }}
            >
              <label
                style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", marginBottom: "8px" }}
              >
                <input
                  type="checkbox"
                  checked={layerState.visible}
                  onChange={(e) =>
                    setLayerStates((prev) => ({
                      ...prev,
                      [layer.id]: {
                        ...(prev[layer.id] ?? {}),
                        visible: e.target.checked,
                      },
                    }))
                  }
                  style={{ width: "16px", height: "16px", cursor: "pointer" }}
                />
                <span style={{ fontSize: "12px", fontWeight: "600", color: "#333" }}>{layer.label}</span>
              </label>
              {layer.subtitle ? (
                <p style={{ margin: "0 0 8px 0", fontSize: "11px", color: "#555", lineHeight: 1.45 }}>{layer.subtitle}</p>
              ) : null}

              {layer.tileUrl && layerState.visible ? (
                <>
                  <label
                    style={{ fontSize: "12px", fontWeight: "600", color: "#666", display: "block", marginBottom: "8px" }}
                  >
                    Layer Opacity: {Math.round(layerState.opacity * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={layerState.opacity}
                    onChange={(e) =>
                      setLayerStates((prev) => ({
                        ...prev,
                        [layer.id]: {
                          ...(prev[layer.id] ?? {}),
                          opacity: parseFloat(e.target.value),
                        },
                      }))
                    }
                    style={{ width: "100%", cursor: "pointer" }}
                  />
                </>
              ) : null}
            </div>
          );
        })}

        <div style={{ marginTop: "24px", padding: "12px", background: "white", borderRadius: "4px", border: "1px solid #ddd" }}>
          <h4 style={{ margin: "0 0 8px 0", fontSize: "12px", fontWeight: "600", color: "#333" }}>Map Info</h4>
          {mousePos ? (
            <div style={{ fontSize: "11px", color: "#666", lineHeight: "1.6" }}>
              <div>Lat: {mousePos.lat}°</div>
              <div>Lon: {mousePos.lng}°</div>
              <div>Zoom: {mousePos.zoom}</div>
            </div>
          ) : (
            <p style={{ fontSize: "11px", color: "#999", margin: 0 }}>Click on map to see coordinates</p>
          )}
        </div>
      </div>

      <div style={{ flex: 1, position: "relative" }}>
        <MapContainer center={center} zoom={zoom} scrollWheelZoom className="gee-map" style={{ height: "100%", width: "100%" }}>
          <MapClickHandler onInspect={setMousePos} />
          <TileLayer attribution={baseMapOptions[baseMap].attribution} url={baseMapOptions[baseMap].url} maxZoom={18} />
          {layers.map((layer) => {
            const layerState = layerStates[layer.id] ?? {
              visible: layer.defaultVisible ?? true,
              opacity: layer.defaultOpacity ?? 0.7,
            };

            return layerState.visible && layer.tileUrl ? (
              <TileLayer
                key={`${layer.id}-${layer.tileUrl}`}
                attribution="Generated from Google Earth Engine"
                url={layer.tileUrl}
                opacity={layerState.opacity}
                maxZoom={18}
              />
            ) : null;
          })}
        </MapContainer>

        <div
          style={{
            position: "absolute",
            bottom: "16px",
            left: "16px",
            background: "rgba(0, 0, 0, 0.7)",
            color: "white",
            padding: "8px 12px",
            borderRadius: "4px",
            fontSize: "11px",
            pointerEvents: "none",
          }}
        >
          <div>Use scroll to zoom • Click to inspect</div>
        </div>
      </div>

      <div
        className="gee-inspector-panel"
        style={{
          width: "280px",
          background: "#f0f0f0",
          borderLeft: "1px solid #ddd",
          padding: "16px",
          overflowY: "auto",
          boxShadow: "-2px 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <h3 style={{ margin: "0 0 16px 0", fontSize: "14px", fontWeight: "600", color: "#333" }}>Inspector</h3>

        {mousePos ? (
          <div style={{ padding: "12px", background: "white", borderRadius: "4px", border: "1px solid #ddd" }}>
            <div style={{ fontSize: "11px", color: "#666", lineHeight: "1.8" }}>
              <div>
                <span style={{ color: "#333", fontWeight: "600" }}>Location:</span>
              </div>
              <div style={{ marginLeft: "8px" }}>
                Latitude: {mousePos.lat}°
                <br />
                Longitude: {mousePos.lng}°
              </div>
              <div style={{ marginTop: "8px" }}>
                <span style={{ color: "#333", fontWeight: "600" }}>Map Properties:</span>
              </div>
              <div style={{ marginLeft: "8px" }}>
                Zoom Level: {mousePos.zoom}
                <br />
                Projection: Web Mercator
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: "12px", background: "#fff9cd", borderRadius: "4px", border: "1px solid #ffc107" }}>
            <p style={{ fontSize: "11px", color: "#856404", margin: "0 0 8px 0", fontWeight: "600" }}>Click on the map</p>
            <p style={{ fontSize: "10px", color: "#856404", margin: 0 }}>
              Click any location to inspect coordinates and properties.
            </p>
          </div>
        )}

        {resolvedLegendSections.map((section) => (
          <div
            key={section.id}
            style={{ marginTop: "16px", padding: "12px", background: "white", borderRadius: "4px", border: "1px solid #ddd" }}
          >
            <h4 style={{ margin: "0 0 8px 0", fontSize: "12px", fontWeight: "600", color: "#333" }}>
              {section.title}
            </h4>
            <div style={{ fontSize: "10px", color: "#666", lineHeight: "1.8" }}>
              {section.items.map((item) => (
                <div key={item.label} style={{ display: "flex", gap: "6px", alignItems: "center", marginBottom: "6px" }}>
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      background: item.color,
                      borderRadius: "2px",
                      border: item.color === "#FFFFFF" ? "1px solid #999" : "1px solid #666",
                    }}
                  />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
