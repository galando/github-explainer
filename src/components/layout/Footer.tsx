export function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-[--color-border-default] mt-16">
      <div className="container mx-auto px-4 py-6 flex items-center justify-between text-sm text-[--color-text-secondary]">
        <span className="font-semibold text-[--color-text-primary]">GitHub Explainer</span>
        <span>© {year} GitHub Project Explainer</span>
      </div>
    </footer>
  )
}

export default Footer
