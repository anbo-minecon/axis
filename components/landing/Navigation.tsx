"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { IconMenu } from "@/components/icons";

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white bg-opacity-95 backdrop-blur-sm shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image src="/images/logo.png" alt="AXIS Logo" width={32} height={32} />
          <span className="font-bold text-xl text-blue-600 hidden sm:inline">AXIS</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#caracteristicas" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
            Características
          </a>
          <a href="#planes" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
            Planes
          </a>
          <a href="#faq" className="text-gray-600 hover:text-blue-600 font-medium transition-colors">
            FAQ
          </a>
        </nav>

        {/* CTA Buttons */}
        <div className="flex items-center gap-4">
          <Link
            href="/auth/login"
            className="hidden sm:inline text-gray-700 hover:text-blue-600 font-medium transition-colors"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/auth/registro"
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Registrarse
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-gray-600"
        >
          <IconMenu width={24} height={24} className="text-gray-600" />
        </button>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-t border-gray-100 shadow-lg md:hidden">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-4">
              <a href="#caracteristicas" className="block text-gray-600 hover:text-blue-600 font-medium">
                Características
              </a>
              <a href="#planes" className="block text-gray-600 hover:text-blue-600 font-medium">
                Planes
              </a>
              <a href="#faq" className="block text-gray-600 hover:text-blue-600 font-medium">
                FAQ
              </a>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
