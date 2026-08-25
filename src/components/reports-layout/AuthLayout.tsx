'use client';

import React from 'react';

const AuthLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      {children}
    </div>
  );
};

export default AuthLayout;
