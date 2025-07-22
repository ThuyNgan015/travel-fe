"use server";
export const fetchTours = async () => {
  try {
    const response = await fetch(`${process.env.API_TOUR_URL}/api/tours`);
    if (!response.ok) {
      throw new Error("Failed to fetch tours");
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching tours:", error);
    return [];
  }
}
export const fetchTourById = async (id: number) => {
  try {
    const response = await fetch(`${process.env.API_TOUR_URL}/api/tours/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch tour with id ${id}`);
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error(`Error fetching tour with id ${id}:`, error);
    return null;
  }
}