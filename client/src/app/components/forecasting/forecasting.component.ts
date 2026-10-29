import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  inject,
  signal,
  computed,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  CategoryScale,
  Tooltip,
  Legend,
  Filler
);

interface ScenarioPreset {
  id: string;
  name: string;
  description: string;
  badge: string;
  badgeColor: string;
  revGrowth: number;
  payrollAdj: number;
  capexScale: number;
  overheadInflation: number;
}

@Component({
  selector: 'app-forecasting',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forecasting.component.html'
})
export class ForecastingComponent implements OnInit, AfterViewInit, OnDestroy {
  api = inject(ApiService);

  @ViewChild('forecastChart') forecastChartCanvas!: ElementRef<HTMLCanvasElement>;
  private chart: Chart | null = null;

  // Sliders
  revGrowth = signal<number>(5); // %
  payrollAdj = signal<number>(0); // %
  capexScale = signal<number>(0); // %
  overheadInflation = signal<number>(3); // %

  activePreset = signal<string>('default');

  presets: ScenarioPreset[] = [
    {
      id: 'aggressive',
      name: 'Aggressive Expansion',
      description: 'Accelerated top-line growth with scaled hiring and strategic capex',
      badge: 'High Growth',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      revGrowth: 25,
      payrollAdj: 20,
      capexScale: 50,
      overheadInflation: 5
    },
    {
      id: 'default',
      name: 'Default Trajectory',
      description: 'Organic steady-state baseline based on historical trends',
      badge: 'Baseline',
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      revGrowth: 5,
      payrollAdj: 0,
      capexScale: 0,
      overheadInflation: 3
    },
    {
      id: 'preservation',
      name: 'Cash Preservation',
      description: 'Tight cost discipline, reduced discretionary spend and headcount freeze',
      badge: 'Defensive',
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      revGrowth: 0,
      payrollAdj: -10,
      capexScale: -30,
      overheadInflation: 1
    },
    {
      id: 'stress',
      name: 'Stress Test / Crisis',
      description: 'Severe revenue contraction and inflation shock scenario',
      badge: 'Stress Test',
      badgeColor: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      revGrowth: -15,
      payrollAdj: -5,
      capexScale: -50,
      overheadInflation: 8
    }
  ];

  // Base metrics from latest ledger record
  baseRevenue = signal<number>(24500000);
  basePayroll = signal<number>(9800000);
  baseGoods = signal<number>(4200000);
  baseCapex = signal<number>(1800000);
  baseOverhead = signal<number>(2500000);
  cashReserves = signal<number>(145000000); // 145M INR cash balance

  // Computed projections
  projectedRevenue = computed(() => {
    return this.baseRevenue() * (1 + this.revGrowth() / 100);
  });

  projectedPayroll = computed(() => {
    return this.basePayroll() * (1 + this.payrollAdj() / 100);
  });

  projectedGoods = computed(() => {
    return this.baseGoods() * (1 + (this.revGrowth() * 0.6) / 100);
  });

  projectedCapex = computed(() => {
    return this.baseCapex() * (1 + this.capexScale() / 100);
  });

  projectedOverhead = computed(() => {
    return this.baseOverhead() * (1 + this.overheadInflation() / 100);
  });

  projectedTotalSpend = computed(() => {
    return (
      this.projectedPayroll() +
      this.projectedGoods() +
      this.projectedCapex() +
      this.projectedOverhead()
    );
  });

  projectedNetProfit = computed(() => {
    return this.projectedRevenue() - this.projectedTotalSpend();
  });

  projectedMargin = computed(() => {
    if (this.projectedRevenue() === 0) return 0;
    return (this.projectedNetProfit() / this.projectedRevenue()) * 100;
  });

  projectedRunwayMonths = computed(() => {
    const net = this.projectedNetProfit();
    if (net >= 0) return 999;
    const monthlyBurn = Math.abs(net);
    return Number((this.cashReserves() / monthlyBurn).toFixed(1));
  });

  constructor() {
    effect(() => {
      const sym = this.api.currencySymbol();
      const r = this.revGrowth();
      const p = this.payrollAdj();
      const c = this.capexScale();
      const o = this.overheadInflation();
      this.updateChart();
    });
  }

