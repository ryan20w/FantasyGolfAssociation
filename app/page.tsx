"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateLeagueOpen, setIsCreateLeagueOpen] = useState(false);

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tight">
            The Fantasy Golf Association
          </h1>
          <nav className="flex gap-6 font-medium">
            <Link href="/" className="text-black">
              Home
            </Link>
            <Link href="/my-leagues" className="text-gray-600 hover:text-black transition-colors">
              My Leagues
            </Link>
            <Link href="/news" className="text-gray-600 hover:text-black transition-colors">
              News
            </Link>
            <Link href="/contact" className="text-gray-600 hover:text-black transition-colors">
              Contact
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section (Top Title & Call to Action Area) */}
      <section className="bg-gradient-to-b from-emerald-50/60 to-gray-50 border-b border-emerald-100/50 py-24">
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-sm font-bold uppercase tracking-widest text-emerald-700 mb-4">
            The Premier Fantasy Golf Destination
          </p>
          <h2 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight leading-tight">
            Fantasy Golf.
            <br />
            <span className="text-emerald-600">Built for Golf Fans. By Golf Fans.</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mb-8 leading-relaxed">
            Build your team weekly, win the season-long race for the FGA Cup.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/my-leagues/create"
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3.5 rounded-xl font-semibold shadow-sm transition-all duration-200 hover:shadow"
            >
              Create League
            </Link>
            <Link
              href="/join"
              className="bg-white border border-gray-300 text-gray-700 px-8 py-3.5 rounded-xl font-semibold hover:bg-gray-100 transition-all duration-200"
            >
              Join League
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">
          How it Works
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          
          <div className="bg-white rounded-2xl p-8 border border-gray-200/80 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Real-Time Data
            </h3>
            <p className="text-gray-600 leading-relaxed">
              FGA pulls live updates every 15 seconds to give you real-time player scoring and performance.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-gray-200/80 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Weekly Drafting
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Draft your team each week and showcase your golf knowledge, competing against your friends throughout the season.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-gray-200/80 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Season Points
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Like the PGA Tour, the FGA allocates a season-long points race to crown the FGA Cup champion.
            </p>
          </div>

        </div>
      </section>

      {/* Contests */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">
          Weekly Contests
        </h2>
        <div className="bg-white rounded-2xl p-8 border border-gray-200/80 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md w-full flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold text-emerald-600 mb-1">
              Weekly Redrafts aren&apos;t your thing?
            </h3>
            <p className="text-sm font-semibold text-gray-900 mb-3">
              No problem!
            </p>
            <p className="text-base text-gray-600 mb-8 max-w-3xl leading-relaxed">
              We offer weekly, beat-the-pros contests where you can compete against our league for a chance at cash prizes!
            </p>
          </div>

          <div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-2.5 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 transition-all duration-200"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white p-8 rounded-2xl w-full max-w-2xl relative shadow-xl border border-gray-100">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute right-5 top-5 text-2xl text-gray-400 hover:text-black transition-colors"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Beat-the-Pros</h2>
            <p className="text-gray-600 leading-relaxed">
              Beat-the-pros contests offer a unique opportunity to compete against the founders of FGA for the opportunity to win cash prizes!
              <br /><br />
              Here&apos;s how it works: Each week, participants who enter will draft a team of golfers who are competing in that week&apos;s PGA Tour event. Participants have the objective of drafting a better team than the founders of FGA.
              <br /><br />
              Participants who beat the founders in their contests will be entered into a drawing for a chance to win cash prizes. The more weeks you enter, the more chances you have to win!
            </p>
          </div>
        </div>
      )}
    </main>
  );
}