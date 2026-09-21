export default function Icon({ name, size = 20, className = '', ...props }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{ fontSize: size }}
      aria-hidden="true"
      {...props}
    >
      {name}
    </span>
  )
}
