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
  const [userMarker, setUserMarker] = useState<goongjs.Marker | null>(null);

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

  // Theo dõi vị trí user
  const startTrackingUser = () => {
    if (!navigator.geolocation || !map) {
      alert("Trình duyệt không hỗ trợ định vị.");
      return;
    }

    // Dừng tracking cũ nếu có
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const coords: [number, number] = [
          position.coords.longitude,
          position.coords.latitude,
        ];
        
        // Cập nhật hoặc tạo marker user
        if (userMarker) {
          // Di chuyển marker đến vị trí mới
          userMarker.setLngLat(coords);
        } else {
          // Tạo marker mới cho user
          const newUserMarker = new goongjs.Marker({ color: "red" })
            .setLngLat(coords)
            .setPopup(new goongjs.Popup().setText("Vị trí của bạn"))
            .addTo(map);
          
          setUserMarker(newUserMarker);
        }

        // Vẽ lại tuyến đường nếu có điểm đến được chọn
        if (selectedLocation) {
          getDirections(coords, selectedLocation);
        }
      },
      (error) => {
        console.error("Lỗi định vị:", error);
        alert("Không thể lấy vị trí của bạn.");
      },
      { 
        enableHighAccuracy: true, 
        timeout: 15000, 
        maximumAge: 1000 
      }
    );

    setWatchId(id);
    setIsTracking(true);
  };

  const stopTrackingUser = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    
    setIsTracking(false);
    
    // Xóa marker người dùng
    if (userMarker) {
      userMarker.remove();
      setUserMarker(null);
    }
    
    // Xóa route nếu có
    if (map && map.getSource("route")) {
      try {
        map.removeLayer("route");
        map.removeSource("route");
      } catch (error) {
        console.log("Route đã được xóa");
      }
    }
  };

  // Cleanup khi component unmount
  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (userMarker) {
        userMarker.remove();
      }
    };
  }, [watchId, userMarker]);

  // Vẽ đường đi từ user đến điểm đến
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
    }
  };

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden">
      <div className="absolute z-10 top-4 left-4">
        <button
          onClick={isTracking ? stopTrackingUser : startTrackingUser}
          className={`px-4 py-2 rounded shadow text-white font-medium ${
            isTracking
              ? "bg-red-600 hover:bg-red-700"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {isTracking ? "Dừng theo dõi vị trí" : "Theo dõi vị trí của tôi"}
        </button>
      </div>
      <div ref={mapRef} className="w-full h-[500px]" />
    </div>
  );
}