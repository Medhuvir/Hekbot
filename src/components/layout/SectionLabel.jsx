export default function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="font-sans text-body font-normal tracking-label uppercase text-dn-gray-light whitespace-nowrap">
        {children}
      </span>
      <div className="flex-1 h-px bg-dn-line-strong" />
    </div>
  )
}
