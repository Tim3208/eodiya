import type { CampusPlace } from "../../lib/types";
import Card from "../_common/Card";

export default function BuildingCard({ place }: { place: CampusPlace }) {
  const locationText = place.floor
    ? `${place.building} ${place.floor}`
    : place.building;

  return (
    <Card>
      <div className="text-lg font-extrabold text-gray-900">{place.name}</div>
      <div className="mt-1 text-sm text-gray-600">
        {place.building}
        {place.floor ? ` · ${place.floor}` : ""} · {place.category}
      </div>

      {place.category === "건물 내부" ? (
        <>
          <div className="mt-3 text-sm font-semibold text-gray-800">
            {locationText}
          </div>
          {place.description ? (
            <div className="mt-1 text-sm text-gray-700">
              {place.description}
            </div>
          ) : (
            <div className="mt-1 text-sm text-gray-500">
              세부 정보가 아직 없습니다.
            </div>
          )}
        </>
      ) : place.description ? (
        <div className="mt-3 text-sm text-gray-700">{place.description}</div>
      ) : (
        <div className="mt-3 text-sm text-gray-500">
          설명 정보가 아직 없습니다.
        </div>
      )}
    </Card>
  );
}
