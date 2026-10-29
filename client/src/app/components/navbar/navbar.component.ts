import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="h-16 bg-deep-slate border-b border-dark-border px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
      <div class="flex items-center gap-3">
        <button 
          (click)="toggleSidebar.emit()"
          class="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-dark-slate transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>

        <a href="#/dashboard" class="flex items-center gap-2.5 group">
          <div class="w-9 h-9 rounded-lg bg-stitch-emerald/10 border border-stitch-emerald/30 flex items-center justify-center text-stitch-emerald group-hover:bg-stitch-emerald/20 transition-all shadow-glow-emerald">
            <svg class="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <div class="flex flex-col">
            <span class="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              FinPulse
              <span class="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-stitch-emerald/15 text-stitch-emerald border border-stitch-emerald/30 font-semibold">B2B OS</span>
            </span>
            <span class="text-[10px] text-slate-400 font-mono -mt-0.5">Enterprise Finance</span>
          </div>
        </a>
      </div>

      <div class="hidden md:flex flex-1 max-w-md mx-6">
        <button 
          (click)="openCommandPalette.emit()"
          class="w-full h-9 bg-dark-slate/80 hover:bg-dark-slate border border-dark-border hover:border-slate-500 rounded-lg px-3 flex items-center justify-between text-xs text-slate-400 transition-all group shadow-sm">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-slate-400 group-hover:text-slate-200 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <span>Search metrics, reports, ledger entries...</span>
          </div>
          <kbd class="flex items-center gap-0.5 text-[10px] font-mono font-medium bg-deep-slate border border-dark-border text-slate-400 px-1.5 py-0.5 rounded shadow-inner">
            <span class="text-xs">⌘</span>K
          </kbd>
        </button>
      </div>

      <div class="flex items-center gap-3">
        <!-- Currency Dropdown (INR Rupee, USD, EUR, GBP) -->
        <div class="flex items-center gap-1.5 bg-dark-slate border border-dark-border rounded-lg px-2.5 py-1.5 shadow-sm">
          <span class="text-xs font-mono font-bold text-stitch-emerald">{{ api.currencySymbol() }}</span>
          <select 
            [value]="api.currentCurrency()" 
            (change)="onCurrencyChange($event)"
            title="Switch Reporting Currency (Indian Rupee, USD, Euro, Pound)"
            class="bg-transparent text-xs font-mono font-medium text-slate-200 focus:outline-none cursor-pointer">
            <option *ngFor="let c of api.supportedCurrencies" [value]="c.code" class="bg-dark-slate text-slate-200 font-mono">
              {{ c.code }} ({{ c.symbol }})
            </option>
          </select>
        </div>

        <!-- Period Selector Dropdown -->
        <div class="flex items-center gap-2 bg-dark-slate border border-dark-border rounded-lg px-2.5 py-1.5">
          <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <select 
            [value]="api.selectedPeriod()" 
            (change)="onPeriodChange($event)"
            class="bg-transparent text-xs font-mono font-medium text-slate-200 focus:outline-none cursor-pointer">
            <option *ngFor="let p of api.availablePeriods()" [value]="p" class="bg-dark-slate text-slate-200 font-mono">
              {{ formatPeriodLabel(p) }}
            </option>
          </select>
        </div>

        <!-- Live Role Indicator Badge -->
        <button 
          (click)="toggleRole()"
          [title]="'Click to toggle between ADMIN and VIEWER (Current: ' + api.currentUser()?.role + ')'"
          class="hidden sm:flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-lg border transition-all"
          [ngClass]="api.isAdmin() ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20' : 'bg-slate-700/30 border-slate-600 text-slate-300 hover:bg-slate-700/50'">
          <span class="w-1.5 h-1.5 rounded-full" [ngClass]="api.isAdmin() ? 'bg-indigo-400 animate-pulse' : 'bg-slate-400'"></span>
          <span>{{ api.currentUser()?.role }}</span>
        </button>

        <!-- Profile Avatar Menu -->
        <div class="relative group">
          <button 
            (click)="showProfileMenu = !showProfileMenu"
            class="flex items-center gap-2 p-1 rounded-lg hover:bg-dark-slate border border-transparent hover:border-dark-border transition-all">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-stitch-emerald/30 to-indigo-500/30 border border-slate-600 flex items-center justify-center font-bold text-xs text-white">
              {{ getUserInitials() }}
            </div>
            <div class="hidden xl:flex flex-col text-left">
              <span class="text-xs font-medium text-slate-200">{{ api.currentUser()?.email }}</span>
              <span class="text-[10px] text-slate-400">{{ api.currentUser()?.organization_name || 'Apex Global Tech' }}</span>
            </div>
            <svg class="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
          </button>

          <div 
            *ngIf="showProfileMenu"
            (mouseleave)="showProfileMenu = false"
            class="absolute right-0 mt-2 w-56 bg-dark-slate border border-dark-border rounded-lg shadow-2xl py-1 z-50 text-xs">
            <div class="px-3 py-2 border-b border-dark-border">
              <p class="font-medium text-white">{{ api.currentUser()?.email }}</p>
              <p class="text-[10px] text-slate-400 mt-0.5">Org: {{ api.currentUser()?.organization_name }}</p>
              <span class="inline-block mt-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-dark-border text-slate-300">
                Active Role: {{ api.currentUser()?.role }}
              </span>
            </div>

            <button 
              (click)="toggleRole(); showProfileMenu = false"
              class="w-full text-left px-3 py-2 hover:bg-slate-700/50 flex items-center justify-between text-slate-300">
              <span>Switch to {{ api.isAdmin() ? 'VIEWER' : 'ADMIN' }} Mode</span>
              <span class="text-[10px] font-mono text-slate-400">RBAC Demo</span>
            </button>

            <a 
              href="#/settings" 
              (click)="showProfileMenu = false"
              class="w-full text-left px-3 py-2 hover:bg-slate-700/50 flex items-center justify-between text-slate-300">
              <span>Settings & Security</span>
            </a>
          </div>
        </div>
      </div>
    </header>
  `
})
export class NavbarComponent {
  api = inject(ApiService);
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() openCommandPalette = new EventEmitter<void>();

  showProfileMenu = false;

  onCurrencyChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    this.api.setCurrency(target.value as any);
  }

  onPeriodChange(e: Event) {
    const target = e.target as HTMLSelectElement;
    this.api.selectedPeriod.set(target.value);
    this.api.refreshSummary(target.value);
  }

  toggleRole() {
    const nextRole = this.api.isAdmin() ? 'VIEWER' : 'ADMIN';
    this.api.switchRole(nextRole);
  }

  formatPeriodLabel(period: string): string {
    const [year, month] = period.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const idx = parseInt(month, 10) - 1;
    return `${months[idx] || month} ${year}`;
  }

  getUserInitials(): string {
    const email = this.api.currentUser()?.email || 'AD';
    return email.substring(0, 2).toUpperCase();
  }
}
