import type { ComponentType } from "react";
import { BusinessScreen } from "@/components/business/BusinessScreen";
import { SalesScreen } from "@/components/business/SalesScreen";
import { CampaignDetailScreen, CampaignsScreen } from "@/components/campaigns/CampaignsScreen";
import { WhatIfScreen } from "@/components/campaigns/WhatIfScreen";
import { CashflowScreen } from "@/components/cashflow/CashflowScreen";
import { CatalogScreen } from "@/components/catalog/CatalogScreen";
import { CreditScreen } from "@/components/credit/CreditScreen";
import { CustomerDetailScreen, CustomersScreen } from "@/components/customers/CustomersScreen";
import { DocumentsScreen } from "@/components/documents/DocumentsScreen";
import { HistoryScreen } from "@/components/history/HistoryScreen";
import { HomeScreen } from "@/components/home/HomeScreen";
import { InsightsScreen } from "@/components/insights/InsightsScreen";
import { InventoryScreen } from "@/components/inventory/InventoryScreen";
import { BeneficiaryScreen } from "@/components/safety/BeneficiaryScreen";
import { QrScreen } from "@/components/safety/QrScreen";
import { SettingsScreen } from "@/components/settings/SettingsScreen";
import { UdhaarScreen } from "@/components/udhaar/UdhaarScreen";
import type { ScreenName } from "@/lib/store/types";

export const SCREENS: Record<Exclude<ScreenName, "galla">, ComponentType> = {
  home: HomeScreen,
  business: BusinessScreen,
  sales: SalesScreen,
  customers: CustomersScreen,
  customer: CustomerDetailScreen,
  inventory: InventoryScreen,
  cashflow: CashflowScreen,
  campaigns: CampaignsScreen,
  campaign: CampaignDetailScreen,
  whatif: WhatIfScreen,
  insights: InsightsScreen,
  qr: QrScreen,
  beneficiary: BeneficiaryScreen,
  credit: CreditScreen,
  udhaar: UdhaarScreen,
  documents: DocumentsScreen,
  catalog: CatalogScreen,
  history: HistoryScreen,
  settings: SettingsScreen,
};