  ngOnInit() {
    this.api.getLedger(1, 1).subscribe((res) => {
      if (res.data && res.data.length > 0) {
        const latest = res.data[0];
        this.baseRevenue.set(Number(latest.revenue));
        this.basePayroll.set(Number(latest.payroll));
        this.baseGoods.set(Number(latest.procurement_goods));
        this.baseCapex.set(Number(latest.capex_investments));
        this.baseOverhead.set(Number(latest.overhead));
      }
    });
  }

  ngAfterViewInit() {
    this.updateChart();
  }

  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  }

  applyPreset(preset: ScenarioPreset) {
    this.activePreset.set(preset.id);
    this.revGrowth.set(preset.revGrowth);
    this.payrollAdj.set(preset.payrollAdj);
    this.capexScale.set(preset.capexScale);
    this.overheadInflation.set(preset.overheadInflation);
  }

  updateChart() {
    if (!this.forecastChartCanvas) return;
    const ctx = this.forecastChartCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.chart) {
      this.chart.destroy();
    }

    const months = [
      'M+1', 'M+2', 'M+3', 'M+4', 'M+5', 'M+6',
      'M+7', 'M+8', 'M+9', 'M+10', 'M+11', 'M+12'
    ];

    const monthlyRevGrowthRate = Math.pow(1 + this.revGrowth() / 100, 1 / 12) - 1;
    const monthlySpendGrowthRate = Math.pow(1 + (this.payrollAdj() * 0.5 + this.overheadInflation() * 0.3) / 100, 1 / 12) - 1;

    const revPoints: number[] = [];
    const spendPoints: number[] = [];
    const profitPoints: number[] = [];

    let currentRev = this.baseRevenue();
    let currentSpend = this.basePayroll() + this.baseGoods() + this.baseCapex() + this.baseOverhead();

    for (let i = 0; i < 12; i++) {
      currentRev = currentRev * (1 + monthlyRevGrowthRate);
      currentSpend = currentSpend * (1 + monthlySpendGrowthRate);
      revPoints.push(Math.round(currentRev));
      spendPoints.push(Math.round(currentSpend));
      profitPoints.push(Math.round(currentRev - currentSpend));
    }

    const sym = this.api.currencySymbol();

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Projected Revenue',
            data: revPoints,
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            borderWidth: 2.5,
            tension: 0.35,
            fill: true,
            pointBackgroundColor: '#10B981',
            pointRadius: 3
          },
          {
            label: 'Projected Spend',
            data: spendPoints,
            borderColor: '#EF4444',
            backgroundColor: 'rgba(239, 68, 68, 0.04)',
            borderWidth: 2.5,
            tension: 0.35,
            fill: false,
            pointBackgroundColor: '#EF4444',
            pointRadius: 3
          },
          {
            label: 'Net Cash Flow',
            data: profitPoints,
            borderColor: '#6366F1',
            borderDash: [5, 5],
            borderWidth: 2,
            tension: 0.35,
            fill: false,
            pointBackgroundColor: '#6366F1',
            pointRadius: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: '#94A3B8',
              font: { family: 'Inter', size: 12 },
              usePointStyle: true,
              boxWidth: 8
            }
          },
          tooltip: {
            backgroundColor: '#0F172A',
            borderColor: '#334155',
            borderWidth: 1,
            titleColor: '#F8FAFC',
            bodyColor: '#94A3B8',
            padding: 10,
            callbacks: {
              label: (item) => ` ${item.dataset.label}: ${sym} ${Number(item.parsed.y).toLocaleString()}`
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(51, 65, 85, 0.25)' },
            ticks: { color: '#64748B', font: { family: 'Inter', size: 11 } }
          },
          y: {
            grid: { color: 'rgba(51, 65, 85, 0.25)' },
            ticks: {
              color: '#64748B',
              font: { family: 'JetBrains Mono, monospace', size: 11 },
              callback: (val) => `${sym} ${(Number(val) / 1000000).toFixed(1)}M`
            }
          }
        }
      }
    });
  }
}
