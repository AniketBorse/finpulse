import { Injectable, signal, computed } from '@angular/core';
import { Observable, from } from 'rxjs';

export interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'VIEWER';
  organization_id: string;
  organization_name?: string;
}

export interface KPIStats {
  total_revenue: number;
  revenue_mom_pct: number;
  total_spend: number;
  over_budget_pct: number;
  net_profit: number;
  operating_margin_pct: number;
  cash_runway_months: number;
  runway_status: string;
  cash_reserves: number;
}

export interface TimelinePoint {
  id: string;
  period: string;
  formatted_period: string;
  revenue: number;
  expenses: number;
  profit: number;
  margin: number;
}

export interface CategoryBreakdown {
  payroll: number;
  goods_procurement: number;
  investments_capex: number;
  overhead_misc: number;
  percentages: {
    payroll: number;
    goods_procurement: number;
    investments_capex: number;
    overhead_misc: number;
  };
}

export interface FinancialSummary {
  kpis: KPIStats;
  current_period: string;
  timeline: TimelinePoint[];
  category_distribution: CategoryBreakdown;
  recent_entries: any[];
}

export interface MonthlyRecord {
  id: string;
  period: string;
  revenue: number;
  total_revenue?: number;
  payroll: number;
  payroll_expenses?: number;
  procurement_goods: number;
  goods_procurement?: number;
  capex_investments: number;
  investments_capex?: number;
  overhead: number;
  overhead_misc?: number;
  total_expenses: number;
  net_profit: number;
  operating_margin: number;
  notes?: string;
  status: 'Profitable' | 'Break-even' | 'Deficit';
}

export type MonthlyFinancialRecord = MonthlyRecord;

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP';
export type SupportedCurrency = CurrencyCode;

