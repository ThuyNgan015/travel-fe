"use client";

import { useEffect, useRef, useState } from "react";
import polyline from "@mapbox/polyline";
import goongjs from "@goongmaps/goong-js";
import "@goongmaps/goong-js/dist/goong-js.css";

interface Location {
  location_id: number;
  name: string;
  category: string;
  type: string;
  lat: number;
  lng: number;
  time_slot: string;
  note: string;
  day: number;
}

interface GoongMapProps {
  locations: Location[];
  selectedLocation?: Location | null;
  onLocationSelect: (location: Location) => void;
}

export default function GoongMapCore({
  locations,
  selectedLocation,
  onLocationSelect,
}: GoongMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<goongjs.Map | null>(null);
  const [markers, setMarkers] = useState<goongjs.Marker[]>([]);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  );

  // Init map
  useEffect(() => {
    if (!mapRef.current || !locations.length) return;

    goongjs.accessToken =
      process.env.NEXT_PUBLIC_GOONG_API_KEY || "YOUR_GOONG_API_KEY";

    const centerLat =
      locations.reduce((sum, loc) => sum + loc.lat, 0) / locations.length;
    const centerLng =
      locations.reduce((sum, loc) => sum + loc.lng, 0) / locations.length;

    const mapInstance = new goongjs.Map({
      container: mapRef.current,
      style: "https://tiles.goong.io/assets/goong_map_web.json",
      center: [centerLng, centerLat],
      zoom: 10,
    });

    mapInstance.on("load", () => {
      // Add pulsing-dot image
      const size = 200;
      const pulsingDot = {
        width: size,
        height: size,
        data: new Uint8Array(size * size * 4),
        context: null as CanvasRenderingContext2D | null,

        onAdd() {
          const canvas = document.createElement("canvas");
          canvas.width = this.width;
          canvas.height = this.height;
          this.context = canvas.getContext("2d");
        },

        render() {
          const duration = 1000;
          const t = (performance.now() % duration) / duration;

          const radius = (size / 2) * 0.3;
          const outerRadius = (size / 2) * 0.7 * t + radius;
          const context = this.context!;
          context.clearRect(0, 0, this.width, this.height);

          context.beginPath();
          context.arc(
            this.width / 2,
            this.height / 2,
            outerRadius,
            0,
            Math.PI * 2
          );
          context.fillStyle = "rgba(255, 200, 200," + (1 - t) + ")";
          context.fill();

          context.beginPath();
          context.arc(this.width / 2, this.height / 2, radius, 0, Math.PI * 2);
          context.fillStyle = "rgba(255, 100, 100, 1)";
          context.strokeStyle = "white";
          context.lineWidth = 2 + 4 * (1 - t);
          context.fill();
          context.stroke();

          this.data = context.getImageData(0, 0, this.width, this.height).data;
          mapInstance.triggerRepaint();
          return true;
        },
      };

      mapInstance.addImage("pulsing-dot", pulsingDot as any, { pixelRatio: 2 });

      mapInstance.addSource("user-realtime", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      mapInstance.addLayer({
        id: "user-realtime",
        type: "symbol",
        source: "user-realtime",
        layout: {
          "icon-image": "pulsing-dot",
          "icon-size": 0.6,
        },
      });
    });

    setMap(mapInstance);
    return () => mapInstance.remove();
  }, []);

  // Add location markers
  useEffect(() => {
    if (!map) return;

    markers.forEach((m) => m.remove());

    const newMarkers = locations.map((loc) => {
      const marker = new goongjs.Marker({ color: "green" })
        .setLngLat([loc.lng, loc.lat])
        .setPopup(new goongjs.Popup().setText(loc.name))
        .addTo(map);

      marker.getElement().addEventListener("click", () => {
        onLocationSelect(loc);
      });

      return marker;
    });

    setMarkers(newMarkers);

    if (locations.length > 1) {
      const bounds = new goongjs.LngLatBounds();
      locations.forEach((loc) => bounds.extend([loc.lng, loc.lat]));
      map.fitBounds(bounds, { padding: 60 });
    } else if (locations.length === 1) {
      map.flyTo({ center: [locations[0].lng, locations[0].lat], zoom: 12 });
    }
  }, [locations, map]);

  // Watch user position and update route continuously
  const startTrackingUser = () => {
    if (!navigator.geolocation || !map || !selectedLocation) {
      alert("Cần có vị trí người dùng và điểm đến.");
      return;
    }

    const id = navigator.geolocation.watchPosition(
      async (position) => {
        const coords: [number, number] = [
          position.coords.longitude,
          position.coords.latitude,
        ];
        setUserLocation(coords);

        // Vẽ hoặc cập nhật marker người dùng
        const geojson = {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: coords,
              },
            },
          ],
        };

        const source = map.getSource("user-realtime") as goongjs.GeoJSONSource;
        if (source) {
          source.setData(geojson);
        } else {
          map.addSource("user-realtime", {
            type: "geojson",
            data: geojson,
          });

          map.addLayer({
            id: "user-realtime",
            type: "symbol",
            source: "user-realtime",
            layout: {
              "icon-image": "marker-15",
              "icon-size": 1.5,
            },
          });
        }
        new goongjs.Marker({ color: "red" }).setLngLat(coords).addTo(map);
        map.flyTo({ center: coords, speed: 0.5, zoom: 14 });

        // Gọi lại getDirections mỗi lần di chuyển
        await getDirections(coords, selectedLocation);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          alert("Bạn đã từ chối cấp quyền truy cập vị trí.");
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          alert("Không thể lấy thông tin vị trí.");
        } else if (error.code === error.TIMEOUT) {
          alert("Yêu cầu định vị đã hết thời gian.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    setWatchId(id);
    setIsTracking(true);
  };

  const stopTrackingUser = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setIsTracking(false);
    }
  };

  // Draw direction from user to selectedLocation
  const getDirections = async (
    userCoords: [number, number],
    destination: { lat: number; lng: number }
  ) => {
    const origin = `${userCoords[1]},${userCoords[0]}`;
    const dest = `${destination.lat},${destination.lng}`;

    try {
      const res = await fetch(
        `https://rsapi.goong.io/Direction?origin=${origin}&destination=${dest}&vehicle=car&api_key=${process.env.NEXT_PUBLIC_GOONG_DIRECTIONS_API_KEY}`
      );
      const data = await res.json();

      const route = data.routes[0];
      const decoded = polyline.decode(route.overview_polyline.points);

      const geojson = {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: decoded.map(([lat, lng]) => [lng, lat]),
        },
      };

      if (!map.getSource("route")) {
        map.addSource("route", {
          type: "geojson",
          data: geojson,
        });

        map.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#1D4ED8",
            "line-width": 5,
          },
        });
      } else {
        const source = map.getSource("route") as goongjs.GeoJSONSource;
        source.setData(geojson);
      }
    } catch (error) {
      console.error("Lỗi khi lấy chỉ đường:", error);
      alert("Không thể lấy chỉ đường.");
    }
  };

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden">
      <div className="absolute z-10 top-4 left-4 flex gap-2 flex-wrap">
        <button
          onClick={isTracking ? stopTrackingUser : startTrackingUser}
          className={`px-3 py-2 rounded shadow text-white ${
            isTracking
              ? "bg-red-600 hover:bg-red-700"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isTracking ? "Dừng theo dõi" : "Chỉ đường"}
        </button>
      
      </div>
      <div ref={mapRef} className="w-full h-[500px]" />
    </div>
  );
}
