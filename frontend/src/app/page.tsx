import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { LocationSearch } from "@/features/locations";
import { MapView } from "@/features/map";

const quickTags = ["도서관", "홍명기홀", "요한관", "체육관", "정문"];

export default function HomePage() {
  return (
    <main className="bg-ink noise min-h-screen">
      <Container className="py-12 md:py-16">
        <header className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6 animate-fade-up">
            <div className="inline-flex items-center gap-3 rounded-full border border-black/10 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
              Sahmyook Navigator
            </div>
            <h1 className="font-display text-4xl font-semibold leading-tight text-slate-950 md:text-5xl">
              캠퍼스 길찾기,
              <br />
              한눈에 연결되는 흐름
            </h1>
            <p className="max-w-xl text-base text-[color:var(--muted)] md:text-lg">
              건물명으로 검색하고 지도로 바로 확인하세요. 위치 정보는 빠르게
              갱신되고, 확장 기능은 모듈 단위로 추가할 수 있습니다.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button>검색 시작하기</Button>
              <Button variant="ghost">캠퍼스 맵 보기</Button>
            </div>
            <div className="grid gap-4 text-sm text-slate-600 sm:grid-cols-3">
              {[
                { label: "Total spots", value: "128+" },
                { label: "Avg. search", value: "0.8s" },
                { label: "Pins today", value: "342" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-black/10 bg-white/70 px-4 py-3"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    {stat.label}
                  </p>
                  <p className="font-display text-2xl text-slate-900">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[28px] border border-black/10 bg-white/90 p-6 shadow-soft backdrop-blur animate-fade-up">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Quick Search
              </p>
              <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                Beta
              </span>
            </div>
            <h2 className="mt-4 font-display text-2xl text-slate-900">
              자주 찾는 위치
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              버튼을 눌러 바로 검색하거나, 직접 건물명을 입력하세요.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {quickTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-black/10 bg-[rgba(242,92,47,0.12)] px-4 py-1.5 text-xs font-semibold text-[color:var(--accent-strong)]"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-6 space-y-3">
              {[
                "홍명기홀 > 요한관 지하 1층",
                "다니엘관 2층 강의실",
                "학생회관 1층 카페",
              ].map((item, index) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm text-slate-700 shadow-sm"
                >
                  <span>{item}</span>
                  <span className="text-xs text-slate-400">{index + 1}m</span>
                </div>
              ))}
            </div>
          </div>
        </header>

        <section className="mt-12 grid gap-8 lg:grid-cols-[360px_1fr]">
          <LocationSearch />
          <MapView />
        </section>

        <section className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "검색 집중",
              description: "건물/시설 검색을 위한 구조로 최적화됩니다.",
            },
            {
              title: "지도 연동",
              description: "실제 지도 API로 자연스럽게 확장됩니다.",
            },
            {
              title: "피드백 수집",
              description: "사용자 의견을 모듈로 추가할 수 있습니다.",
            },
          ].map((item, index) => (
            <div
              key={item.title}
              className="animate-fade-up rounded-3xl border border-black/10 bg-white/80 p-6 shadow-sm"
              style={{ animationDelay: `${index * 120}ms` }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                Feature 0{index + 1}
              </p>
              <h3 className="mt-3 font-display text-xl text-slate-900">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600">{item.description}</p>
            </div>
          ))}
        </section>
      </Container>
    </main>
  );
}
