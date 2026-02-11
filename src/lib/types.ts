export type PlaceCategory = "건물" | "건물 내부";

export type CampusPlace = {
  id: string;
  name: string;
  building: string;
  floor?: string;
  category: PlaceCategory;
  aliases: string[];
  description?: string;
  point: {
    lat: number;
    lng: number;
  };
};
