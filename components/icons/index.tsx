// components/icons/index.tsx
// Icon wrapper component - todos los iconos usan este wrapper
export interface IconProps {
  width?: number;
  height?: number;
  className?: string;
  fill?: string;
  stroke?: string;
}

export function IconWrapper({
  children,
  width = 24,
  height = 24,
  className = "",
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {children}
    </svg>
  );
}

// Logo AXIS
export function LogoAxis({ width = 40, height = 40, className = "" }: IconProps) {
  return (
    <img
      src="/images/logo.png"
      alt="AXIS Logo"
      width={width}
      height={height}
      className={className}
      style={{ display: "block" }}
    />
  );
}

// Simulacro Icon
export function IconSimulacro({ width = 24, height = 24, className = "" }: IconProps) {
  return (
    <IconWrapper width={width} height={height} className={className}>
      <path
        d="M9 5H3C2.44772 5 2 5.44772 2 6V18C2 18.5523 2.44772 19 3 19H9M9 5V19M9 5H21C21.5523 5 22 5.44772 22 6V18C22 18.5523 21.5523 19 21 19H9M5 9H7M5 13H7M5 17H7M12 9H19M12 13H19M12 17H19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconWrapper>
  );
}

// Analytics/Stats Icon
export function IconStats({ width = 24, height = 24, className = "" }: IconProps) {
  return (
    <IconWrapper width={width} height={height} className={className}>
      <path
        d="M3 13H5V21H3V13ZM7 9H9V21H7V9ZM11 5H13V21H11V5ZM15 8H17V21H15V8ZM19 3H21V21H19V3Z"
        fill="currentColor"
      />
    </IconWrapper>
  );
}

// Trophy/Ranking Icon
export function IconRanking({ width = 24, height = 24, className = "" }: IconProps) {
  return (
    <IconWrapper width={width} height={height} className={className}>
      <path
        d="M6 9C6 7.89543 6.89543 7 8 7H16C17.1046 7 18 7.89543 18 9V10C18 11.1046 17.1046 12 16 12H8C6.89543 12 6 11.1046 6 10V9Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M8 12V15C8 16.1046 8.89543 17 10 17H14C15.1046 17 16 16.1046 16 15V12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9 17V20C9 20.5523 9.44772 21 10 21H14C14.5523 21 15 20.5523 15 20V17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="9" r="1.5" fill="currentColor" />
    </IconWrapper>
  );
}

// Book/Material Icon
export function IconMaterial({ width = 24, height = 24, className = "" }: IconProps) {
  return (
    <IconWrapper width={width} height={height} className={className}>
      <path
        d="M4 4C4 2.89543 4.89543 2 6 2H18C19.1046 2 20 2.89543 20 4V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V4Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M8 6H16M8 10H16M8 14H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </IconWrapper>
  );
}

// Message/Communication Icon
export function IconMessage({ width = 24, height = 24, className = "" }: IconProps) {
  return (
    <IconWrapper width={width} height={height} className={className}>
      <path
        d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M6 10H18M6 14H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </IconWrapper>
  );
}

// Chart/Progress Icon
export function IconProgress({ width = 24, height = 24, className = "" }: IconProps) {
  return (
    <IconWrapper width={width} height={height} className={className}>
      <path
        d="M2 12C2 6.48 6.48 2 12 2C17.52 2 22 6.48 22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M12 6V12L16.5 14.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconWrapper>
  );
}

// Checkmark Icon
export function IconCheck({ width = 24, height = 24, className = "" }: IconProps) {
  return (
    <IconWrapper width={width} height={height} className={className}>
      <path
        d="M20 6L9 17L4 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconWrapper>
  );
}

// Star Icon
export function IconStar({ width = 24, height = 24, className = "" }: IconProps) {
  return (
    <IconWrapper width={width} height={height} className={className}>
      <path
        d="M12 2L15.09 8.26H22L17.09 13.16L19.18 19.42L12 15.77L4.82 19.42L6.91 13.16L2 8.26H8.91L12 2Z"
        fill="currentColor"
      />
    </IconWrapper>
  );
}

// Users Icon
export function IconUsers({ width = 24, height = 24, className = "" }: IconProps) {
  return (
    <IconWrapper width={width} height={height} className={className}>
      <path
        d="M16 11C17.66 11 18.99 9.66 18.99 8C18.99 6.34 17.66 5 16 5C14.34 5 13 6.34 13 8C13 9.66 14.34 11 16 11ZM8 11C9.66 11 10.99 9.66 10.99 8C10.99 6.34 9.66 5 8 5C6.34 5 5 6.34 5 8C5 9.66 6.34 11 8 11ZM8 13C6 13 2 14 2 16V18H14V16C14 14 10 13 8 13ZM16 13C15.71 13 15.38 13.02 15.03 13.05C16.19 14.89 17 17.04 17 19.23V22H22V20C22 15.58 19.79 13.64 16 13Z"
        fill="currentColor"
      />
    </IconWrapper>
  );
}

// Clock Icon
export function IconClock({ width = 24, height = 24, className = "" }: IconProps) {
  return (
    <IconWrapper width={width} height={height} className={className}>
      <path
        d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM12.5 6H11V13L17.25 16.15L18 14.92L12.5 11.3V6Z"
        fill="currentColor"
      />
    </IconWrapper>
  );
}

