import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { MonthlyInputComponent } from './components/monthly-input/monthly-input.component';
import { LedgerComponent } from './components/ledger/ledger.component';
import { ForecastingComponent } from './components/forecasting/forecasting.component';
import { ReportsComponent } from './components/reports/reports.component';
import { SettingsComponent } from './components/settings/settings.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'monthly-input', component: MonthlyInputComponent },
  { path: 'ledger', component: LedgerComponent },
  { path: 'forecasting', component: ForecastingComponent },
  { path: 'reports', component: ReportsComponent },
  { path: 'settings', component: SettingsComponent },
  { path: '**', redirectTo: 'dashboard' },
];
