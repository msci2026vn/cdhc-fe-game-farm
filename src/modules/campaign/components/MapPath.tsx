interface MapPathProps {
  /** viewBox height — adjusts to content */
  height?: number;
  /** Path definition (SVG d attribute) */
  pathD: string;
}

/**
 * SVG dashed line connecting stage nodes.
 * Renders a shadow path behind the main path for depth.
 */
export default function MapPath({ height = 800, pathD }: MapPathProps) {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      viewBox={`0 0 390 ${height}`}
      preserveAspectRatio="none"
    >
      {/* Shadow */}
      <path
        d={pathD}
        fill="none"
        stroke="rgba(0,0,0,0.2)"
        strokeWidth={14}
        strokeDasharray="10, 15"
        strokeLinecap="round"
      />
      {/* Main path */}
      <path
        d={pathD}
        fill="none"
        stroke="#F5E6D3"
        strokeWidth={8}
        strokeDasharray="10, 15"
        strokeLinecap="round"
      />
    </svg>
  );
}
