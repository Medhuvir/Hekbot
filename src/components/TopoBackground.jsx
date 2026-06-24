// Topographic texture — brand-standard, always at low opacity
export default function TopoBackground({ className = '', opacity = 0.08 }) {
  return (
    <svg
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      viewBox="0 0 1440 240"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity }}
    >
      <path d="M0 120 Q180 60 360 120 Q540 180 720 120 Q900 60 1080 120 Q1260 180 1440 120"
        stroke="#FF5E1A" strokeWidth="2" fill="none" />
      <path d="M0 140 Q180 80 360 140 Q540 200 720 140 Q900 80 1080 140 Q1260 200 1440 140"
        stroke="#FF5E1A" strokeWidth="1.2" fill="none" />
      <path d="M0 100 Q180 40 360 100 Q540 160 720 100 Q900 40 1080 100 Q1260 160 1440 100"
        stroke="#FF5E1A" strokeWidth="1.2" fill="none" />
      <path d="M0 160 Q180 100 360 160 Q540 220 720 160 Q900 100 1080 160 Q1260 220 1440 160"
        stroke="#FF5E1A" strokeWidth="0.8" fill="none" />
      <path d="M0 80 Q180 20 360 80 Q540 140 720 80 Q900 20 1080 80 Q1260 140 1440 80"
        stroke="#FF5E1A" strokeWidth="0.8" fill="none" />
      <ellipse cx="720" cy="120" rx="280" ry="80" stroke="#FF5E1A" strokeWidth="1" fill="none" />
      <ellipse cx="720" cy="120" rx="440" ry="120" stroke="#FF5E1A" strokeWidth="0.7" fill="none" />
      <ellipse cx="200" cy="60"  rx="120" ry="45" stroke="#FF5E1A" strokeWidth="0.6" fill="none" />
      <ellipse cx="1240" cy="185" rx="150" ry="55" stroke="#FF5E1A" strokeWidth="0.6" fill="none" />
    </svg>
  )
}
