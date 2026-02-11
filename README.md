# eodiya - 삼육대학교 캠퍼스 지도

삼육대학교의 건물, 강의실, 편의시설 위치를 검색하고 카카오맵에서 확인하는 웹앱입니다.

## 핵심 기능
- 장소명/건물명/별칭 검색
- 분류(건물 / 건물 내부) 필터
- 지도 마커 클릭 시 상세 정보 동기화
- 선택 장소 중심 이동 및 인포윈도우 표시

## 실행 방법
1. 의존성 설치
   ```bash
   npm install
   ```
2. 루트에 `.env.local` 생성
   ```env
   VITE_KAKAO_JS_KEY=발급받은_JavaScript_키
   ```
3. 개발 서버 실행
   ```bash
   npm run dev
   ```

## 카카오 개발자 콘솔 설정
- 앱 생성 후 JavaScript 키 발급
- 플랫폼 > Web 등록
  - `http://localhost:5173`
  - 배포 도메인(사용 시)

## 데이터 수정 포인트
- 장소 데이터: `src/data/places.ts`
- 장소 타입: `src/lib/types.ts`
- 검색 로직: `src/lib/search.ts`
- 지도 렌더링: `src/components/CampusMapCP/MapView.tsx`

## 캠퍼스맵 자동 수집
삼육대학교 캠퍼스맵 페이지에서 건물 상세 페이지/이미지/OCR 텍스트를 자동 수집합니다.

1. 수집(건물 목록 + 상세 페이지 + 이미지 다운로드)
   ```bash
   npm run campusmap:scrape
   ```
   출력: `data/campusmap/raw/buildings.raw.json`
   메모: 현재 캠퍼스맵 페이지는 내부 JS(`var buildings = [...]`)에 건물/층 정보가 들어 있어, 이 데이터가 우선 추출됩니다.

2. 층 정보 파싱(수집 결과 기반, OCR 없이도 동작)
   ```bash
   npm run campusmap:floors:raw
   ```
   출력:
   - `data/campusmap/buildings.floors.json`
   - `data/campusmap/places.draft.json`

3. 앱 데이터(`src/data/places.ts`) 자동 생성/덮어쓰기
   ```bash
   npm run campusmap:generate
   ```

4. OCR(층 정보 이미지 텍스트화, 필요 시)
   사전 준비: `tesseract` 설치 + `kor` 언어데이터.
   ```bash
   npm run campusmap:ocr
   ```
   출력: `data/campusmap/ocr/buildings.ocr.json`

5. OCR 결과 기반 층 정보 파싱
   ```bash
   npm run campusmap:floors
   ```
   출력:
   - `data/campusmap/buildings.floors.json`
   - `data/campusmap/places.draft.json`

6. 수집 + 파싱 + places.ts 동기화
   ```bash
   npm run campusmap:sync
   ```

7. OCR 포함 전체 실행
   ```bash
   npm run campusmap:all
   ```
