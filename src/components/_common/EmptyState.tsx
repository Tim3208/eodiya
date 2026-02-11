import Card from "./Card";

export default function EmptyState({
  title = "선택된 장소가 없습니다.",
  description = "검색 결과 또는 주요 장소 목록에서 하나를 선택해 주세요.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <Card>
      <div className="text-sm font-semibold text-gray-900">{title}</div>
      <div className="mt-1 text-sm text-gray-600">{description}</div>
    </Card>
  );
}
