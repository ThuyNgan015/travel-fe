"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Clock, Calendar, Users, Star } from "lucide-react";
import { tourData } from "@/app/data/tour-fake";
import GoongMapCore from "@/app/components/goong-map";
import { fetchTourById } from "@/app/api/tour";
import Link from "next/link";

import MapG from "@/app/components/gg-map";

export default function TourDetailPage({ params }: { params: { id: string } }) {
  const tourId = params.id;
  const [tourDetails, setTourDetails] = useState<any>({});
  useEffect(() => {
    const fetchTourDetails = async () => {
      try {
        const data = await fetchTourById(Number(tourId));
        console.log("Fetched Tour Data:", data);

        if (data) {
          setTourDetails(data);
        } else {
          console.warn("API trả về null hoặc không có 'data'");
        }
      } catch (error) {
        console.error("Lỗi khi fetch tour details:", error);
      }
    };

    fetchTourDetails();
  }, [tourId]);
  const [selectedDay, setSelectedDay] = useState(1);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);

  // Lấy tất cả locations để hiển thị trên map
  const allLocations =
    tourDetails.days?.flatMap((day) =>
      day.locations.map((location) => ({
        ...location,
        day: day.day,
      }))
    ) ?? [];

  // Lấy locations của ngày được chọn
  const selectedDayData =
    tourDetails.days?.find((day) => day.day === selectedDay) ?? {};

  const getCategoryColor = (type: string) => {
    switch (type) {
      case "play":
        return "bg-green-100 text-green-800";
      case "viewpoint":
        return "bg-blue-100 text-blue-800";
      case "food":
        return "bg-orange-100 text-orange-800";
      case "stay":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "play":
        return "🎯";
      case "viewpoint":
        return "👁️";
      case "food":
        return "🍽️";
      case "stay":
        return "🏨";
      default:
        return "📍";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "play":
        return "Vui chơi";
      case "viewpoint":
        return "Tham quan";
      case "food":
        return "Ẩm thực";
      case "stay":
        return "Lưu trú";
      default:
        return "Khác";
    }
  };
  if (!tourDetails || !tourDetails.days) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Đang tải thông tin tour...
          </h1>
          <p className="text-gray-600">
            Vui lòng đợi trong giây lát hoặc thử lại sau.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Card className="overflow-hidden">
            <div className="relative h-64 bg-gradient-to-r from-blue-600 to-indigo-600">
              <div className="absolute inset-0 bg-black/20" />
              <div className="relative h-full flex items-center justify-center text-white text-center p-6">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">
                    {tourDetails.name}
                  </h1>
                  <p className="text-lg opacity-90">
                    {tourDetails.description}
                  </p>
                  <Link href="/" className="underline cursor-pointer">
                    Quay lại trang chủ
                  </Link>
                </div>
              </div>
            </div>
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>4 ngày 3 đêm</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>
                    {tourData.rating} ({tourData.reviews} đánh giá)
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{allLocations.length} địa điểm</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>Phù hợp mọi lứa tuổi</span>
                </div>
                <div className="ml-auto">
                  <span className="text-2xl font-bold text-primary">
                    {tourData.price}₫
                  </span>
                  <span className="text-sm text-muted-foreground">/người</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Panel - Tour Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Lịch trình chi tiết
                </CardTitle>
                <CardDescription>
                  Chọn ngày để xem chi tiết các địa điểm
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={selectedDay.toString()}
                  onValueChange={(value) =>
                    setSelectedDay(Number.parseInt(value))
                  }
                >
                  <TabsList className="grid w-full grid-cols-3">
                    {tourDetails.days?.map((day) => (
                      <TabsTrigger key={day.day} value={day.day.toString()}>
                        Ngày {day.day}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {tourDetails.days?.map((day) => (
                    <TabsContent
                      key={day.day}
                      value={day.day.toString()}
                      className="mt-6"
                    >
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {day.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {day.locations.length} địa điểm
                          </p>
                        </div>

                        <div className="space-y-4">
                          {day.locations.map((location, index) => (
                            <div
                              key={location.location_id}
                              className="relative"
                            >
                              {/* Timeline connector */}
                              {index < day.locations.length - 1 && (
                                <div className="absolute left-6 top-16 w-0.5 h-16 bg-border" />
                              )}

                              <div className="flex gap-4">
                                {/* Timeline dot */}
                                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-lg">
                                  {getTypeIcon(location.type)}
                                </div>

                                {/* Location card */}
                                <Card
                                  className={`flex-1 cursor-pointer transition-all hover:shadow-md border-l-4 border-l-primary ${
                                    selectedLocation?.location_id ===
                                    location.location_id
                                      ? "ring-2 ring-blue-500 bg-blue-50"
                                      : ""
                                  }`}
                                  onClick={() => setSelectedLocation(location)}
                                >
                                  <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-2">
                                      <h4 className="font-semibold text-gray-900">
                                        {location.name}
                                      </h4>
                                      <Badge
                                        className={getCategoryColor(
                                          location.type
                                        )}
                                      >
                                        {getTypeLabel(location.type)}
                                      </Badge>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                      <Clock className="w-4 h-4" />
                                      <span>{location.time_slot}</span>
                                    </div>

                                    <p className="text-sm text-gray-700">
                                      {location.note}
                                    </p>
                                  </CardContent>
                                </Card>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            {/* Selected Location Details */}
            {selectedLocation && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Chi tiết địa điểm
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">
                        {getTypeIcon(selectedLocation.type)}
                      </span>
                      <h3 className="text-lg font-semibold">
                        {selectedLocation.name}
                      </h3>
                    </div>
                    <div className="flex gap-2">
                      <Badge
                        className={getCategoryColor(selectedLocation.type)}
                      >
                        {getTypeLabel(selectedLocation.type)}
                      </Badge>
                      <Badge variant="outline">
                        Ngày {selectedLocation.day}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>Thời gian: {selectedLocation.time_slot}</span>
                    </div>
                    <p className="text-gray-700">{selectedLocation.note}</p>
                    <div className="text-xs text-gray-500">
                      Tọa độ: {selectedLocation.lat.toFixed(4)},{" "}
                      {selectedLocation.lng.toFixed(4)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel - Goong Map */}
          <div className="lg:sticky lg:top-8">
            <Card className="h-[600px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Bản đồ hành trình
                </CardTitle>
                <CardDescription>
                  Xem vị trí các địa điểm trên bản đồ Goong
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 h-[500px]">
                {tourDetails.days?.length > 0 && (
                  <GoongMapCore
                    locations={
                      selectedDayData
                        ? selectedDayData.locations?.map((loc) => ({
                            ...loc,
                            day: selectedDay,
                          }))
                        : []
                    }
                    selectedLocation={selectedLocation}
                    onLocationSelect={setSelectedLocation}
                  />
                )}
                {/* <MapG
                  locations={
                    selectedDayData
                      ? selectedDayData.locations?.map((loc) => ({
                          ...loc,
                          day: selectedDay,
                        }))
                      : []
                  }
                  selectedLocation={selectedLocation}
                  onLocationSelect={setSelectedLocation}
                /> */}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
