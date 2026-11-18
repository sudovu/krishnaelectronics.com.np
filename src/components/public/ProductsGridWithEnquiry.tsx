'use client';

import React, { useState } from 'react';
import { ProductData } from '@/types';
import ProductCard from './ProductCard';
import ProductEnquiryModal from './ProductEnquiryModal';

interface ProductsGridWithEnquiryProps {
  products: ProductData[];
}

export default function ProductsGridWithEnquiry({ products }: ProductsGridWithEnquiryProps) {
  const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onInquire={(p) => setSelectedProduct(p)}
          />
        ))}
      </div>

      <ProductEnquiryModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </>
  );
}
