export function AreaIcon({ icon, color }: { icon: "math" | "lectura" | "ciencias" | "sociales" | "ingles"; color: string }) {
  switch (icon) {
    case "math":
      return (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color }}>
          {/* Símbolos matemáticos: + - * / */}
          <text x="2" y="16" fontSize="18" fontWeight="bold" fill="currentColor">+</text>
          <text x="10" y="16" fontSize="18" fontWeight="bold" fill="currentColor">−</text>
          <text x="18" y="16" fontSize="18" fontWeight="bold" fill="currentColor">×</text>
          <text x="26" y="16" fontSize="18" fontWeight="bold" fill="currentColor">÷</text>
        </svg>
      );
    case "lectura":
      return (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color }}>
          {/* Libro abierto */}
          <path d="M12 2C10.9 2 10 2.9 10 4V20C10 21.1 10.9 22 12 22C13.1 22 14 21.1 14 20V4C14 2.9 13.1 2 12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M8 5C8 3.9 7.1 3 6 3C4.9 3 4 3.9 4 5V19C4 20.1 4.9 21 6 21C7.1 21 8 20.1 8 19V5Z" fill="currentColor" opacity="0.3"/>
          <path d="M16 5C16 3.9 16.9 3 18 3C19.1 3 20 3.9 20 5V19C20 20.1 19.1 21 18 21C16.9 21 16 20.1 16 19V5Z" fill="currentColor" opacity="0.3"/>
          <path d="M8 8H16M8 12H16M8 16H14" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
        </svg>
      );
    case "ciencias":
      return (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color }}>
          {/* Hoja */}
          <path d="M7 2C5.9 2 5 2.9 5 4V18C5 19.66 6.34 21 8 21H18C18.55 21 19 20.55 19 20V5C19 3.9 18.1 3 17 3H8C6.9 3 6 3.9 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M7 2L12 2L17 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
          <path d="M10 7H14M10 11H16M10 15H14" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
        </svg>
      );
    case "sociales":
      return (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color }}>
          {/* Globo terráqueo */}
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M12 2C12 2 8 6 8 12C8 15 10 18 12 21" stroke="currentColor" strokeWidth="1.5" fill="currentColor" opacity="0.3"/>
          <path d="M12 2C12 2 16 6 16 12C16 15 14 18 12 21" stroke="currentColor" strokeWidth="1.5" fill="currentColor" opacity="0.5"/>
          <ellipse cx="12" cy="12" rx="10" ry="4" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
          <path d="M2 12H22" stroke="currentColor" strokeWidth="1" opacity="0.5"/>
        </svg>
      );
    case "ingles":
      return (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color }}>
          {/* Mundo/Globo */}
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M2 12C2 12 5 8 12 8C19 8 22 12 22 12C22 12 19 16 12 16C5 16 2 12 2 12Z" fill="currentColor" opacity="0.2"/>
          <path d="M5 7C7 5 10 4 12 4C14 4 17 5 19 7" stroke="currentColor" strokeWidth="1"/>
          <path d="M5 17C7 19 10 20 12 20C14 20 17 19 19 17" stroke="currentColor" strokeWidth="1"/>
          <circle cx="12" cy="12" r="2" fill="currentColor"/>
        </svg>
      );
    default:
      return null;
  }
}
