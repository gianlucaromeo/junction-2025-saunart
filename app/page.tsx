import Link from "next/link";

export default function Page() {
  return (
    <main className="min-h-screen w-full bg-[radial-gradient(ellipse_at_center_left,#273021,#000000)] flex items-center justify-center px-6">
      <div className="max-w-5xl w-full flex flex-col items-start justify-center gap-16 py-32">

        <h1
          className="font-[SF Pro Rounded] font-light leading-tight text-white"
          style={{ fontSize: "88px" }}
        >
          <span className="word-animate delay-1 text-gray-500">WHAT IF</span>{" "}
          <span className="word-animate delay-2 text-gray-200">SAUNA SENSORS</span>
          <br />
          <span className="word-animate delay-3 text-gray-500">COULD GENERATE</span>
          <br />
          <span className="word-animate delay-4 text-gray-200">ART & MUSIC?</span>
        </h1>

        <Link
          href="/demo"
          className="cta-button w-full justify-center border border-white/40 rounded-full px-12 py-6 text-white text-3xl font-[SF Pro Rounded] flex items-center"
        >
          <span className="cta-text">Try Saun.art →</span>
        </Link>

      </div>
    </main>
  );
}
