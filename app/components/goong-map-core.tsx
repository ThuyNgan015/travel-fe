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
  const [userMarker, setUserMarker] = useState<goongjs.Marker | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

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

    setMap(mapInstance);

    return () => {
      mapInstance.remove();
    };
  }, []);

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

  const handleLocateUser = () => {
    if (!map) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;

          userMarker?.remove();

          const marker = new goongjs.Marker({ color: "red" })
            .setLngLat([lng, lat])
            .setPopup(new goongjs.Popup().setText("Vị trí của bạn"))
            .addTo(map);

          setUserMarker(marker);
          map.flyTo({ center: [lng, lat], zoom: 12 });
        },
        (err) => alert("Lỗi định vị: " + err.message),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      alert("Trình duyệt không hỗ trợ định vị.");
    }
  };

  const handleGetDirections = async () => {
    if (!map || !userMarker || !selectedLocation) {
      alert("Hãy xác định vị trí và chọn điểm đến.");
      return;
    }

    const userLngLat = userMarker.getLngLat();
    const destLngLat = [selectedLocation.lng, selectedLocation.lat];

    try {
      const res = await fetch(
        `/api/get-directions?origin=${userLngLat.lat},${userLngLat.lng}&destination=${destLngLat[1]},${destLngLat[0]}&vehicle=car`
      );

      if (!res.ok) throw new Error("Không lấy được dữ liệu chỉ đường.");

      const data = await res.json();
      const encoded = data.routes[0].overview_polyline.points;
      const coordinates = polyline
        .decode(encoded)
        .map(([lat, lng]) => [lng, lat]);

      const geojson = {
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates,
        },
      };

      if (map.getSource("route")) {
        map.removeLayer("route");
        map.removeSource("route");
      }

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
          "line-color": "#127dca",
          "line-width": 5,
          "line-opacity": 0.8,
        },
      });

      const bounds = new goongjs.LngLatBounds();
      coordinates.forEach((c) => bounds.extend(c as [number, number]));
      map.fitBounds(bounds, { padding: 60 });
    } catch (err) {
      console.error(err);
      alert("Không thể lấy dữ liệu chỉ đường.");
    }

    if (!map || !navigator.geolocation) {
      alert("Không hỗ trợ realtime GPS");
      return;
    }

    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        if (map) {
          userMarker?.remove();
          const marker = new goongjs.Marker({ color: "red" })
            .setLngLat([lng, lat])
            .setPopup(new goongjs.Popup().setText("Bạn đang ở đây"))
            .addTo(map);

          setUserMarker(marker);
          map.flyTo({ center: [lng, lat], zoom: 14 });
        }
      },
      (err) => {
        alert("Lỗi định vị: " + err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    setWatchId(id);
  };

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden">
      <div className="absolute z-10 top-4 left-4 flex gap-2">
        <button
          onClick={handleLocateUser}
          className="bg-blue-600 text-white px-3 py-2 rounded shadow hover:bg-blue-700"
        >
          Vị trí của tôi
        </button>
        <button
          onClick={handleGetDirections}
          className="bg-green-600 text-white px-3 py-2 rounded shadow hover:bg-green-700"
        >
          Chỉ đường
        </button>
      </div>
      <div ref={mapRef} className="w-full h-[500px]" />
    </div>
  );
}
