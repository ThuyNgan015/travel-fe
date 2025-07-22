import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MapPin, Calendar, Users, Star } from "lucide-react";
import { tourData } from "@/app/data/tour-fake";
import Link from "next/link";
import { fetchTours } from "@/app/api/tour";
import { Tour } from "@/types/tour";

export default async function TourPage() {
  const tourList: Tour[] = await fetchTours();
  if (!tourList || tourList.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Không có tour nào hiện tại
          </h1>
          <p className="text-gray-600">
            Vui lòng quay lại sau hoặc liên hệ với chúng tôi để biết thêm thông
            tin.
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
                    Danh sách tour du lịch
                  </h1>
                  <p className="text-lg opacity-90">
                    Giá ưu đãi – Lịch trình hợp lý – Dành cho mọi lứa tuổi!
                  </p>
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
                  {/* <span>{allLocations.length} địa điểm</span> */}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tourList.map((tour: Tour) => (
            <Link href={`/tour/${tour.id}`} key={tour.id}>
              <Card className="cursor-pointer hover:shadow-md transition">
                <CardHeader>
                  <CardTitle>{tour.name}</CardTitle>
                  <CardDescription>{tour.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Từ: {new Date(tour.start_date).toLocaleDateString("vi-VN")} –
                  đến: {new Date(tour.end_date).toLocaleDateString("vi-VN")}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
