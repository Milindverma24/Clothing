import React from 'react';
import type { Product } from '../../types';
import { ProductCard } from './ProductCard';

export interface ProductGridProps {
  products: Product[];
  emptyMessage?: string;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  emptyMessage = 'No products match your selection.',
}) => {
  if (products.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="text-base text-[#5e5e5e] mb-4">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
};
