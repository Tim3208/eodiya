export {};

declare global {
  interface KakaoLatLng {
    toString(): string;
  }

  interface KakaoMap {
    panTo(position: KakaoLatLng): void;
  }

  interface KakaoMarker {
    getPosition(): KakaoLatLng;
    setMap(map: KakaoMap | null): void;
    setPosition(position: KakaoLatLng): void;
    setTitle(title: string): void;
    setZIndex(level: number): void;
  }

  interface KakaoInfoWindow {
    close(): void;
    open(map: KakaoMap, marker: KakaoMarker): void;
    setContent(content: string): void;
  }

  interface Window {
    kakao?: {
      maps: {
        event: {
          addListener(target: object, type: string, handler: () => void): void;
        };
        InfoWindow: new (options: {
          removable?: boolean;
          zIndex?: number;
        }) => KakaoInfoWindow;
        LatLng: new (lat: number, lng: number) => KakaoLatLng;
        Map: new (
          container: HTMLElement,
          options: {
            center: KakaoLatLng;
            level: number;
          },
        ) => KakaoMap;
        Marker: new (options: {
          position: KakaoLatLng;
          title?: string;
        }) => KakaoMarker;
        load(callback: () => void): void;
      };
    };
  }
}
