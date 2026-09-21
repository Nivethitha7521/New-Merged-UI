import React from 'react';

/**
 * A colorful, friendly magnifying-glass icon for the search trigger button —
 * an original two-tone illustration (purple glass, warm coral handle) in the
 * same spirit as the reference icon, sized to stay crisp at ~20px in the navbar.
 */
const SearchIconColorful: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10.5" cy="10.5" r="6.25" fill="#EFF4FF" stroke="#7A5CFA" strokeWidth="1.8" />
    <circle cx="10.5" cy="10.5" r="3.4" fill="#C9DBFF" fillOpacity="0.6" />
    <path
      d="M15.2 15.2L20 20"
      stroke="#FF8A5B"
      strokeWidth="2.4"
      strokeLinecap="round"
    />
  </svg>
);

export default SearchIconColorful;
