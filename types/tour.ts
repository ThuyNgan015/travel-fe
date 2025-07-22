export type Tour = {
  id: number;
  name: string;
  description: string;
  start_date: string; // ISO date string
  end_date: string; // ISO date string
  price?: number; // optional nếu chưa có giá
  rating?: number; // optional nếu chưa có đánh giá
  reviews?: number; // optional
};
