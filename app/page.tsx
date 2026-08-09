import { BillUploadForm } from "@/components/bill-upload-form";
import { HeartPulse } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-full bg-[#fff7ed] text-[#0f172a]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-[#0b5cab] focus:px-4 focus:py-3 focus:text-xl focus:font-bold focus:text-white"
      >
        Skip to main content
      </a>

      <header className="border-b-2 border-[#0f2d52] bg-[#0f2d52] px-4 py-8 text-white sm:px-8">
        <div className="mx-auto flex max-w-3xl items-center gap-4">
          <HeartPulse aria-hidden className="size-12 shrink-0 sm:size-14" strokeWidth={2.25} />
          <div>
            <p className="text-lg font-medium uppercase tracking-wide text-[#bfdbfe] sm:text-xl">
              SimpliCare
            </p>
            <h1 className="text-3xl font-bold leading-tight sm:text-5xl">
              Understand your medical bill
            </h1>
          </div>
        </div>
        <p className="mx-auto mt-4 max-w-3xl text-xl leading-relaxed text-[#e2e8f0] sm:text-2xl">
          Upload a photo. We translate confusing billing language into clear,
          friendly guidance you can read or listen to.
        </p>
      </header>

      <main
        id="main-content"
        className="px-4 py-10 sm:px-8 sm:py-12"
        tabIndex={-1}
      >
        <BillUploadForm />
      </main>
    </div>
  );
}
