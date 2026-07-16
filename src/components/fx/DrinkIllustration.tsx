/** DrinkIllustration — editorial SVG art per-drink, keyed to category.
 *  Replaces ImagePlaceholder in ProductDetail when no real photo exists.
 *  One consistent visual language: cinematic, warm, minimal. */

const PALETTE = {
  espresso: { bg: "#1a0f08", rim: "#C8A951", liquid: "#3d2010", steam: "rgba(243,237,226,0.18)" },
  iced:     { bg: "#0d1f1a", rim: "#6ab4a0", liquid: "#1a3d35", steam: "rgba(180,220,210,0.15)" },
  matcha:   { bg: "#0f1a0d", rim: "#8aad6a", liquid: "#1a3214", steam: "rgba(180,210,160,0.15)" },
  refresh:  { bg: "#1a0d14", rim: "#c87090", liquid: "#3d1025", steam: "rgba(220,160,180,0.12)" },
  cold:     { bg: "#080d1a", rim: "#5a7eaa", liquid: "#0d1a35", steam: "rgba(140,170,220,0.12)" },
  bakery:   { bg: "#1a1108", rim: "#d4956a", liquid: "#3d2808", steam: "rgba(240,210,180,0.15)" },
};

type Pal = (typeof PALETTE)[keyof typeof PALETTE];

function getCategoryPalette(category: string): Pal {
  if (category.includes("Iced") || category.includes("Nitro")) return PALETTE.iced;
  if (category.includes("Matcha") || category.includes("Tea")) return PALETTE.matcha;
  if (category.includes("Refresher") || category.includes("Energy")) return PALETTE.refresh;
  if (category.includes("Cold Brew")) return PALETTE.cold;
  if (category.includes("Bakery")) return PALETTE.bakery;
  return PALETTE.espresso;
}

function SteamWisps({ color }: { color: string }) {
  return (
    <g>
      {[0, 1, 2].map((i) => (
        <path key={i}
          d={`M${92 + i * 8},${125} q${6 - i * 2},-18,${-4 + i},-36 q${8},-18,${-2},-32`}
          stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" opacity={0.6 - i * 0.15}>
          <animate attributeName="opacity"
            values={`${0.6 - i * 0.15};0;${0.6 - i * 0.15}`}
            dur={`${3 + i * 0.7}s`} begin={`${i * 0.9}s`} repeatCount="indefinite" />
        </path>
      ))}
    </g>
  );
}

function EspressoCup({ p }: { p: Pal }) {
  return (
    <>
      <ellipse cx="100" cy="192" rx="68" ry="10" fill={p.rim} opacity="0.18" />
      <path d="M55,130 Q50,192 70,196 L130,196 Q150,192 145,130 Q140,122 100,120 Q60,122 55,130 Z"
        fill={p.liquid} stroke={p.rim} strokeWidth="1.5" opacity="0.9" />
      <ellipse cx="100" cy="130" rx="44" ry="10" fill={p.rim} opacity="0.45" />
      <ellipse cx="100" cy="130" rx="30" ry="6" fill={p.rim} opacity="0.3" />
      <path d="M145,148 Q172,148 172,165 Q172,182 145,182"
        stroke={p.rim} strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.7" />
      <SteamWisps color={p.steam} />
    </>
  );
}

function IcedGlass({ p }: { p: Pal }) {
  return (
    <>
      <path d="M62,80 L70,212 L130,212 L138,80 Z"
        fill={p.liquid} opacity="0.7" stroke={p.rim} strokeWidth="1.2" />
      <path d="M68,130 Q100,110 132,130 Q100,150 68,130" fill="rgba(243,237,226,0.2)" />
      {[[75,155],[90,170],[110,158],[120,172]].map(([cx,cy],i) => (
        <rect key={i} x={cx} y={cy} width="16" height="16" rx="3"
          fill="rgba(200,230,230,0.25)" stroke="rgba(200,230,230,0.5)" strokeWidth="1"
          transform={`rotate(${i*12},${cx+8},${cy+8})`} />
      ))}
      <rect x="114" y="60" width="5" height="155" rx="2.5" fill={p.rim} opacity="0.8" />
    </>
  );
}

function BakeryItem({ p }: { p: Pal }) {
  return (
    <>
      <ellipse cx="100" cy="185" rx="70" ry="14" fill={p.rim} opacity="0.2" />
      <path d="M45,165 Q60,110 100,118 Q140,110 155,165 Q140,185 100,178 Q60,185 45,165 Z"
        fill={p.liquid} stroke={p.rim} strokeWidth="1.5" />
      <path d="M55,155 Q100,140 145,155" stroke={p.rim} strokeWidth="1.5" fill="none" opacity="0.5" />
      <path d="M52,162 Q100,148 148,162" stroke={p.rim} strokeWidth="1" fill="none" opacity="0.35" />
      <path d="M65,140 Q85,128 105,135" stroke="rgba(243,237,226,0.4)"
        strokeWidth="3" fill="none" strokeLinecap="round" />
    </>
  );
}

function MatchaBowl({ p }: { p: Pal }) {
  return (
    <>
      <path d="M45,145 Q45,200 100,205 Q155,200 155,145 Q155,130 100,128 Q45,130 45,145 Z"
        fill={p.liquid} stroke={p.rim} strokeWidth="1.5" opacity="0.9" />
      <ellipse cx="100" cy="145" rx="54" ry="17" fill={p.rim} opacity="0.35" />
      {[-12,-4,4,12].map((dx, i) => (
        <path key={i} d={`M${100+dx},135 Q${100+dx+3},145 ${100+dx},155`}
          stroke="rgba(243,237,226,0.3)" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      ))}
      <SteamWisps color={p.steam} />
    </>
  );
}

export function DrinkIllustration({
  name, category, className = "",
}: {
  name: string;
  category: string;
  className?: string;
}) {
  const p = getCategoryPalette(category);
  const isIced = category.includes("Iced") || category.includes("Nitro") || category.includes("Cold");
  const isBakery = category.includes("Bakery");
  const isMatcha = category.includes("Matcha") || category.includes("Tea");

  return (
    <figure
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{
        aspectRatio: "1/1",
        background: `radial-gradient(ellipse at 30% 20%, ${p.rim}22, ${p.bg})`,
      }}
      aria-label={name}
    >
      <div
        className="absolute right-0 top-0 h-48 w-48 rounded-full opacity-20"
        style={{
          background: `radial-gradient(circle, ${p.rim}, transparent 70%)`,
          transform: "translate(30%,-30%)",
        }}
      />
      <svg
        viewBox="0 0 200 240"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        {[[30,200],[160,205],[22,175],[170,180]].map(([bx,by],i) => (
          <ellipse key={i} cx={bx} cy={by} rx="6" ry="4" fill={p.rim} opacity="0.18"
            transform={`rotate(${i*35},${bx},${by})`} />
        ))}
        {isBakery ? <BakeryItem p={p} />
          : isIced ? <IcedGlass p={p} />
          : isMatcha ? <MatchaBowl p={p} />
          : <EspressoCup p={p} />}
      </svg>
      <figcaption className="absolute bottom-3 left-4 right-4">
        <p className="font-button text-[10px] uppercase tracking-[0.2em] text-[#F3EDE2] opacity-50">
          {name}
        </p>
      </figcaption>
    </figure>
  );
}
