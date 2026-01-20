import "./style.css";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <main class="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200">
    <section class="mx-auto max-w-4xl px-6 py-16">
      <p class="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
        Sahmyook Campus Navigator
      </p>
      <h1 class="mt-3 text-4xl font-extrabold text-slate-900 md:text-5xl">
        삼육대학교 길찾기 서비스
      </h1>
      <p class="mt-4 max-w-2xl text-base text-slate-600 md:text-lg">
        Vite + Tailwind v3 기본 세팅이 완료됐습니다. 검색과 지도 기능은 여기서
        확장하세요.
      </p>
      <div class="mt-8 grid gap-4 md:grid-cols-3">
        <div class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Search
          </p>
          <p class="mt-2 text-lg font-semibold text-slate-900">
            건물명 검색
          </p>
          <p class="mt-2 text-sm text-slate-600">
            위치 데이터와 바로 연결할 수 있는 구조입니다.
          </p>
        </div>
        <div class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Map
          </p>
          <p class="mt-2 text-lg font-semibold text-slate-900">
            캠퍼스 맵
          </p>
          <p class="mt-2 text-sm text-slate-600">
            지도 라이브러리를 쉽게 붙일 수 있습니다.
          </p>
        </div>
        <div class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <p class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Pins
          </p>
          <p class="mt-2 text-lg font-semibold text-slate-900">
            위치 핀 표시
          </p>
          <p class="mt-2 text-sm text-slate-600">
            좌표 데이터 기반으로 확장 가능합니다.
          </p>
        </div>
      </div>
    </section>
  </main>
`;
