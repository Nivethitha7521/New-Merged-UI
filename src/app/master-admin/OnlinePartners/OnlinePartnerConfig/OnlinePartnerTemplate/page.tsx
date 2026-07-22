









"use client";
import React from 'react';
import OnlinePartnerTemplateComponent from '../OnlinePartnerTemplate/Modules/OnlinePartnerTemplateComponent';

// Next.js App Router page component - can only receive params and searchParams
export default function OnlinePartnerTemplatePage() {
  return (
    <OnlinePartnerTemplateComponent
      selectedType="template"
      partnerName="OnlinePartner Template"
    />
  );
}