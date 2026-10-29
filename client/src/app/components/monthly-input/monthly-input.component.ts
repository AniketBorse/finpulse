import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-monthly-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './monthly-input.component.html'
})
export class MonthlyInputComponent {
  api = inject(ApiService);
  router = inject(Router);

  currentStep = 1;
  totalSteps = 5;

  formValues = {
    period: '2026-11',
    total_revenue: 450000,
    payroll_expenses: 140000,
    goods_procurement: 85000,
    investments_capex: 30000,
    overhead_misc: 35000,
    notes: 'Q4 expansion following pipeline conversions.',
  };

  isSubmitting = false;
  submitSuccess = false;
  submitError: string | null = null;
  csvFileName: string | null = null;

  get computedTotalExpenses(): number {
    return (
      Number(this.formValues.payroll_expenses || 0) +
      Number(this.formValues.goods_procurement || 0) +
      Number(this.formValues.investments_capex || 0) +
      Number(this.formValues.overhead_misc || 0)
    );
  }

  get computedNetProfit(): number {
    return Number(this.formValues.total_revenue || 0) - this.computedTotalExpenses;
  }

  get computedOperatingMargin(): number {
    const rev = Number(this.formValues.total_revenue || 0);
    return rev > 0 ? Number(((this.computedNetProfit / rev) * 100).toFixed(1)) : 0;
  }

  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  handleCsvUpload(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];
      this.csvFileName = file.name;
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        this.parseCsv(text);
      };
      reader.readAsText(file);
    }
  }

  parseCsv(content: string) {
    try {
      const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
      if (lines.length > 1) {
        const row = lines[1].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        if (row.length >= 6) {
          this.formValues.period = row[0].substring(0, 7) || this.formValues.period;
          this.formValues.total_revenue = parseFloat(row[1]) || this.formValues.total_revenue;
          this.formValues.payroll_expenses = parseFloat(row[2]) || this.formValues.payroll_expenses;
          this.formValues.goods_procurement = parseFloat(row[3]) || this.formValues.goods_procurement;
          this.formValues.investments_capex = parseFloat(row[4]) || this.formValues.investments_capex;
          this.formValues.overhead_misc = parseFloat(row[5]) || this.formValues.overhead_misc;
          if (row[6]) this.formValues.notes = row[6];
          this.currentStep = 5;
        }
      }
    } catch (e) {
      console.warn('CSV parse failed:', e);
    }
  }

  downloadSampleCsv() {
    const csv = 'Period,Revenue,Payroll,Procurement,CapEx,Overhead,Notes\n2026-12,465000,145000,88000,32000,35000,"Year-end enterprise accounts close."\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'finpulse-sample-input.csv';
    a.click();
  }

  async submitMonthlyReport() {
    if (this.api.isViewer()) {
      alert('View-Only mode is active. Switch to ADMIN mode to submit records.');
      return;
    }

    this.isSubmitting = true;
    this.submitError = null;

    try {
      const res = await this.api.createMonthly({
        period: this.formValues.period,
        total_revenue: Number(this.formValues.total_revenue),
        payroll_expenses: Number(this.formValues.payroll_expenses),
        goods_procurement: Number(this.formValues.goods_procurement),
        investments_capex: Number(this.formValues.investments_capex),
        overhead_misc: Number(this.formValues.overhead_misc),
        notes: this.formValues.notes,
      });

      if (res.success) {
        this.submitSuccess = true;
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1200);
      } else {
        this.submitError = res.message || 'Failed to submit financial report.';
      }
    } catch (err: any) {
      this.submitError = err.message || 'An error occurred during submission.';
    } finally {
      this.isSubmitting = false;
    }
  }
}
