import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { CommandPaletteComponent } from './components/command-palette/command-palette.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NavbarComponent,
    SidebarComponent,
    CommandPaletteComponent,
  ],
  template: `
    <div class="min-h-screen bg-deep-slate text-slate-100 flex flex-col">
      <app-navbar 
        (toggleSidebar)="sidebarCollapsed = !sidebarCollapsed"
        (openCommandPalette)="showCommandPalette = true">
      </app-navbar>

      <div class="flex-1 flex overflow-hidden">
        <app-sidebar [isCollapsed]="sidebarCollapsed"></app-sidebar>

        <main class="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-deep-slate">
          <router-outlet></router-outlet>
        </main>
      </div>

      <app-command-palette 
        *ngIf="showCommandPalette"
        (close)="showCommandPalette = false">
      </app-command-palette>
    </div>
  `
})
export class AppComponent {
  sidebarCollapsed = false;
  showCommandPalette = false;

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.showCommandPalette = !this.showCommandPalette;
    }
  }
}
