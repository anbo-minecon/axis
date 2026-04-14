import Image from "next/image";
import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image src="/images/logo.png" alt="AXIS Logo" width={32} height={32} />
              <span className="font-bold text-lg text-white">AXIS</span>
            </Link>
            <p className="text-sm">
              La plataforma completa para prepararte para las Pruebas de Estado ICFES en Colombia.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-bold text-white mb-4">Producto</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#caracteristicas" className="hover:text-blue-400 transition-colors">
                  Características
                </Link>
              </li>
              <li>
                <Link href="#planes" className="hover:text-blue-400 transition-colors">
                  Planes
                </Link>
              </li>
              <li>
                <Link href="#faq" className="hover:text-blue-400 transition-colors">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href="/auth/registro" className="hover:text-blue-400 transition-colors">
                  Registrarse
                </Link>
              </li>
            </ul>
          </div>

          {/* Institución */}
          <div>
            <h3 className="font-bold text-white mb-4">Institución</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="mailto:info@axispreicfes.com" className="hover:text-blue-400 transition-colors">
                  Contacto
                </a>
              </li>
              <li>
                <a href="mailto:ventas@axispreicfes.com" className="hover:text-blue-400 transition-colors">
                  Ventas
                </a>
              </li>
              <li>
                <Link href="/terminos" className="hover:text-blue-400 transition-colors">
                  Términos de Servicio
                </Link>
              </li>
              <li>
                <Link href="/privacidad" className="hover:text-blue-400 transition-colors">
                  Política de Privacidad
                </Link>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-bold text-white mb-4">Síguenos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="https://facebook.com/axispreicfes" className="hover:text-blue-400 transition-colors">
                  Facebook
                </a>
              </li>
              <li>
                <a href="https://instagram.com/axispreicfes" className="hover:text-blue-400 transition-colors">
                  Instagram
                </a>
              </li>
              <li>
                <a href="https://twitter.com/axispreicfes" className="hover:text-blue-400 transition-colors">
                  X (Twitter)
                </a>
              </li>
              <li>
                <a href="https://youtube.com/@axispreicfes" className="hover:text-blue-400 transition-colors">
                  YouTube
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 pt-8">
          <p className="text-sm text-center text-gray-400">
            © {currentYear} AXIS Pre-ICFES. Todos los derechos reservados. Plataforma dedicada a la preparación para las Pruebas de Estado ICFES en Colombia.
          </p>
        </div>
      </div>
    </footer>
  );
}
