"use client"; // Đảm bảo component chạy phía client trong Next.js

import { useEffect, useRef, useState } from "react";
import goongjs from "@goongmaps/goong-js";
import "@goongmaps/goong-js/dist/goong-js.css";
interface GoongMapProps {
  locations: Location[];
  selectedLocation?: Location | null;
  onLocationSelect: (location: Location) => void;
}
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
const MapG = ({
  locations,
  selectedLocation,
  onLocationSelect,
}: GoongMapProps) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<any>(null);
  const marker = useRef<any | null>(null);
  const [userLocation, setUserLocation] = useState<{
    lng: number;
    lat: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    // hiển thị bản đồ
    const initMap = () => {
      // Khởi tạo bản đồ chỉ khi chưa khởi tạo
      goongjs.accessToken =
        process.env.NEXT_PUBLIC_GOONG_MAPTILES_KEY ||
        "LscLIAaH3ySfoZSfFHuswtqBL468YvgjclTKdcHL";
      map.current = new goongjs.Map({
        container: mapContainer.current,
        style: "https://tiles.goong.io/assets/goong_map_web.json", // Style bản đồ
        center: [108.212, 16.068], // Tọa độ trung tâm (kinh độ, vĩ độ) - ví dụ: Đà Nẵng
        zoom: 5, // Mức zoom ban đầu
      });
      // Thêm Marker
        new goongjs.Marker()
          .setLngLat([108.212, 16.068]) // Tọa độ của Marker
          .addTo(map.current);
      // Thêm control điều hướng
      map.current.addControl(new goongjs.NavigationControl());
      // Thêm Marker
     
    };
    if (mapContainer.current && !map.current) {
      initMap();
    }
    // Dọn dẹp khi component bị hủy
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden">
      {error && <p style={{ color: "red" }}>{error}</p>}
      <div ref={mapContainer} className="w-full h-[500px]" />
    </div>
  );
};

export default MapG;
