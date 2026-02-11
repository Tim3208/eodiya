import { useEffect, useMemo, useRef, useState } from "react";

import type { CampusPlace } from "../../lib/types";

type Props = {
  places: CampusPlace[];
  selected: CampusPlace | null;
  onSelect: (place: CampusPlace) => void;
};

type MapStatus = "loading" | "ready" | "error" | "missing-key";

const CAMPUS_CENTER = { lat: 37.64389, lng: 127.10572 };
const DEFAULT_LEVEL = 4;

let kakaoLoader: Promise<void> | null = null;

function hasKakaoMaps(): boolean {
  return Boolean(window.kakao?.maps);
}

function loadKakaoMaps(appKey: string): Promise<void> {
  const sanitizedAppKey = appKey.trim();

  if (!sanitizedAppKey) {
    return Promise.reject(new Error("Empty Kakao JavaScript key"));
  }

  if (hasKakaoMaps()) {
    return Promise.resolve();
  }

  if (kakaoLoader) {
    return kakaoLoader;
  }

  kakaoLoader = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>(
      "script[data-kakao-map='sdk']",
    );

    const handleLoad = () => {
      if (!hasKakaoMaps()) {
        reject(new Error("Kakao Maps SDK unavailable"));
        return;
      }

      window.kakao!.maps.load(() => resolve());
    };

    if (existingScript) {
      if (hasKakaoMaps()) {
        handleLoad();
      } else {
        existingScript.addEventListener("load", handleLoad, { once: true });
        existingScript.addEventListener(
          "error",
          () => reject(new Error("Failed to load Kakao Maps SDK")),
          { once: true },
        );
      }
      return;
    }

    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(
      sanitizedAppKey,
    )}&autoload=false`;
    script.async = true;
    script.dataset.kakaoMap = "sdk";
    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error("Failed to load Kakao Maps SDK")),
      { once: true },
    );
    document.head.appendChild(script);
  });

  return kakaoLoader;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export default function MapView({ places, selected, onSelect }: Props) {
  const appKey = import.meta.env.VITE_KAKAO_JS_KEY;
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const markersRef = useRef<Map<string, KakaoMarker>>(new Map());
  const infoWindowRef = useRef<KakaoInfoWindow | null>(null);
  const [status, setStatus] = useState<MapStatus>(
    appKey ? "loading" : "missing-key",
  );
  const [errorMessage, setErrorMessage] = useState<string>("");

  const selectedId = selected?.id ?? null;

  useEffect(() => {
    if (!appKey) return;

    let isMounted = true;
    const markerMap = markersRef.current;

    void loadKakaoMaps(appKey)
      .then(() => {
        if (!isMounted || !mapContainerRef.current) return;

        const center = new window.kakao!.maps.LatLng(
          CAMPUS_CENTER.lat,
          CAMPUS_CENTER.lng,
        );

        mapRef.current = new window.kakao!.maps.Map(mapContainerRef.current, {
          center,
          level: DEFAULT_LEVEL,
        });

        infoWindowRef.current = new window.kakao!.maps.InfoWindow({
          removable: false,
          zIndex: 10,
        });

        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (isMounted) {
          kakaoLoader = null;
          const message =
            error instanceof Error ? error.message : "Unknown map load error";
          setErrorMessage(message);
          // Keep a detailed trace in console for quick diagnosis.
          console.error("[KakaoMap] load/init failed:", error);
          setStatus("error");
        }
      });

    return () => {
      isMounted = false;
      markerMap.forEach((marker) => marker.setMap(null));
      markerMap.clear();
      infoWindowRef.current?.close();
      infoWindowRef.current = null;
      mapRef.current = null;
    };
  }, [appKey]);

  useEffect(() => {
    const kakaoMaps = window.kakao?.maps;
    if (status !== "ready" || !mapRef.current || !kakaoMaps) return;

    const map = mapRef.current;
    const markerMap = markersRef.current;
    const visibleIds = new Set(places.map((place) => place.id));

    markerMap.forEach((marker, id) => {
      if (visibleIds.has(id)) return;
      marker.setMap(null);
      markerMap.delete(id);
    });

    places.forEach((place) => {
      const position = new kakaoMaps.LatLng(
        place.point.lat,
        place.point.lng,
      );
      const existing = markerMap.get(place.id);

      if (existing) {
        existing.setPosition(position);
        existing.setTitle(place.name);
        return;
      }

      const marker = new kakaoMaps.Marker({
        position,
        title: place.name,
      });

      marker.setMap(map);
      markerMap.set(place.id, marker);

      kakaoMaps.event.addListener(marker, "click", () => {
        onSelect(place);
      });
    });
  }, [onSelect, places, status]);

  useEffect(() => {
    const kakaoMaps = window.kakao?.maps;
    if (status !== "ready" || !mapRef.current || !kakaoMaps) return;

    const map = mapRef.current;
    const infoWindow = infoWindowRef.current;
    const markerMap = markersRef.current;

    markerMap.forEach((marker, id) => {
      marker.setZIndex(id === selectedId ? 100 : 1);
    });

    if (!selectedId || !selected) {
      infoWindow?.close();
      return;
    }

    const marker = markerMap.get(selectedId);
    if (!marker) {
      infoWindow?.close();
      return;
    }

    map.panTo(marker.getPosition());

    if (infoWindow) {
      infoWindow.setContent(
        `<div style="padding:6px 10px;font-size:12px;font-weight:700;white-space:nowrap;">${escapeHtml(selected.name)}</div>`,
      );
      infoWindow.open(map, marker);
    }
  }, [selected, selectedId, status]);

  const showOverlay = useMemo(
    () => status === "loading" || status === "error",
    [status],
  );

  if (status === "missing-key") {
    return (
      <div className="rounded-2xl border bg-white p-6 text-sm text-gray-700 shadow-sm">
        <p className="font-semibold text-gray-900">카카오맵 API 키가 필요합니다.</p>
        <p className="mt-2">
          루트 <code>.env.local</code> 파일에
          <code> VITE_KAKAO_JS_KEY=발급받은_JavaScript_키</code>를 설정해 주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div ref={mapContainerRef} className="h-[560px] w-full md:h-[640px]" />

      {showOverlay ? (
        <div className="absolute inset-0 grid place-items-center bg-white/80 p-4 text-sm text-gray-700">
          {status === "loading"
            ? "지도를 불러오는 중입니다..."
            : `지도를 불러오지 못했습니다. API 키/도메인 등록을 확인해 주세요.${
                errorMessage ? ` (${errorMessage})` : ""
              }`}
        </div>
      ) : null}

      {status === "ready" && places.length === 0 ? (
        <div className="absolute inset-x-0 bottom-0 bg-white/95 px-4 py-3 text-xs text-gray-600">
          조건에 맞는 장소가 없어 표시할 마커가 없습니다.
        </div>
      ) : null}

      {status === "error" ? (
        <div className="absolute inset-x-0 bottom-0 bg-amber-50/95 px-4 py-3 text-xs text-amber-900">
          현재 접속 도메인: <code>{origin}</code> | 카카오 개발자 콘솔의
          <code>플랫폼 &gt; Web</code>에 이 도메인이 등록되어 있어야 합니다.
        </div>
      ) : null}
    </div>
  );
}
