import { Routes } from '@angular/router';
import { CageManagementComponent } from './cage-management/cage-management.component';
import { MortalityRegistrationComponent } from './mortality-registration/mortality-registration.component';
import { FishStockingComponent } from './fish-stocking/fish-stocking.component';
import { StockBalanceViewComponent } from './stock-balance-view/stock-balance-view.component';
import { FishTransfersComponent } from './fish-transfers/fish-transfers.component';
import { BasicAnalysisComponent } from './basic-analysis/basic-analysis.component';

export const routes: Routes = [
  { path: '', redirectTo: 'cage-management', pathMatch: 'full' },
  { path: 'cage-management', component: CageManagementComponent },
  { path: 'fish-stocking', component: FishStockingComponent },
  { path: 'mortality-registration', component: MortalityRegistrationComponent },
  { path: 'stock-balance-view', component: StockBalanceViewComponent},
  { path: 'basic-analysis', component: BasicAnalysisComponent},
  { path: 'fish-transfers', component: FishTransfersComponent},
];