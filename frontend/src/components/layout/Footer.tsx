import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-white pt-16 pb-12 border-t border-[#1a1a1a]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-16 border-b border-[#2a2a2a]">
          {/* Brand Manifesto */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <img src="/shirt.png" alt="Nova Logo" className="w-7 h-7 object-contain invert" />
              <img
                src="/nova-calligraphy-white.png"
                srcSet="/nova-calligraphy-white.png 1x, /nova-calligraphy-white@2x.png 2x"
                alt="Nova"
                className="h-8 w-auto object-contain"
              />
            </div>
            <p className="text-[#afafaf] text-sm max-w-sm leading-relaxed mb-6">
              Modern clothing for everyday movement. Designed around restraint,
              monochrome discipline, and premium materials.
            </p>
            <div className="flex items-center gap-3">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-white"></span>
              <span className="text-xs text-[#8a8a8a] tracking-wider uppercase font-medium">
                Designed & Engineered in 2026
              </span>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Shop
            </h4>
            <ul className="space-y-3 text-sm text-[#afafaf]">
              <li>
                <Link to="/shop/men" className="hover:text-white transition-colors">
                  Men's Collection
                </Link>
              </li>
              <li>
                <Link to="/shop/women" className="hover:text-white transition-colors">
                  Women's Collection
                </Link>
              </li>
              <li>
                <Link to="/collections/new-arrivals" className="hover:text-white transition-colors">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link to="/collections" className="hover:text-white transition-colors">
                  All Collections
                </Link>
              </li>
              <li>
                <Link to="/shop/sale" className="hover:text-white transition-colors">
                  Sale & Offers
                </Link>
              </li>
            </ul>
          </div>

          {/* Help & Support */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Help
            </h4>
            <ul className="space-y-3 text-sm text-[#afafaf]">
              <li>
                <Link to="/account/orders" className="hover:text-white transition-colors">
                  Track Order
                </Link>
              </li>
              <li>
                <a href="#shipping" className="hover:text-white transition-colors">
                  Shipping & Delivery
                </a>
              </li>
              <li>
                <a href="#returns" className="hover:text-white transition-colors">
                  Returns & Exchanges
                </a>
              </li>
              <li>
                <a href="#size-guide" className="hover:text-white transition-colors">
                  Size Guide
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-white transition-colors">
                  Contact Support
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-4">
              Company
            </h4>
            <ul className="space-y-3 text-sm text-[#afafaf]">
              <li>
                <a href="#about" className="hover:text-white transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#sustainability" className="hover:text-white transition-colors">
                  Sustainability
                </a>
              </li>
              <li>
                <a href="#careers" className="hover:text-white transition-colors">
                  Careers
                </a>
              </li>
              <li>
                <Link to="/admin" className="hover:text-white transition-colors font-medium">
                  Admin Portal
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8a8a8a]">
          <p>© 2026 NOVA. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#privacy" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#terms" className="hover:text-white transition-colors">
              Terms of Service
            </a>
            <a href="#cookies" className="hover:text-white transition-colors">
              Cookie Preferences
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
