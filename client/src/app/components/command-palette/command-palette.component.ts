import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-slate-950/70 backdrop-blur-sm p-4">
      <div 
        (click)="$event.stopPropagation()"
        class="w-full max-w-lg bg-dark-slate border border-dark-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        <div class="flex items-center px-4 border-b border-dark-border bg-deep-slate/50">
          <svg class="w-4 h-4 text-slate-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            placeholder="Type a command or jump to page..." 
            class="w-full h-12 bg-transparent text-sm text-white focus:outline-none placeholder:text-slate-500 font-sans"
            autofocus/>
          <kbd class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-dark-slate border border-dark-border text-slate-400">ESC</kbd>
        </div>

        <div class="max-h-72 overflow-y-auto p-2 space-y-1">
          <div *ngFor="let item of filteredCommands" 
            (click)="navigate(item.path)"
            class="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-200 hover:bg-slate-800 hover:text-white cursor-pointer transition-colors group">
            <div class="flex items-center gap-3">
              <span class="text-stitch-emerald">#</span>
              <span>{{ item.title }}</span>
            </div>
            <span class="text-[10px] font-mono text-slate-400 group-hover:text-slate-200">{{ item.shortcut }}</span>
          </div>
        </div>

        <div class="p-2.5 bg-deep-slate border-t border-dark-border flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>Navigate with arrows</span>
          <span>Press ESC to dismiss</span>
        </div>
      </div>
    </div>
  `
})
export class CommandPaletteComponent {
  @Output() close = new EventEmitter<void>();
  searchQuery = '';

  commands = [
    { title: 'Executive Dashboard (KPIs & Trajectory)', path: '/dashboard', shortcut: 'G D' },
    { title: 'Monthly Reconciliation Wizard', path: '/monthly-input', shortcut: 'G M' },
    { title: 'Financial Statement Ledger', path: '/ledger', shortcut: 'G L' },
    { title: 'Runway Forecasting Sandbox', path: '/forecasting', shortcut: 'G F' },
    { title: 'Executive Reports & Statement Exports', path: '/reports', shortcut: 'G R' },
    { title: 'Organization & RBAC Security Settings', path: '/settings', shortcut: 'G S' },
  ];

  constructor(private router: Router) {}

  get filteredCommands() {
    if (!this.searchQuery) return this.commands;
    return this.commands.filter(c => c.title.toLowerCase().includes(this.searchQuery.toLowerCase()));
  }

  navigate(path: string) {
    this.router.navigateByUrl(path);
    this.close.emit();
  }
}
