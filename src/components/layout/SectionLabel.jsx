export default function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="font-sans text-[15px] font-normal tracking-[0.2em] uppercase text-dn-gray-light whitespace-nowrap">
        {children}
      </span>
      <div className="flex-1 h-px bg-white/[0.12]" />
    </div>
  )
}
