// src/components/LoginScreen.tsx
import LogoKLP from "./LogoKLP";

export default function LoginScreen() {
  return (
    <main className="relative min-h-screen bg-black text-zinc-100 flex items-center justify-center overflow-hidden">
      {/* BACKGROUND DECOR */}
      <GlowBackdrop />

      <div className="relative z-10 w-full max-w-2xl px-6">
        {/* LOGO */}
        <LogoKLP className="mb-6" />

        {/* CARD */}
        <div className="mx-auto max-w-xl rounded-2xl border border-amber-400/40 bg-zinc-900/60 p-6 backdrop-blur-md shadow-[0_0_0_1px_rgba(255,196,28,0.12),0_30px_80px_-20px_rgba(0,0,0,0.9)]">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-amber-200">Bem-vindo!</h2>
            <p className="text-sm text-zinc-300/90">
              Faça login para começar a fazer seus palpites
            </p>
          </div>

          <div className="mt-6 flex justify-center">
            <a
              href="/api/auth/twitch/login"
              className="inline-flex items-center gap-2 rounded-xl bg-[#9146FF] px-5 py-3 text-base font-semibold text-white shadow-lg hover:bg-[#7b2bff] focus:outline-none focus:ring-4 focus:ring-[#9146FF]/40 active:translate-y-px transition"
            >
              <TwitchIcon className="h-5 w-5" />
              Entrar com Twitch
            </a>
          </div>

          <p className="mt-6 text-center text-xs text-zinc-400">
            Ao fazer login, você concorda com os termos de uso da plataforma.
          </p>
        </div>
      </div>
    </main>
  );
}

function GlowBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {/* halo central dourado atrás da logo */}
      <div
        className="absolute left-1/2 top-16 -translate-x-1/2 h-[460px] w-[840px] rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 50%, rgba(255,200,40,0.28) 0%, rgba(255,170,40,0.12) 42%, transparent 72%)",
        }}
      />
      {/* vinheta sutil nas bordas */}
      <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_50%_-100px,transparent,rgba(0,0,0,.8))]" />
      {/* ruído sutil para textura */}
      <div
        className="absolute inset-0 opacity-[0.06] mix-blend-soft-light"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.65' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />
    </div>
  );
}

function TwitchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M4 3h16v11.5L16.5 18H13l-2.2 2H8v-2H4V3zm2 2v9h3v2h1.4l2.2-2H16l2-2V5H6zm8 7h-2V7h2v5zm-5 0H7V7h2v5z" />
    </svg>
  );
}
