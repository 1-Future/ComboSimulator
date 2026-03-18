export function Footer() {
  return (
    <footer className="border-t border-neutral-800 py-4 text-center text-xs text-neutral-500">
      <div className="mx-auto max-w-7xl px-4">
        <p>
          ComboSimulator — Practice League of Legends champion combos
        </p>
        <div className="mt-2 flex items-center justify-center gap-4">
          <a
            href="https://github.com/1-Future/ComboSimulator"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-neutral-300 transition-colors"
          >
            GitHub
          </a>
          <a
            href="https://ko-fi.com/combosim"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-neutral-300 transition-colors"
          >
            Support
          </a>
        </div>
      </div>
    </footer>
  )
}
