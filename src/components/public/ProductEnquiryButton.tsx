'use client';

import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { ProductData } from '@/types';
import ProductEnquiryModal from './ProductEnquiryModal';

interface ProductEnquiryButtonProps {
  product: ProductData;
  className?: string;
  label?: string;
}

export default function ProductEnquiryButton({
  product,
  className,
  label = 'Order / Inquire on Website',
}: ProductEnquiryButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={
          className ||
          'inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition shadow-md shadow-emerald-600/20'
        }
      >
        <MessageSquare className="w-4 h-4" />
        <span>{label}</span>
      </button>

      <ProductEnquiryModal
        product={product}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
