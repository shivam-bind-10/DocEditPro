import Link from "next/link";
import { CATEGORIES, TOOLS } from "@/lib/tools-data";

export function Footer() {
  return (
    <footer className="w-full border-t border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((category) => {
            const categoryTools = TOOLS.filter((t) => t.category === category.id);
            return (
              <div key={category.id} className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
                  {category.name}
                </h4>
                <ul className="space-y-2 text-xs">
                  {categoryTools.map((tool) => (
                    <li key={tool.id}>
                      <Link
                        href={`/${tool.slug}`}
                        className="hover:text-[var(--foreground)] transition-colors"
                      >
                        {tool.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between border-t border-[var(--border)] pt-8 sm:flex-row">
          <div className="flex items-center space-x-3">
            <span className="font-bold text-sm text-[var(--foreground)]">DocEditPro</span>
            <span className="text-xs text-[var(--subtle-foreground)]">
              © {new Date().getFullYear()} DocEditPro. Privacy-first, 100% client-side PDF toolkit.
            </span>
          </div>

          <div className="mt-4 flex space-x-6 text-xs text-[var(--muted-foreground)] sm:mt-0">
            <span>No Server Uploads</span>
            <span>·</span>
            <span>No Watermarks</span>
            <span>·</span>
            <span>No Trackers</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
