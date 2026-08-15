'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const YenPosPage = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace('/yen-pos/CashManagement/OpeningCash');
  }, [router]);
  return null;
};

export default YenPosPage;