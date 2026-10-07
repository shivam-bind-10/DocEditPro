import Link from "next/link";
import { CATEGORIES, TOOLS } from "@/lib/tools-data";

export function Footer() {
  return (
    <footer className="w-full border-t border-white/[0.06] bg-[#141414] text-[#9b9b9b]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6">
          {CATEGORIES.map((category) => {
            const categoryTools = TOOLS.filter((t) => t.category === category.id);
            return (
              <div key={category.id} className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  {category.name}
                </h4>
                <ul className="space-y-2 text-xs">
                  {categoryTools.map((tool) => (
                    <li key={tool.id}>
                      <Link
                        href={`/${tool.slug}`}
                        className="hover:text-white transition-colors"
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

        <div className="mt-12 flex flex-col items-center justify-between border-t border-white/[0.06] pt-8 sm:flex-row">
          <div className="flex items-center space-x-3">
            <span className="font-bold text-sm text-white">DocEditPro</span>
            <span className="text-xs text-[#6b6b6b]">
              © {new Date().getFullYear()} DocEditPro. Notion-inspired, 100% client-side PDF toolkit.
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-[#9b9b9b] sm:mt-0">
            <Link href="/guides" className="hover:text-white transition-colors underline-offset-4 hover:underline">
              How-To Guides
            </Link>
            <span>·</span>
            <Link href="/edit-pdf-text" className="hover:text-white transition-colors underline-offset-4 hover:underline">
              PDF Editor
            </Link>
            <span>·</span>
            <span>Zero Server Uploads</span>
            <span>·</span>
            <span>No Watermarks</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
