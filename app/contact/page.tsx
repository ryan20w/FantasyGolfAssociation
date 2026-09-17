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
            <Link href="/news" className="text-gray-600 hover:text-black">
              News
            </Link>
            <Link
  href="/profile"
  className="bg-black text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
>
  Profile
</Link>
          </nav>
        </div>
      </header>

      {/* Contact Form Card */}
      <section className="max-w-xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
          <p className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-2">
            Support & Inquiries
          </p>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Get in Touch
          </h2>
          <p className="text-gray-600 mb-8">
            Have questions about league rules, weekly redrafts, scoring formats, or platform issues? Drop us a message below.
          </p>
          
          {/* Formspree Form (Replace YOUR_FORM_ID with your actual Formspree endpoint ID) */}
          <form action="https://formspree.io/f/mqpazyee" method="POST" className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
              <input 
                type="text" 
                name="name" 
                required 
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-black" 
                placeholder="Tiger Woods" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input 
                type="email" 
                name="email" 
                required 
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-black" 
                placeholder="tiger@example.com" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea 
                name="message" 
                rows={4} 
                required 
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-black" 
                placeholder="Your message..."
              ></textarea>
            </div>

            <button 
              type="submit" 
              className="w-full bg-black text-white font-semibold px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Send Message
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}