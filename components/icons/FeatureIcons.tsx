// components/icons/FeatureIcons.tsx
export function FeatureIcon({ type }: { type: string }) {
  switch (type) {
    case "simulacros":
      return (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 5H3C2.44772 5 2 5.44772 2 6V18C2 18.5523 2.44772 19 3 19H9M9 5V19M9 5H21C21.5523 5 22 5.44772 22 6V18C22 18.5523 21.5523 19 21 19H9M5 9H7M5 13H7M5 17H7M12 9H19M12 13H19M12 17H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "analytics":
      return (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 13H5V21H3V13ZM7 9H9V21H7V9ZM11 5H13V21H11V5ZM15 8H17V21H15V8ZM19 3H21V21H19V3Z" fill="currentColor" />
        </svg>
      );
    case "questions":
      return (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM13 17H11V15H13V17ZM13 13H11C11 10.5 13 9.5 13 8C13 6.58 11.9 5.5 10.5 5.5C9.1 5.5 8 6.58 8 8H6C6 5.46 8.46 3 10.5 3C12.54 3 15 5.46 15 8C15 9.5 13 10.5 13 13Z" fill="currentColor" />
        </svg>
      );
    case "results":
      return (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5.5 12.5L6.91 11.09L10 14.17L17.09 7.09L18.5 8.5L10 17Z" fill="currentColor" />
        </svg>
      );
    case "plan":
      return (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11.99 2C6.47 2 2 6.48 2 12C2 17.52 6.47 22 11.99 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 11.99 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20ZM17 11H13V7H11V13H17V11Z" fill="currentColor" />
        </svg>
      );
    case "ranking":
      return (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 9C6 7.89543 6.89543 7 8 7H16C17.1046 7 18 7.89543 18 9V10C18 11.1046 17.1046 12 16 12H8C6.89543 12 6 11.1046 6 10V9Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M8 12V15C8 16.1046 8.89543 17 10 17H14C15.1046 17 16 16.1046 16 15V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M9 17V20C9 20.5523 9.44772 21 10 21H14C14.5523 21 15 20.5523 15 20V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "book":
      return (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M4 4C4 2.89543 4.89543 2 6 2H18C19.1046 2 20 2.89543 20 4V20C20 21.1046 19.1046 22 18 22H6C4.89543 22 4 21.1046 4 20V4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M8 6H16M8 10H16M8 14H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "message":
      return (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 10H18M6 14H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "progress":
      return (
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 12C2 6.48 6.48 2 12 2C17.52 2 22 6.48 22 12C22 17.52 17.52 22 12 22C6.48 22 2 17.52 2 12Z" stroke="currentColor" strokeWidth="2" />
          <path d="M12 6V12L16.5 14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}
