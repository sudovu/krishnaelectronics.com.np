'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home, MessageSquare, Phone } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log unexpected runtime errors to browser console without leaking to UI
    console.error('[Krishna Electronics Error Boundary]:', error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full text-center space-y-8">
        {/* Warning Badge & Icon */}
        <div className="space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-xs">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider">
            <span>Temporary Application Error</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
            Something went wrong / समस्या उत्पन्न भयो
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto leading-relaxed">
            An unexpected error occurred while loading this page. Our team in Surkhet has been notified. Please try refreshing or return to the homepage.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition transform hover:scale-[1.02]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Again / पुनः प्रयास गर्नुहोस्</span>
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition"
          >
            <Home className="w-4 h-4 text-brand-500" />
            <span>Return Home</span>
          </Link>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition"
          >
            <span>Product Catalog</span>
          </Link>
        </div>

        {/* Assistance Links */}
        <div className="pt-6 border-t border-slate-200">
          <p className="text-xs text-slate-500">
            If this issue persists, please reach out to our Surkhet store directly:
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
              href="https://wa.me/9779858083951?text=Hello%20Krishna%20Electronics%2C%20I%20encountered%20an%20error%20on%20your%20website."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 transition"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Support</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
