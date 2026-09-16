import Link from 'next/link';

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gray-100 pb-20">
      {/* Header matching your main site layout */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            The Fantasy Golf Association
          </h1>
          <nav className="flex gap-6">
            <Link href="/" className="text-gray-600 hover:text-black">
              Home
            </Link>
            <Link href="/my-leagues" className="text-gray-600 hover:text-black">
              My Leagues
            </Link>
            <Link href="/news" className="text-gray-600 hover:text-black">
              News
            </Link>
            <Link href="/contact" className="text-black font-semibold">
              Contact
            </Link>
          </nav>
        </div>
      </header>

      {/* Contact Content Card */}
      <section className="max-w-xl mx-auto px-6 py-20">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-2">
            Support & Inquiries
          </p>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Get in Touch
          </h2>
          <p className="text-gray-600 mb-8">
            Have questions about league rules, weekly redrafts, scoring formats, or platform issues? Drop us an email and our team will get back to you.
          </p>
          
          <a 
            href="mailto:ryanwithfga@gmail.com" 
            className="inline-block bg-black text-white font-semibold px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Email Support
          </a>
        </div>
      </section>
    </main>
  );
}