
// Dữ liệu tour từ API
export const tourData = {
  id: 2,
  name: "Trải nghiệm Đà Nẵng - Hội An 4 ngày 3 đêm",
  description: "Di sản miền Trung: Biển xanh, phố cổ và những cây cầu kỳ vĩ.",
  rating: 4.8,
  reviews: 156,
  price: "2,500,000",
  days: [
    {
      day: 1,
      title: "Ngày đầu - Khám phá biển Mỹ Khê",
      locations: [
        {
          location_id: 37,
          name: "Khu vực biển Mỹ Khê",
          category: "landmark",
          type: "play",
          lat: 16.0592,
          lng: 108.2497,
          time_slot: "15:00:00",
          note: "Check-in khách sạn, tự do khám phá khu vực biển.",
        },
      ],
    },
    {
      day: 2,
      title: "Ngày thứ hai - Ngũ Hành Sơn & Hội An",
      locations: [
        {
          location_id: 36,
          name: "Ngũ Hành Sơn",
          category: "landmark",
          type: "viewpoint",
          lat: 16.0044,
          lng: 108.2638,
          time_slot: "08:30:00",
          note: "Tham quan Ngũ Hành Sơn, làng đá Non Nước.",
        },
        {
          location_id: 35,
          name: "Phố cổ Hội An",
          category: "landmark",
          type: "viewpoint",
          lat: 15.8777,
          lng: 108.3262,
          time_slot: "16:00:00",
          note: "Dạo chơi phố cổ, ăn tối và ngắm đèn lồng.",
        },
      ],
    },
    {
      day: 3,
      title: "Ngày thứ ba - Bà Nà Hills",
      locations: [
        {
          location_id: 34,
          name: "Bà Nà Hills",
          category: "landmark",
          type: "play",
          lat: 15.9952,
          lng: 107.995,
          time_slot: "08:00:00",
          note: "Dành cả ngày vui chơi tại Bà Nà Hills.",
        },
      ],
    },
  ],
};