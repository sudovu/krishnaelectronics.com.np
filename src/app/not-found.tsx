import React from 'react';
import Link from 'next/link';
import { Home, Package, Wrench, Search, MessageSquare, Phone, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Page Not Found (404) | Krishna Electronics Surkhet',
  description: 'The page or product you are looking for cannot be found. Explore genuine electronics, laptops, CCTV cameras, and repair services in Surkhet, Nepal.',
};

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Visual Badge & Error Code */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-brand-600 text-xs font-bold uppercase tracking-wider">
            <span>HTTP 404 &bull; Missing Resource</span>
          </div>
          <h1 className="text-7xl sm:text-8xl font-black text-navy-900 tracking-tight">
            4<span className="text-brand-500">0</span>4
          </h1>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
            Page Not Found / पृष्ठ फेला परेन
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto leading-relaxed">
            The page, product, or link you followed may have been moved, renamed, or is temporarily unavailable in our catalog.
          </p>
        </div>

        {/* Quick Search Action */}
        <div className="max-w-md mx-auto">
          <form action="/products" method="GET" className="relative flex items-center">
            <input
              type="text"
              name="q"
              placeholder="Search laptops, Wi-Fi routers, CCTV..."
              className="w-full pl-10 pr-24 py-3 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent shadow-xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
            <button
              type="submit"
              className="absolute right-1.5 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold transition shadow-xs"
            >
              Search
            </button>
          </form>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition transform hover:scale-[1.02]"
          >
            <Home className="w-4 h-4" />
            <span>Go to Homepage</span>
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition"
          >
            <Package className="w-4 h-4 text-brand-500" />
            <span>Browse Products</span>
          </Link>
          <Link
            href="/services"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition"
          >
            <Wrench className="w-4 h-4 text-brand-500" />
            <span>Repair Services</span>
          </Link>
        </div>

        {/* Need Assistance Helper */}
        <div className="pt-6 border-t border-slate-200">
          <p className="text-xs text-slate-500">
            Looking for a specific device or technical service in Surkhet?
          </p>
          <div className="flex items-center justify-center gap-6 mt-3 text-xs font-semibold text-slate-700">
            <a
              href="tel:083522006"
              className="inline-flex items-center gap-1.5 hover:text-brand-600 transition"
            >
              <Phone className="w-3.5 h-3.5 text-brand-500" />
              <span>083-522006</span>
            </a>
            <span className="text-slate-300">&bull;</span>
            <a
              href="https://wa.me/9779858083951?text=Hello%20Krishna%20Electronics%2C%20I%20need%20help%20finding%20a%20product%20or%20service."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 transition"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Us</span>
            </a>
            <span className="text-slate-300">&bull;</span>
            <Link
              href="/contact"
              className="inline-flex items-center gap-1.5 hover:text-brand-600 transition"
            >
              <span>Contact Store &rarr;</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
