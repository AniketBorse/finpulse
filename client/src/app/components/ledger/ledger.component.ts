import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, MonthlyFinancialRecord } from '../../services/api.service';

@Component({
  selector: 'app-ledger',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ledger.component.html'
})
export class LedgerComponent implements OnInit {
  api = inject(ApiService);

  records = signal<MonthlyFinancialRecord[]>([]);
  loading = signal<boolean>(true);
  searchQuery = signal<string>('');
  statusFilter = signal<string>('all');
  sortColumn = signal<string>('period');
  sortAsc = signal<boolean>(false);

  currentPage = signal<number>(1);
  pageSize = signal<number>(10);
  totalRecords = signal<number>(0);

  editingRecord = signal<MonthlyFinancialRecord | null>(null);
  editForm = {
    period: '',
    revenue: 0,
    payroll: 0,
    procurement_goods: 0,
    capex_investments: 0,
    overhead: 0,
    notes: ''
  };

  filteredRecords = computed(() => {
    let list = [...this.records()];
    const query = this.searchQuery().toLowerCase().trim();
    if (query) {
      list = list.filter((r) =>
        r.period.toLowerCase().includes(query) ||
        (r.notes && r.notes.toLowerCase().includes(query)) ||
        r.revenue.toString().includes(query)
      );
    }

    const filter = this.statusFilter();
    if (filter === 'profitable') {
      list = list.filter((r) => Number(r.net_profit) > 0);
    } else if (filter === 'deficit') {
      list = list.filter((r) => Number(r.net_profit) < 0);
    }

    const col = this.sortColumn();
    const asc = this.sortAsc();
    list.sort((a: any, b: any) => {
      let valA = a[col];
      let valB = b[col];
      if (typeof valA === 'string' && !isNaN(Number(valA))) {
        valA = Number(valA);
        valB = Number(valB);
      }
      if (valA < valB) return asc ? -1 : 1;
      if (valA > valB) return asc ? 1 : -1;
      return 0;
    });

    return list;
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);
    this.api.getLedger(this.currentPage(), 50).subscribe({
      next: (res) => {
        if (res.data) {
          this.records.set(res.data);
          this.totalRecords.set(res.total || res.data.length);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  setSort(col: string) {
    if (this.sortColumn() === col) {
      this.sortAsc.set(!this.sortAsc());
    } else {
      this.sortColumn.set(col);
      this.sortAsc.set(true);
    }
  }

  openEditModal(record: MonthlyFinancialRecord) {
    this.editingRecord.set(record);
    this.editForm = {
      period: record.period,
      revenue: Number(record.revenue),
      payroll: Number(record.payroll),
      procurement_goods: Number(record.procurement_goods),
      capex_investments: Number(record.capex_investments),
      overhead: Number(record.overhead),
      notes: record.notes || ''
    };
  }

  closeEditModal() {
    this.editingRecord.set(null);
  }

  saveEdit() {
    const period = this.editForm.period;
    this.api
      .saveMonthlyRecord({
        period,
        revenue: this.editForm.revenue,
        payroll: this.editForm.payroll,
        procurement_goods: this.editForm.procurement_goods,
        capex_investments: this.editForm.capex_investments,
        overhead: this.editForm.overhead,
        notes: this.editForm.notes
      })
      .subscribe({
        next: () => {
          this.closeEditModal();
          this.loadData();
          this.api.refreshSummary();
        }
      });
  }

  deleteRecord(period: string) {
    if (confirm(`Are you sure you want to delete the record for ${period}?`)) {
      this.api.deleteRecord(period).subscribe({
        next: () => {
          this.loadData();
          this.api.refreshSummary();
        }
      });
    }
  }

  asNumber(val: any): number {
    return Number(val) || 0;
  }
}
