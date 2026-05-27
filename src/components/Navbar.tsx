import { Link } from '@tanstack/react-router'

export function Navbar({ right }: { right?: React.ReactNode }) {
  return (
    <nav className="flex items-center justify-between px-8 h-14 border-b border-white/7 shrink-0">
      <Link to="/" className="text-white text-sm font-medium">
        SheetToAPI
      </Link>
      {right && <div className="flex items-center gap-4">{right}</div>}
    </nav>
  )
}
