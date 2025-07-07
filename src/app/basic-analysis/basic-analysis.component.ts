import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ChartDataset, ChartOptions } from 'chart.js';
import { BasicAnalysisService } from '../Service/basic-analysis.service';
import { MortalityService } from '../Service/mortality.service';

@Component({
  selector: 'app-basic-analysis',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: './basic-analysis.component.html',
  styleUrls: ['./basic-analysis.component.css']
})
export class BasicAnalysisComponent implements OnInit {
  public lineChartOptions: ChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' }
    }
  };

  public lineChartLabels: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul','Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  public lineChartData: ChartDataset[] = [
    { data: [], label: 'Mortality', borderColor: 'red', fill: false, tension: 0.3 },
    { data: [], label: 'Fish Stocking', borderColor: 'blue', fill: false, tension: 0.3 }
  ];

  public lineChartType: 'line' = 'line';

  constructor(
  private basicAnalysisService: BasicAnalysisService,
  private mortalityService: MortalityService
) {}

  ngOnInit() {
  this.basicAnalysisService.stockingData$.subscribe(stockingData => {
    this.lineChartData = [
      this.lineChartData[0],
      { ...this.lineChartData[1], data: [...stockingData] }
    ];
  });

  this.mortalityService.mortalityData$.subscribe(mortalityData => {
    this.lineChartData = [
      { ...this.lineChartData[0], data: [...mortalityData] },
      this.lineChartData[1]
    ];
  });
}

}