// Area Icons - Matemáticas
export function IconMatematicas({ width = 24, height = 24, className = "" }: IconProps) {
  return (
    <IconWrapper width={width} height={height} className={className}>
      <path
        d="M7 2H17C18.1046 2 19 2.89543 19 4V20C19 21.1046 18.1046 22 17 22H7C5.89543 22 5 21.1046 5 20V4C5 2.89543 5.89543 2 7 2Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M8 8H16M8 12H16M8 16H12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M13 11V13M12 12H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </IconWrapper>
  );
}

// Area Icons - Lectura
export function IconLectura({ width = 24, height = 24, className = "" }: IconProps) {
  return (
    <IconWrapper width={width} height={height} className={className}>
      <path
        d="M20 3H4C2.9 3 2 3.9 2 5V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V5C22 3.9 21.1 3 20 3ZM12 11H8V13H12V11ZM16 18H4V16H16V18ZM16 14H4V12H16V14ZM16 10H4V8H16V10Z"
        fill="currentColor"
      />
    </IconWrapper>
  );
}

// Area Icons - Ciencias
export function IconCiencias({ width = 24, height = 24, className = "" }: IconProps) {
  return (
    <IconWrapper width={width} height={height} className={className}>
      <path
        d="M9 2C7.9 2 7 2.9 7 4C7 5.1 7.9 6 9 6C10.1 6 11 5.1 11 4C11 2.9 10.1 2 9 2ZM9 11C7.34 11 6 12.34 6 14C6 15.66 7.34 17 9 17C10.66 17 12 15.66 12 14C12 12.34 10.66 11 9 11ZM9 22C7.34 22 6 20.66 6 19C6 17.34 7.34 16 9 16C10.66 16 12 17.34 12 19C12 20.66 10.66 22 9 22Z"
        fill="currentColor"
      />
      <path
        d="M15 2C14.45 2 14 2.45 14 3C14 3.55 14.45 4 15 4H19V3C19 2.45 19.45 2 20 2C20.55 2 21 2.45 21 3V21C21 21.55 20.55 22 20 22C19.45 22 19 21.55 19 21V20H15C14.45 20 14 20.45 14 21C14 21.55 14.45 22 15 22H19C20.1 22 21 21.1 21 20V4C21 2.9 20.1 2 19 2H15Z"
        fill="currentColor"
      />
    </IconWrapper>
  );
}

// Area Icons - Sociales
export function IconSociales({ width = 24, height = 24, className = "" }: IconProps) {
  return (
    <IconWrapper width={width} height={height} className={className}>
      <path
        d="M11.99 2C6.47 2 2 6.48 2 12C2 17.52 6.47 22 11.99 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 11.99 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20Z"
        fill="currentColor"
      />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <path d="M8 9L12 12L16 9M8 15L12 12L16 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </IconWrapper>
  );
}

// Area Icons - Inglés
export function IconIngles({ width = 24, height = 24, className = "" }: IconProps) {
  return (
    <IconWrapper width={width} height={height} className={className}>
      <path
        d="M2 4C2 2.9 2.9 2 4 2H20C21.1 2 22 2.9 22 4V20C22 21.1 21.1 22 20 22H4C2.9 22 2 21.1 2 20V4Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M2 7H22M2 17H22" stroke="currentColor" strokeWidth="1" />
      <path d="M12 2V22" stroke="currentColor" strokeWidth="1" opacity="0.5" />
    </IconWrapper>
  );
}

// Download Icon
export function IconDownload({ width = 24, height = 24, className = "" }: IconProps) {
  return (
    <IconWrapper width={width} height={height} className={className}>
      <path
        d="M19 13H17V7H7V13H5L12 20L19 13Z"
        fill="currentColor"
      />
      <path d="M5 21H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </IconWrapper>
  );
}

// Edit Icon
export function IconEdit({ width = 24, height = 24, className = "" }: IconProps) {
  return (
    <IconWrapper width={width} height={height} className={className}>
      <path
        d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25Z"
        fill="currentColor"
      />
      <path
        d="M20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.12 5.12L18.87 8.87L20.71 7.04Z"
        fill="currentColor"
      />
    </IconWrapper>
  );
}

// Menu Icon
export function IconMenu({ width = 24, height = 24, className = "" }: IconProps) {
  return (
    <IconWrapper width={width} height={height} className={className}>
      <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </IconWrapper>
  );
}

// Arrow Right Icon
export function IconArrowRight({ width = 24, height = 24, className = "" }: IconProps) {
  return (
    <IconWrapper width={width} height={height} className={className}>
      <path
        d="M5 12H19M19 12L12 5M19 12L12 19"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconWrapper>
  );
}

// Close Icon
export function IconClose({ width = 24, height = 24, className = "" }: IconProps) {
  return (
    <IconWrapper width={width} height={height} className={className}>
      <path
        d="M18 6L6 18M6 6L18 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconWrapper>
  );
}

// Chevron Down Icon
export function IconChevronDown({ width = 24, height = 24, className = "" }: IconProps) {
  return (
    <IconWrapper width={width} height={height} className={className}>
      <path
        d="M6 9L12 15L18 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconWrapper>
  );
}
