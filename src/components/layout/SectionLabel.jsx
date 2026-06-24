export default function SectionLabel({ children, number }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="font-sans text-[10px] font-normal tracking-[0.2em] uppercase text-dn-graphite whitespace-nowrap">
        {number && <span className="text-dn-orange mr-2">{number} —</span>}
        {children}
      </span>
      <div className="flex-1 h-px bg-white/[0.12]" />
    </div>
  )
}
