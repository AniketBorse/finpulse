import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  inject,
  computed,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService, FinancialSummary } from '../../services/api.service';
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
  Filler,
  DoughnutController,
  ArcElement
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
  Filler,
  DoughnutController,
  ArcElement
);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  api = inject(ApiService);

  @ViewChild('lineChartCanvas') lineChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('donutChartCanvas') donutChartCanvas!: ElementRef<HTMLCanvasElement>;

  private lineChart: Chart | null = null;
  private donutChart: Chart | null = null;

  summary = computed(() => this.api.summaryData());
  recentEntries = computed(() => this.summary()?.recent_entries || []);

  constructor() {
    effect(() => {
      const sym = this.api.currencySymbol();
      const s = this.api.summaryData();
      if (s) {
        this.renderCharts(s);
      }
    });
  }

  ngOnInit() {
    this.api.refreshSummary();
  }

  ngAfterViewInit() {
    if (this.summary()) {
      this.renderCharts(this.summary()!);
    }
  }

  ngOnDestroy() {
    if (this.lineChart) this.lineChart.destroy();
    if (this.donutChart) this.donutChart.destroy();
  }

  formatPeriod(periodStr: string): string {
    if (!periodStr) return '';
    const [year, month] = periodStr.substring(0, 7).split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const idx = parseInt(month, 10) - 1;
    return `${months[idx] || month} ${year}`;
  }

  renderCharts(data: FinancialSummary) {
    if (!this.lineChartCanvas || !this.donutChartCanvas) return;

    if (this.lineChart) this.lineChart.destroy();
    if (this.donutChart) this.donutChart.destroy();

    const sym = this.api.currencySymbol();
    const timeline = data.timeline || [];
    const labels = timeline.map(t => t.formatted_period);
    const revData = timeline.map(t => t.revenue);
    const expData = timeline.map(t => t.expenses);

    const lineCtx = this.lineChartCanvas.nativeElement.getContext('2d');
    if (lineCtx) {
      this.lineChart = new Chart(lineCtx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Revenue',
              data: revData,
              borderColor: '#10B981',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              fill: true,
              tension: 0.35,
              borderWidth: 2.5,
              pointRadius: 3.5,
              pointBackgroundColor: '#10B981',
            },
            {
              label: 'Expenses',
              data: expData,
              borderColor: '#EF4444',
              backgroundColor: 'rgba(239, 68, 68, 0.04)',
              fill: true,
              tension: 0.35,
              borderWidth: 2.5,
              pointRadius: 3.5,
              pointBackgroundColor: '#EF4444',
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1E293B',
              borderColor: '#334155',
              borderWidth: 1,
              titleFont: { family: 'Inter', size: 11 },
              bodyFont: { family: 'JetBrains Mono', size: 11 },
              callbacks: {
                label: (ctx) => ` ${ctx.dataset.label}: ${sym}${Number(ctx.parsed.y).toLocaleString()}`
              }
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(51, 65, 85, 0.25)' },
              ticks: { color: '#94A3B8', font: { family: 'Inter', size: 10 } }
            },
            y: {
              grid: { color: 'rgba(51, 65, 85, 0.25)' },
              ticks: {
                color: '#94A3B8',
                font: { family: 'JetBrains Mono', size: 10 },
                callback: (v) => `${sym}${Number(v) / 1000}k`
              }
            }
          }
        }
      });
    }

    const dist = data.category_distribution || { payroll: 0, goods_procurement: 0, investments_capex: 0, overhead_misc: 0 };
    const donutCtx = this.donutChartCanvas.nativeElement.getContext('2d');
    if (donutCtx) {
      this.donutChart = new Chart(donutCtx, {
        type: 'doughnut',
        data: {
          labels: ['Payroll', 'Goods Procurement', 'CapEx / Investments', 'Overhead & Misc'],
          datasets: [
            {
              data: [dist.payroll, dist.goods_procurement, dist.investments_capex, dist.overhead_misc],
              backgroundColor: ['#6366F1', '#14B8A6', '#F59E0B', '#64748B'],
              borderWidth: 2,
              borderColor: '#1E293B',
              hoverOffset: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '72%',
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1E293B',
              borderColor: '#334155',
              borderWidth: 1,
              bodyFont: { family: 'JetBrains Mono', size: 11 },
              callbacks: {
                label: (ctx) => ` ${ctx.label}: ${sym}${Number(ctx.parsed).toLocaleString()}`
              }
            }
          }
        }
      });
    }
  }
}
