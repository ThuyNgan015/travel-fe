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

  // Update user marker position
  const updateUserMarker = (coords: [number, number]) => {
    // Xóa marker cũ nếu có
    if (userMarker) {
      userMarker.remove();
    }

    // Tạo marker mới
    const newUserMarker = new goongjs.Marker({ color: "red" })
      .setLngLat(coords)
      .setPopup(new goongjs.Popup().setText("Vị trí của bạn"))
      .addTo(map!);
    
    setUserMarker(newUserMarker);
  };

  // Watch user position and update route continuously
  const startTrackingUser = () => {
    if (!navigator.geolocation || !map || !selectedLocation) {
      alert("Cần có vị trí người dùng và điểm đến.");
      return;
    }

    // Dừng tracking cũ nếu có
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }

    // Xóa marker cũ trước khi bắt đầu tracking mới
    if (userMarker) {
      userMarker.remove();
      setUserMarker(null);
    }

    const id = navigator.geolocation.watchPosition(
      async (position) => {
        const coords: [number, number] = [
          position.coords.longitude,
          position.coords.latitude,
        ];
        
        setUserLocation(coords);
        updateUserMarker(coords);

        // Di chuyển camera đến vị trí người dùng
        map.flyTo({ center: coords, speed: 0.5, zoom: 14 });

        // Vẽ lại tuyến đường mới
        await getDirections(coords, selectedLocation);
      },
      (error) => {
        console.error("Lỗi định vị:", error);
        if (error.code === error.PERMISSION_DENIED) {
          alert("Bạn đã từ chối cấp quyền truy cập vị trí.");
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          alert("Không thể lấy thông tin vị trí.");
        } else if (error.code === error.TIMEOUT) {
          alert("Yêu cầu định vị đã hết thời gian.");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 1000 }
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
    
    // Xóa marker người dùng khi dừng tracking
    if (userMarker) {
      userMarker.remove();
      setUserMarker(null);
    }
    
    // Reset user location
    setUserLocation(null);
    
    // Xóa route nếu có
    if (map && map.getSource("route")) {
      try {
        map.removeLayer("route");
        map.removeSource("route");
      } catch (error) {
        console.log("Route đã được xóa trước đó");
      }
    }
  };

  // Cleanup when component unmounts or map changes
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