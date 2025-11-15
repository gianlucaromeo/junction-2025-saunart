// app/page.tsx
import Link from "next/link";

export default function Page() {
  return (
    <main className="min-h-screen w-full bg-[radial-gradient(ellipse_at_center_left,#273021,#000000)] flex items-center justify-center px-6">
      <div className="max-w-5xl w-full flex flex-col items-start justify-center gap-16 py-32">
        <h1
          className="font-[SF Pro Rounded] font-light leading-tight text-white"
          style={{ fontSize: "88px" }}
        >
          <span className="text-gray-600">WHAT IF</span>{" "}
          <span className="text-white">SAUNA SENSORS</span>{" "}
          <br />
          <span className="text-gray-600">COULD GENERATE</span>
          <br />
          <span className="text-gray-300"></span>{" "}
          <span className="text-white">ART & MUSIC?</span>
        </h1>

        <Link
          href="/demo"
          className="w-full border border-white/40 rounded-full px-12 py-6 text-white text-3xl font-[SF Pro Rounded] flex items-center gap-4 hover:bg-white/10 transition"
        >
          Try Saun.art →
        </Link>
      </div>
    </main>
  );
}
