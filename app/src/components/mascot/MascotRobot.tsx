interface Props {
  size?: number;
  /** Animation speed multiplier (1 = normal, 1.8 = fast/talking) */
  speed?: number;
}

export default function MascotRobot({ size = 128, speed = 1 }: Props) {
  const floatDur = `${1.6 / speed}s`;
  const blinkDur = `${4 / speed}s`;

  return (
    <svg
      viewBox="0 0 200 280"
      width={size}
      height={size}
      style={{ overflow: 'visible' }}
    >
      {/* Shadow — pulses with float */}
      <ellipse
        cx="100" cy="262" rx="40" ry="7"
        fill="rgba(60,60,80,0.18)"
        style={{ animation: `mascotShadow ${floatDur} ease-in-out infinite`, transformOrigin: '100px 262px' }}
      />

      {/* Robot body group — floats up/down */}
      <g style={{ animation: `mascotFloat ${floatDur} ease-in-out infinite` }}>

        {/* === ANTENNA === */}
        <line x1="100" y1="26" x2="100" y2="50" stroke="#D4900D" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="100" cy="20" r="9" fill="#F58531" />
        <circle cx="100" cy="17" r="3" fill="#FFCF4A" opacity="0.6" />

        {/* === EARS === */}
        <ellipse cx="37" cy="88" rx="12" ry="15" fill="#F58531" />
        <ellipse cx="163" cy="88" rx="12" ry="15" fill="#F58531" />
        {/* Ear highlights */}
        <ellipse cx="37" cy="85" rx="6" ry="8" fill="#FFA94D" opacity="0.5" />
        <ellipse cx="163" cy="85" rx="6" ry="8" fill="#FFA94D" opacity="0.5" />

        {/* === HEAD === */}
        <rect x="44" y="52" width="112" height="72" rx="28" fill="#F8CF25" stroke="#D4A017" strokeWidth="2" />
        {/* Head highlight */}
        <rect x="52" y="56" width="96" height="24" rx="12" fill="#FFDF5C" opacity="0.35" />

        {/* === VISOR === */}
        <rect x="56" y="68" width="88" height="40" rx="13" fill="#1C1C2E" stroke="#F58531" strokeWidth="2.5" />
        {/* Visor screen glare */}
        <rect x="62" y="72" width="30" height="6" rx="3" fill="rgba(255,255,255,0.08)" />

        {/* === EYES === */}
        <circle cx="80" cy="88" r="6" fill="#E8D44D"
          style={{ animation: `mascotBlink ${blinkDur} ease-in-out infinite` }}
        />
        <circle cx="120" cy="88" r="6" fill="#E8D44D"
          style={{ animation: `mascotBlink ${blinkDur} ease-in-out infinite` }}
        />
        {/* Eye glints */}
        <circle cx="83" cy="85" r="2" fill="rgba(255,255,255,0.7)" />
        <circle cx="123" cy="85" r="2" fill="rgba(255,255,255,0.7)" />

        {/* === NECK === */}
        <rect x="82" y="122" width="36" height="14" rx="4" fill="#F58531" />

        {/* === BODY === */}
        <rect x="52" y="134" width="96" height="108" rx="42" fill="#F8CF25" stroke="#D4A017" strokeWidth="2" />
        {/* Body highlight */}
        <ellipse cx="85" cy="155" rx="22" ry="14" fill="#FFDF5C" opacity="0.3" />

        {/* === LIGHTNING BOLT === */}
        <polygon
          points="112,150 96,182 110,178 90,218 106,188 92,192"
          fill="#F58531"
          stroke="#D4900D"
          strokeWidth="1"
          strokeLinejoin="round"
        />

        {/* === LEFT ARM + HAND === */}
        <path d="M52,170 C40,178 34,190 32,200" stroke="#D4A017" strokeWidth="5" fill="none" strokeLinecap="round" />
        <circle cx="30" cy="203" r="6" fill="#2D2D3D" />
        {/* Claw fingers */}
        <line x1="25" y1="200" x2="21" y2="195" stroke="#2D2D3D" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="27" y1="206" x2="22" y2="209" stroke="#2D2D3D" strokeWidth="2.5" strokeLinecap="round" />

        {/* === RIGHT ARM + HAND === */}
        <path d="M148,170 C160,178 166,190 168,200" stroke="#D4A017" strokeWidth="5" fill="none" strokeLinecap="round" />
        <circle cx="170" cy="203" r="6" fill="#2D2D3D" />
        {/* Claw fingers */}
        <line x1="175" y1="200" x2="179" y2="195" stroke="#2D2D3D" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="173" y1="206" x2="178" y2="209" stroke="#2D2D3D" strokeWidth="2.5" strokeLinecap="round" />

      </g>
    </svg>
  );
}
