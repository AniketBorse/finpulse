import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, SupportedCurrency } from '../../services/api.service';

interface AuditLog {
  id: string;
  action: string;
  user_email: string;
  details: string;
  ip_address: string;
  created_at: string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html'
})
export class SettingsComponent implements OnInit {
  api = inject(ApiService);

  orgName = signal<string>('FinPulse Global Technologies Inc.');
  fiscalYearStart = signal<string>('April (India Standard FY)');
  currency = signal<SupportedCurrency>('INR');
  currentRole = signal<'ADMIN' | 'VIEWER'>('ADMIN');
  savedMessage = signal<string>('');

  auditLogs = signal<AuditLog[]>([
    {
      id: 'log-1',
      action: 'SYSTEM_BOOT',
      user_email: 'admin@finpulse.io',
      details: 'Started FinPulse Enterprise Server on port 5000',
      ip_address: '127.0.0.1',
      created_at: '2026-10-29 08:18:44'
    },
    {
      id: 'log-2',
      action: 'CURRENCY_SWITCH',
      user_email: 'admin@finpulse.io',
      details: 'Default reporting set to Indian Rupee (INR - ₹)',
      ip_address: '127.0.0.1',
      created_at: '2026-10-29 08:14:10'
    },
    {
      id: 'log-3',
      action: 'RECONCILIATION_SYNC',
      user_email: 'admin@finpulse.io',
      details: '13 Monthly records validated against MySQL 8.0 schema',
      ip_address: '127.0.0.1',
      created_at: '2026-10-29 08:08:37'
    }
  ]);

  ngOnInit() {
    this.currency.set(this.api.currentCurrency());
  }

  onCurrencyChange(c: SupportedCurrency) {
    this.currency.set(c);
    this.api.setCurrency(c);
    this.showMessage('Default reporting currency updated to ' + c);
  }

  toggleRole(role: 'ADMIN' | 'VIEWER') {
    this.currentRole.set(role);
    this.showMessage('Active RBAC simulation toggled to ' + role);
  }

  saveSettings() {
    this.showMessage('Organization profile successfully saved.');
  }

  private showMessage(msg: string) {
    this.savedMessage.set(msg);
    setTimeout(() => this.savedMessage.set(''), 3000);
  }
}