export interface CurrencyOption {
  code: CurrencyCode;
  symbol: string;
  name: string;
  flag: string;
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
];

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl = 'http://localhost:5000/api/v1';

  readonly currentUser = signal<User | null>({
    id: '41f9968e-df78-4314-abad-451bd8b3074d',
    email: 'admin@finpulse.io',
    role: 'ADMIN',
    organization_id: 'f208ee08-5666-454a-8488-42abec4bcf1e',
    organization_name: 'Apex Global Technologies',
  });

  readonly selectedPeriod = signal<string>('2026-10');
  readonly availablePeriods = signal<string[]>([
    '2026-11', '2026-10', '2026-09', '2026-08', '2026-07', '2026-06',
    '2026-05', '2026-04', '2026-03', '2026-02', '2026-01', '2025-12', '2025-11',
  ]);

  readonly summaryData = signal<FinancialSummary | null>(null);
  readonly ledgerRecords = signal<MonthlyRecord[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  // Multi-Currency State (Indian Rupee ₹ default, USD $, EUR €, GBP £)
  readonly currentCurrency = signal<CurrencyCode>(
    (localStorage.getItem('finpulse_currency') as CurrencyCode) || 'INR'
  );
  readonly supportedCurrencies = SUPPORTED_CURRENCIES;

  readonly currencySymbol = computed(() => {
    const c = this.currentCurrency();
    const found = SUPPORTED_CURRENCIES.find((item) => item.code === c);
    return found ? found.symbol : '₹';
  });

  readonly isAdmin = computed(() => this.currentUser()?.role === 'ADMIN');
  readonly isViewer = computed(() => this.currentUser()?.role === 'VIEWER');

  constructor() {
    this.initAuth();
  }

  formatCurrency(amount: number | string | undefined | null): string {
    if (amount === undefined || amount === null || isNaN(Number(amount))) {
      return `${this.currencySymbol()} 0`;
    }
    const num = Math.round(Number(amount));
    return `${this.currencySymbol()} ${num.toLocaleString()}`;
  }

  getExportUrl(format: 'pdf' | 'csv' | string): string {
    return `${this.baseUrl}/reports/${format}`;
  }

  async setCurrency(code: CurrencyCode, syncWithBackend = true): Promise<void> {
    this.currentCurrency.set(code);
    localStorage.setItem('finpulse_currency', code);
    if (syncWithBackend && this.isAdmin()) {
      try {
        await this.fetchWithAuth(`${this.baseUrl}/organizations/me`, {
          method: 'PUT',
          body: JSON.stringify({ currency_code: code }),
        });
      } catch (err) {
        console.warn('Currency backend sync deferred:', err);
      }
    }
  }

  async initAuth(): Promise<void> {
    try {
      const token = localStorage.getItem('finpulse_token');
      let valid = false;

      if (token) {
        try {
          const check = await fetch(`${this.baseUrl}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (check.ok) {
            const data = await check.json();
            if (data.success && data.data?.user) {
              this.currentUser.set(data.data.user);
              valid = true;
            }
          }
        } catch (_) {}
      }

      if (!valid) {
        await this.performSilentLogin();
      }
    } catch (e) {
      console.warn('Initial auth sync:', e);
    }

    await this.refreshSummary();
    await this.fetchLedger();
  }

  private async performSilentLogin(): Promise<string | null> {
    try {
      const res = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@finpulse.io',
          password: 'FinPulse2026!',
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.token) {
        const token = data.data.token;
        localStorage.setItem('finpulse_token', token);
        this.currentUser.set(data.data.user);
        return token;
      }
    } catch (e) {
      console.error('Silent login failed:', e);
    }
    return null;
  }

  getAuthHeaders(overrideToken?: string): Record<string, string> {
    const token = overrideToken || localStorage.getItem('finpulse_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = {
      ...this.getAuthHeaders(),
      ...((options.headers as Record<string, string>) || {}),
    };

    let res = await fetch(url, { ...options, headers });

    if (res.status === 401) {
      localStorage.removeItem('finpulse_token');
      const freshToken = await this.performSilentLogin();
      if (freshToken) {
        const retryHeaders = {
          ...this.getAuthHeaders(freshToken),
          ...((options.headers as Record<string, string>) || {}),
        };
        res = await fetch(url, { ...options, headers: retryHeaders });
      }
    }

    return res;
  }

  async login(email: string, password: string): Promise<boolean> {
    this.isLoading.set(true);
    try {
      const res = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success && data.data?.user) {
        if (data.data.token) {
          localStorage.setItem('finpulse_token', data.data.token);
        }
        this.currentUser.set(data.data.user);
        await this.refreshSummary();
        await this.fetchLedger();
        return true;
      }
      this.errorMessage.set(data.message || 'Login failed');
      return false;
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Network error');
      return false;
    } finally {
      this.isLoading.set(false);
    }
  }

  async switchRole(role: 'ADMIN' | 'VIEWER'): Promise<void> {
    try {
      const res = await this.fetchWithAuth(`${this.baseUrl}/auth/switch-role`, {
        method: 'POST',
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        if (data.data.token) {
          localStorage.setItem('finpulse_token', data.data.token);
        }
        const curr = this.currentUser();
        if (curr) {
          this.currentUser.set({ ...curr, role });
        }
      }
    } catch (err) {
      const curr = this.currentUser();
      if (curr) {
        this.currentUser.set({ ...curr, role });
      }
    }
  }

  async refreshSummary(period?: string): Promise<void> {
    this.isLoading.set(true);
    const targetPeriod = period || this.selectedPeriod();
    try {
      const res = await this.fetchWithAuth(
        `${this.baseUrl}/finances/summary?period=${targetPeriod}`
      );
      const data = await res.json();
      if (data.success && data.data) {
        this.summaryData.set(data.data);
        if (data.data.timeline && Array.isArray(data.data.timeline)) {
          const periods = Array.from(
            new Set(data.data.timeline.map((t: any) => t.period.substring(0, 7)))
          ).reverse() as string[];
          if (periods.length > 0) {
            this.availablePeriods.set(periods);
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch summary:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  async fetchLedger(
    options: { page?: number; limit?: number; search?: string } = {}
  ): Promise<MonthlyRecord[]> {
    try {
      const params = new URLSearchParams();
      if (options.page) params.set('page', options.page.toString());
      if (options.limit) params.set('limit', options.limit.toString());
      if (options.search) params.set('search', options.search);

      const res = await this.fetchWithAuth(
        `${this.baseUrl}/finances/monthly?${params.toString()}`
      );
      const data = await res.json();
      if (data.success && data.data?.items) {
        const normalized = data.data.items.map((i: any) => ({
          ...i,
          revenue: i.revenue ?? i.total_revenue ?? 0,
          payroll: i.payroll ?? i.payroll_expenses ?? 0,
          procurement_goods: i.procurement_goods ?? i.goods_procurement ?? 0,
          capex_investments: i.capex_investments ?? i.investments_capex ?? 0,
          overhead: i.overhead ?? i.overhead_misc ?? 0,
        }));
        this.ledgerRecords.set(normalized);
        return normalized;
      }
    } catch (err) {
      console.error('Failed to fetch ledger:', err);
    }
    return [];
  }

  getLedger(page = 1, limit = 50): Observable<{ data: MonthlyRecord[]; total: number }> {
    return from(
      this.fetchLedger({ page, limit }).then((items) => ({
        data: items,
        total: items.length,
      }))
    );
  }

  saveMonthlyRecord(entry: {
    period: string;
    revenue: number;
    payroll: number;
    procurement_goods: number;
    capex_investments: number;
    overhead: number;
    notes?: string;
  }): Observable<{ success: boolean; message?: string }> {
    return from(
      this.createMonthly({
        period: entry.period,
        total_revenue: entry.revenue,
        payroll_expenses: entry.payroll,
        goods_procurement: entry.procurement_goods,
        investments_capex: entry.capex_investments,
        overhead_misc: entry.overhead,
        notes: entry.notes,
      })
    );
  }

  deleteRecord(period: string): Observable<{ success: boolean }> {
    return from(
      this.deleteMonthly(period).then((res) => ({ success: res.success }))
    );
  }

  async createMonthly(entry: {
    period: string;
    total_revenue: number;
    payroll_expenses: number;
    goods_procurement: number;
    investments_capex: number;
    overhead_misc: number;
    notes?: string;
  }): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await this.fetchWithAuth(`${this.baseUrl}/finances/monthly`, {
        method: 'POST',
        body: JSON.stringify(entry),
      });
      const data = await res.json();
      if (data.success) {
        await this.refreshSummary();
        await this.fetchLedger();
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async updateMonthly(
    id: string,
    entry: Partial<MonthlyRecord>
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await this.fetchWithAuth(
        `${this.baseUrl}/finances/monthly/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(entry),
        }
      );
      const data = await res.json();
      if (data.success) {
        await this.refreshSummary();
        await this.fetchLedger();
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  async deleteMonthly(
    periodOrId: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await this.fetchWithAuth(
        `${this.baseUrl}/finances/monthly/${periodOrId}`,
        {
          method: 'DELETE',
        }
      );
      const data = await res.json();
      if (data.success) {
        await this.refreshSummary();
        await this.fetchLedger();
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }
}
