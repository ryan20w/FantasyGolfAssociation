import Link from "next/link";

export default function MyLeagues() {
  return (
    <main className="min-h-screen bg-gray-100">

      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">

          <Link href="/" className="text-2xl font-bold">
            The Fantasy Golf Association
          </Link>

          <nav className="flex gap-6">
            <Link
              href="/"
              className="text-gray-600 hover:text-black"
            >
              Home
            </Link>

            <Link
              href="/my-leagues"
              className="text-gray-600 hover:text-black"
            >
              My Leagues
            </Link>

            <Link
              href="/news"
              className="text-gray-600 hover:text-black"
            >
              News
            </Link>

            <Link
              href="/contact"
              className="text-gray-600 hover:text-black"
            >
              Contact
            </Link>
          </nav>

        </div>
      </header>

      {/* My Leagues */}
      <section className="max-w-6xl mx-auto px-6 py-16">

        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-2">
            The Fantasy Golf Association
          </p>

          <h2 className="text-4xl font-bold mb-3">
            My Leagues
          </h2>

          <p className="text-gray-600">
            Create a league or join an existing league with your friends.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">

          {/* Create League */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">

            <h3 className="text-2xl font-bold mb-3">
              Create a League
            </h3>

            <p className="text-gray-600 mb-6">
              Start your own fantasy golf league and invite your friends.
            </p>

            <Link
              href="/my-leagues/create"
              className="inline-block bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition"
            >
              Create League
            </Link>

          </div>

          {/* Join League */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">

            <h3 className="text-2xl font-bold mb-3">
              Join a League
            </h3>

            <p className="text-gray-600 mb-6">
              Have a league code from a friend? Use it to join their league.
            </p>

            <Link
              href="/join"
              className="inline-block bg-white border border-gray-300 text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              Join League
            </Link>

          </div>

        </div>

      </section>

    </main>
  );
}