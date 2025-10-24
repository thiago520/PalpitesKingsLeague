// src/components/LogoKLP.tsx
// Logo SVG com gradiente dourado e glow, duas linhas: "Kings League" + "Palpites"
export default function LogoKLP({
  className,
  title = "Kings League",
  subtitle = "Palpites",
}: { className?: string; title?: string; subtitle?: string }) {
  return (
    <div className={className}>
      <svg viewBox="0 0 1200 320" className="w-full h-auto" aria-hidden="true">
        <defs>
          {/* Gradiente dourado */}
          <linearGradient id="klp-gold" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#FFD56A" />
            <stop offset="45%" stopColor="#FFC22E" />
            <stop offset="100%" stopColor="#E39C00" />
          </linearGradient>
          {/* Glow suave */}
          <filter id="klp-glow" x="-30%" y="-50%" width="160%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Linha 1: Kings League */}
        <text
          x="50%" y="52%"
          textAnchor="middle"
          fontSize="150"
          fontWeight={900}
          letterSpacing="1"
          fill="url(#klp-gold)"
          filter="url(#klp-glow)"
          style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,.25)", strokeWidth: 6 }}
        >
          {title}
        </text>

        {/* Linha 2: Palpites */}
        <text
          x="50%" y="88%"
          textAnchor="middle"
          fontSize="72"
          fontWeight={700}
          fill="url(#klp-gold)"
          filter="url(#klp-glow)"
          style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,.2)", strokeWidth: 4 }}
        >
          {subtitle}
        </text>
      </svg>
    </div>
  );
}
