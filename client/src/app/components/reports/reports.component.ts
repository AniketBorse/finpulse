import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.component.html'
})
export class ReportsComponent implements OnInit {
  api = inject(ApiService);

  summary = computed(() => this.api.summaryData());

  arr = computed(() => {
    const rev = this.summary()?.kpis?.total_revenue || 24500000;
    return rev * 12;
  });

  operatingMargin = computed(() => {
    return this.summary()?.kpis?.operating_margin_pct || 25.1;
  });

  ruleOf40 = computed(() => {
    const revGrowth = 24.2;
    const margin = this.operatingMargin();
    return Number((revGrowth + margin).toFixed(1));
  });

  quickRatio = computed(() => 2.85);

  burnMultiple = computed(() => {
    const netProfit = this.summary()?.kpis?.net_profit || 6150000;
    if (netProfit > 0) return 0.0;
    return 1.2;
  });

  grossMarginPct = computed(() => 78.4);

  ngOnInit() {
    this.api.refreshSummary();
  }
}
