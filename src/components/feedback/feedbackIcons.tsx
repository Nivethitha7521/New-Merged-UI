import React from 'react';

/** Self-contained stroke icons — no dependency on icon fonts or MUI CSS. */
const Svg: React.FC<{ size?: number; children: React.ReactNode }> = ({ size = 22, children }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    {children}
  </svg>
);

export const InfoIcon: React.FC<{ size?: number }> = ({ size }) => (
  <Svg size={size}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5" />
    <path d="M12 8h.01" />
  </Svg>
);

export const WarningIcon: React.FC<{ size?: number }> = ({ size }) => (
  <Svg size={size}>
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
    <path d="M12 9v4" />
    <path d="M12 17h.01" />
  </Svg>
);

export const SuccessIcon: React.FC<{ size?: number }> = ({ size }) => (
  <Svg size={size}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12.5 2.5 2.5 4.5-5" />
  </Svg>
);

export const ErrorIcon: React.FC<{ size?: number }> = ({ size }) => (
  <Svg size={size}>
    <circle cx="12" cy="12" r="9" />
    <path d="m9 9 6 6" />
    <path d="m15 9-6 6" />
  </Svg>
);

export const CloseIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <Svg size={size}>
    <path d="M6 6l12 12" />
    <path d="M18 6 6 18" />
  </Svg>
);
