









"use client";
import React from 'react';
import OnlinePartnerTemplateComponent from '../OnlinePartnerTemplate/Modules/OnlinePartnerTemplateComponent';
import ModuleVisibilityGuard from '@/components/Permissions/ModuleVisibilityGuard';
// Next.js App Router page component - can only receive params and searchParams
export default function OnlinePartnerTemplatePage() {
  return (
<ModuleVisibilityGuard app="masteradmin" module="onlinepartnertemplate">
      <OnlinePartnerTemplateComponent
        selectedType="template"
        partnerName="OnlinePartner Template"
      />
    </ModuleVisibilityGuard>
  );
}