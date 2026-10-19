import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
        <p>The Fantasy Golf Association</p>
        <nav className="flex gap-5">
          <Link href="/news" className="hover:text-gray-900 transition-colors">News</Link>
          <Link href="/my-leagues" className="hover:text-gray-900 transition-colors">My Leagues</Link>
          <Link href="/contact" className="hover:text-gray-900 transition-colors">Contact</Link>
        </nav>
      </div>
    </footer>
  );
}
