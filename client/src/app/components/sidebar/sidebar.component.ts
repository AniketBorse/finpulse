import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside 
      [ngClass]="{
        'w-64': !isCollapsed,
        'w-20': isCollapsed
      }"
      class="bg-deep-slate border-r border-dark-border flex flex-col justify-between transition-all duration-300 ease-in-out shrink-0 select-none">
      
      <div class="p-3 space-y-6">
        <div>
          <span *ngIf="!isCollapsed" class="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold px-3 mb-2 block">
            Core Platform
          </span>
          <nav class="space-y-1">
            <a 
              *ngFor="let item of navItems"
              [routerLink]="item.path"
              routerLinkActive="bg-dark-slate text-stitch-emerald border-dark-border font-semibold shadow-sm"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-dark-slate/60 border border-transparent transition-all group">
              <span class="w-5 h-5 shrink-0 flex items-center justify-center text-slate-400 group-hover:text-stitch-emerald transition-colors" [innerHTML]="item.icon"></span>
              <span *ngIf="!isCollapsed" class="truncate">{{ item.label }}</span>
              <span 
                *ngIf="!isCollapsed && item.badge" 
                class="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-dark-slate border border-dark-border text-slate-400">
                {{ item.badge }}
              </span>
            </a>
          </nav>
        </div>
      </div>

      <!-- Bottom Runway Pill Widget -->
      <div class="p-3 border-t border-dark-border/60">
        <div *ngIf="!isCollapsed" class="p-3 rounded-lg bg-dark-slate/90 border border-dark-border space-y-2 shadow-card">
          <div class="flex items-center justify-between text-xs font-mono">
            <span class="text-slate-400">Cash Runway</span>
            <span class="px-1.5 py-0.5 rounded bg-stitch-emerald/15 text-stitch-emerald border border-stitch-emerald/30 text-[10px] font-bold">
              Healthy
            </span>
          </div>
          <div class="flex items-baseline justify-between font-mono">
            <span class="text-base font-bold text-white tracking-tight">18.4 <span class="text-xs font-normal text-slate-400">Mo</span></span>
            <span class="text-[10px] text-slate-400">{{ api.currencySymbol() }}5.2M Reserves</span>
          </div>
          <div class="w-full bg-deep-slate rounded-full h-1.5 overflow-hidden">
            <div class="bg-stitch-emerald h-1.5 rounded-full" style="width: 76%"></div>
          </div>
        </div>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  api = inject(ApiService);
  @Input() isCollapsed = false;

  navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      badge: 'Live',
      icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>`
    },
    {
      label: 'Monthly Input',
      path: '/monthly-input',
      badge: 'Wizard',
      icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>`
    },
    {
      label: 'Expense Ledger',
      path: '/ledger',
      badge: '12 Mo',
      icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`
    },
    {
      label: 'Forecasting',
      path: '/forecasting',
      badge: 'Sandbox',
      icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>`
    },
    {
      label: 'Reports & Export',
      path: '/reports',
      icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`
    },
    {
      label: 'Settings',
      path: '/settings',
      icon: `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`
    }
  ];
}
