import React from 'react';

export function HomeIcon({ className = '', width = 22, height = 22, color = 'currentColor' }) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 10.5L12 4l9 6.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 21V11h14v10" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function PlusIcon({ className = '', width = 28, height = 28, color = 'currentColor' }) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="11" stroke={color} strokeWidth="1.2" opacity="0.18" />
      <path d="M12 7v10M7 12h10" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function UserIcon({ className = '', width = 20, height = 20, color = 'currentColor' }) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="8" r="3" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function SearchIcon({ className = '', width = 18, height = 18, color = 'currentColor' }){
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="11" cy="11" r="6" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M21 21l-4.35-4.35" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function HeartIcon({ className = "", width = 18, height = 18, stroke = "currentColor" }) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 20.5s-6.5-4.35-8.5-8.24C1.78 8.9 3.1 5.5 6.6 5.5c2.02 0 3.25 1.16 3.99 2.28C11.33 6.66 12.56 5.5 14.58 5.5c3.5 0 4.82 3.4 3.1 6.76C18.5 16.15 12 20.5 12 20.5Z"
        stroke={stroke}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BookmarkIcon({ className = "", width = 18, height = 18, stroke = "currentColor" }) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M7 5.5h10a1.5 1.5 0 0 1 1.5 1.5V20l-6.5-3.8L5.5 20V7A1.5 1.5 0 0 1 7 5.5Z"
        stroke={stroke}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BuildingIcon({ className = "", width = 18, height = 18, stroke = "currentColor" }) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 20V6.5C4 5.67 4.67 5 5.5 5H14.5C15.33 5 16 5.67 16 6.5V20" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M8 9H12M8 12.5H12M8 16H12M16 9H18.5C19.33 9 20 9.67 20 10.5V20M10 20V17.5" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function EditIcon({ className = "", width = 18, height = 18, stroke = "currentColor" }) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 20h4l9.8-9.8a1.8 1.8 0 0 0 0-2.54l-1.46-1.46a1.8 1.8 0 0 0-2.54 0L4 16v4Z" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12.5 7.5 16.5 11.5" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function TrashIcon({ className = "", width = 18, height = 18, stroke = "currentColor" }) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 7h14M9 7V5.8C9 5.36 9.36 5 9.8 5h4.4c.44 0 .8.36.8.8V7M8 10v6M12 10v6M16 10v6M6 7l.8 11.2c.06.92.82 1.64 1.74 1.64h6.92c.92 0 1.68-.72 1.74-1.64L18 7" stroke={stroke} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
