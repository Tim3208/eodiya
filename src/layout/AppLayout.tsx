import type { PropsWithChildren } from "react";
import Header from "./Header";

export default function AppLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="mx-auto max-w-6xl p-4 md:p-8">
        <Header />
        {children}
      </div>
    </div>
  );
}
