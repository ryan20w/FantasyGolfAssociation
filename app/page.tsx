"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function Home() {

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateLeagueOpen, setIsCreateLeagueOpen] = useState(false);
  return (
    <main className="min-h-screen bg-gray-100">

      {/* Header */}
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
            <Link href="/news" className="text-gray-600 hover:text-black">
              Contact
            </Link>
          </nav>
        </div>
      </header>

      {/* Title Stuff */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <p className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-4">
          The Premier Fantasy Golf Destination
        </p>
        <h2 className="text-5xl font-bold mb-6">
          Fantasy Golf.
          <br />
          Built for Golf Fans. By Golf Fans.
        </h2>
        <p className="text-xl text-gray-600 max-w-2xl mb-8">
          Build your team weekly, win the season-long race for the FGA Cup.
        </p>
        <div className="flex gap-4">
          <button className="bg-black text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800">
            Create League
          </button>
          <button className="bg-white border px-6 py-3 rounded-lg font-semibold hover:bg-gray-50">
            Join League
          </button>
        </div>
      </section>

      {/* How it Works */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold mb-6">
          How it Works
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-xl font-bold">
              Real-Time Data
            </h3>
            <p className="text-gray-600 mt-2">
              FGA pulls live updates every 15 seconds to give you real-time player scoring and performance.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-xl font-bold">
              Weekly Drafting
            </h3>
            <p className="text-gray-600 mt-2">
              Draft your team each week and showcase your golf knowledge, competing against your friends throughout the season.
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-xl font-bold">
              Season Points
            </h3>
            <p className="text-gray-600 mt-2">
              Like the PGA Tour, the FGA allocates a season-long points race to crown the FGA Cup champion.
            </p>
          </div>

        </div>
      </section>

      {/* Contests */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold mb-6">
          Weekly Contests
        </h2>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 transition hover:shadow-md w-full flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold text-green-600 mb-1">
              Weekly Redrafts aren&apos;t your thing?
            </h3>
            <p className="text-sm font-normal text-black mb-3">
              No problem!
            </p>
            <p className="text-base text-gray-600 mb-6">
              We offer weekly, beat-the-pros contests where you can compete against our league for a chance at cash prizes!
            </p>
          </div>

          {/* Trigger Button */}
          <div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Modal Overlay (Only renders when isModalOpen is true) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white p-6 rounded-xl w-11/12 max-w-2xl relative shadow-lg">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute right-4 top-3 text-2xl text-gray-500 hover:text-black"
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4">Beat-the-Pros</h2>
            <p className="text-gray-600">Beat-the-pros contests offer a unique opportunity to compete against the founders of FGA for the opportunity to win cash prizes!

              Here's how it works: Each week, participants who enter will draft a team of golfers who are competing in that week's PGA Tour event. Participants have the objective of drafting a better team than the founders of FGA.
              Participants who beat the founders in their contests will be entered into a drawing for a chance to win cash prizes. The more weeks you enter, the more chances you have to win!
            </p>
          </div>
        </div>
      )}
    </main>
  );
}
