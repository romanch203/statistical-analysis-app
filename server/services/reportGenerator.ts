import PDFKit from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { StatisticalResults } from './statisticalAnalysis';
import { StatisticalInterpretation } from './openai';

export interface ReportOptions {
  format: 'pdf' | 'word';
  includeCharts: boolean;
  includeRawData: boolean;
}

export class ReportGenerator {
  async generateReport(
    analysis: any,
    statisticalResults: StatisticalResults,
    aiInterpretation: StatisticalInterpretation,
    options: ReportOptions = { format: 'pdf', includeCharts: true, includeRawData: false }
  ): Promise<string> {
    if (options.format === 'pdf') {
      return await this.generatePDFReport(analysis, statisticalResults, aiInterpretation, options);
    } else {
      return await this.generateWordReport(analysis, statisticalResults, aiInterpretation, options);
    }
  }

  private async generatePDFReport(
    analysis: any,
    results: StatisticalResults,
    interpretation: StatisticalInterpretation,
    options: ReportOptions
  ): Promise<string> {
    const doc = new PDFKit({ margin: 50 });
    const fileName = `analysis_report_${analysis.id}_${Date.now()}.pdf`;
    const filePath = path.join(process.cwd(), 'reports', fileName);

    // Ensure reports directory exists
    const reportsDir = path.dirname(filePath);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Title Page
    this.addReportHeader(doc, analysis);

    // Executive Summary
    doc.addPage();
    this.addSection(doc, 'Executive Summary', interpretation.executiveSummary);

    // Data Overview
    doc.addPage();
    this.addDataOverview(doc, results);

    // Descriptive Statistics
    doc.addPage();
    this.addDescriptiveStatistics(doc, results);

    // Statistical Tests
    if (results.hypothesisTests.length > 0) {
      doc.addPage();
      this.addHypothesisTests(doc, results);
    }

    // Correlation Analysis
    if (results.correlationAnalysis) {
      doc.addPage();
      this.addCorrelationAnalysis(doc, results);
    }

    // Advanced Tests
    if (results.advancedTests && results.advancedTests.normalityTests.length > 0) {
      doc.addPage();
      this.addAdvancedTests(doc, results);
    }

    // Regression Analysis
    if (results.regressionAnalysis && results.regressionAnalysis.length > 0) {
      doc.addPage();
      this.addRegressionAnalysis(doc, results);
    }

    // Quality Control Charts
    if (results.qualityControlCharts && results.qualityControlCharts.length > 0) {
      doc.addPage();
      this.addQualityControlSection(doc, results);
    }

    // Time Series Analysis
    if (results.timeSeriesAnalysis) {
      doc.addPage();
      this.addTimeSeriesAnalysis(doc, results);
    }

    // AI Interpretation
    doc.addPage();
    this.addAIInterpretation(doc, interpretation);

    // Methodology
    doc.addPage();
    this.addMethodology(doc, interpretation);

    // Footer
    this.addReportFooter(doc);

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve(fileName));
      stream.on('error', reject);
    });
  }

  private addReportHeader(doc: PDFKit.PDFDocument, analysis: any) {
    // Logo area (text-based)
    doc.fontSize(24).text('StatAnalyzer Pro', 50, 50);
    doc.fontSize(12).text('Advanced Statistical Analysis Platform', 50, 80);

    // Title
    doc.fontSize(20).text('Statistical Analysis Report', 50, 150);
    doc.fontSize(14).text(`File: ${analysis.filename}`, 50, 180);
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString()}`, 50, 200);

    // Powered by section
    doc.fontSize(10).text('Powered by IBM SPSS and R Studio with Automation Workflow', 50, 750);
    doc.text('© 2024 ROMAN CHAUDHARY. All rights reserved.', 50, 765);
  }

  private addSection(doc: PDFKit.PDFDocument, title: string, content: string) {
    doc.fontSize(16).text(title, 50, doc.y + 20);
    doc.fontSize(11).text(content, 50, doc.y + 10, { width: 500, align: 'justify' });
  }

  private addDataOverview(doc: PDFKit.PDFDocument, results: StatisticalResults) {
    doc.fontSize(16).text('Data Overview', 50, 50);

    const overview = results.dataOverview;
    const y = 80;

    doc.fontSize(11);
    doc.text(`Total Observations: ${overview.totalObservations}`, 50, y);
    doc.text(`Total Variables: ${overview.totalVariables}`, 50, y + 20);
    doc.text(`Numerical Variables: ${overview.numericalVariables}`, 50, y + 40);
    doc.text(`Categorical Variables: ${overview.categoricalVariables}`, 50, y + 60);
    doc.text(`Missing Values: ${overview.missingValuesPercentage.toFixed(2)}%`, 50, y + 80);

    // Variables table
    doc.fontSize(14).text('Variable Types', 50, y + 120);

    let tableY = y + 150;
    doc.fontSize(10);
    doc.text('Variable Name', 50, tableY);
    doc.text('Type', 200, tableY);
    doc.text('Count', 300, tableY);
    doc.text('Missing', 400, tableY);

    results.variables.forEach((variable, index) => {
      tableY += 20;
      doc.text(variable.name, 50, tableY);
      doc.text(variable.type, 200, tableY);
      doc.text(variable.values.length.toString(), 300, tableY);
      doc.text(variable.missingCount.toString(), 400, tableY);
    });
  }

  private addDescriptiveStatistics(doc: PDFKit.PDFDocument, results: StatisticalResults) {
    doc.fontSize(16).text('Descriptive Statistics', 50, 50);

    let y = 80;

    results.descriptiveStatistics.forEach((stats) => {
      if (y > 700) {
        doc.addPage();
        y = 50;
      }

      doc.fontSize(12).text(`${stats.variable} (${stats.type})`, 50, y);
      y += 20;

      doc.fontSize(10);
      if (stats.type === 'numerical') {
        doc.text(`Mean: ${stats.mean?.toFixed(3) || 'N/A'}`, 70, y);
        doc.text(`Median: ${stats.median?.toFixed(3) || 'N/A'}`, 200, y);
        doc.text(`Std Dev: ${stats.standardDeviation?.toFixed(3) || 'N/A'}`, 330, y);
        y += 15;
        doc.text(`Min: ${stats.min?.toFixed(3) || 'N/A'}`, 70, y);
        doc.text(`Max: ${stats.max?.toFixed(3) || 'N/A'}`, 200, y);
        doc.text(`Count: ${stats.count}`, 330, y);
      } else {
        doc.text(`Mode: ${stats.mode || 'N/A'}`, 70, y);
        doc.text(`Unique Values: ${Object.keys(stats.frequencies || {}).length}`, 200, y);
        doc.text(`Count: ${stats.count}`, 330, y);
      }
      y += 30;
    });
  }

  private addHypothesisTests(doc: PDFKit.PDFDocument, results: StatisticalResults) {
    doc.fontSize(16).text('Statistical Tests', 50, 50);

    let y = 80;

    results.hypothesisTests.forEach((test) => {
      if (y > 650) {
        doc.addPage();
        y = 50;
      }

      doc.fontSize(12).text(test.testName, 50, y);
      y += 20;

      doc.fontSize(10);
      doc.text(`Test Statistic: ${test.statistic.toFixed(4)}`, 70, y);
      doc.text(`p-value: ${test.pValue.toFixed(4)}`, 200, y);
      doc.text(`Significant: ${test.significant ? 'Yes' : 'No'}`, 330, y);
      y += 15;

      doc.text(`Interpretation: ${test.interpretation}`, 70, y, { width: 450 });
      y += 40;
    });
  }

  private addCorrelationAnalysis(doc: PDFKit.PDFDocument, results: StatisticalResults) {
    if (!results.correlationAnalysis) return;

    doc.fontSize(16).text('Correlation Analysis', 50, 50);

    const corr = results.correlationAnalysis;
    let y = 80;

    doc.fontSize(10);
    doc.text('Correlation Matrix:', 50, y);
    y += 20;

    // Header
    doc.text('Variable', 50, y);
    corr.variables.forEach((variable, index) => {
      doc.text(variable.substring(0, 8), 150 + index * 60, y);
    });
    y += 15;

    // Matrix
    corr.correlationMatrix.forEach((row, i) => {
      doc.text(corr.variables[i].substring(0, 12), 50, y);
      row.forEach((value, j) => {
        doc.text(value.toFixed(3), 150 + j * 60, y);
      });
      y += 15;
    });
  }

  private addAIInterpretation(doc: PDFKit.PDFDocument, interpretation: StatisticalInterpretation) {
    doc.fontSize(16).text('AI-Powered Interpretation', 50, 50);

    let y = 80;

    // Key Findings
    doc.fontSize(14).text('Key Findings', 50, y);
    y += 20;
    interpretation.keyFindings.forEach((finding, index) => {
      doc.fontSize(10).text(`${index + 1}. ${finding}`, 70, y, { width: 450 });
      y += 25;
    });

    // Statistical Significance
    y += 20;
    doc.fontSize(14).text('Statistical Significance', 50, y);
    y += 20;
    doc.fontSize(10).text(interpretation.statisticalSignificance, 70, y, { width: 450 });

    // Practical Implications
    y += 50;
    doc.fontSize(14).text('Practical Implications', 50, y);
    y += 20;
    doc.fontSize(10).text(interpretation.practicalImplications, 70, y, { width: 450 });

    // Recommendations
    if (y > 600) {
      doc.addPage();
      y = 50;
    } else {
      y += 50;
    }

    doc.fontSize(14).text('Recommendations', 50, y);
    y += 20;
    interpretation.recommendations.forEach((rec, index) => {
      doc.fontSize(10).text(`${index + 1}. ${rec}`, 70, y, { width: 450 });
      y += 25;
    });
  }

  private addMethodology(doc: PDFKit.PDFDocument, interpretation: StatisticalInterpretation) {
    doc.fontSize(16).text('Methodology', 50, 50);
    doc.fontSize(10).text(interpretation.methodology, 50, 80, { width: 500, align: 'justify' });

    // Standard methodology section
    doc.text('\n\nStandard Statistical Procedures:', 50, doc.y + 20);
    doc.text('• Data validation and cleaning performed automatically', 70, doc.y + 10);
    doc.text('• Variable type detection using advanced algorithms', 70, doc.y + 10);
    doc.text('• Outlier detection using IQR method', 70, doc.y + 10);
    doc.text('• Statistical significance tested at α = 0.05 level', 70, doc.y + 10);
    doc.text('• Correlation analysis using Pearson correlation coefficient', 70, doc.y + 10);
    doc.text('• Normality testing using Shapiro-Wilk test', 70, doc.y + 10);
  }

  private addReportFooter(doc: PDFKit.PDFDocument) {
    const range = doc.bufferedPageRange();
    const pageCount = range.count;

    for (let i = 0; i < pageCount; i++) {
      const pageIndex = range.start + i;
      doc.switchToPage(pageIndex);
      doc.fontSize(8);
      doc.text(`Page ${i + 1} of ${pageCount}`, 450, 750);
      doc.text('Generated by StatAnalyzer Pro', 50, 750);
      doc.text('Contact Developer: chaudharyroman.com.np', 50, 765);
    }
  }

  private async generateWordReport(
    analysis: any,
    results: StatisticalResults,
    interpretation: StatisticalInterpretation,
    options: ReportOptions
  ): Promise<string> {
    // For now, generate a detailed text report that can be saved as .doc
    const fileName = `analysis_report_${analysis.id}_${Date.now()}.txt`;
    const filePath = path.join(process.cwd(), 'reports', fileName);

    const reportsDir = path.dirname(filePath);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    let content = '';
    content += 'STATISTICAL ANALYSIS REPORT\n';
    content += '=================================\n\n';
    content += `Generated by StatAnalyzer Pro\n`;
    content += `File: ${analysis.filename}\n`;
    content += `Date: ${new Date().toLocaleDateString()}\n\n`;

    content += 'EXECUTIVE SUMMARY\n';
    content += '-----------------\n';
    content += `${interpretation.executiveSummary}\n\n`;

    content += 'DATA OVERVIEW\n';
    content += '-------------\n';
    content += `Total Observations: ${results.dataOverview.totalObservations}\n`;
    content += `Total Variables: ${results.dataOverview.totalVariables}\n`;
    content += `Numerical Variables: ${results.dataOverview.numericalVariables}\n`;
    content += `Categorical Variables: ${results.dataOverview.categoricalVariables}\n`;
    content += `Missing Values: ${results.dataOverview.missingValuesPercentage.toFixed(2)}%\n\n`;

    content += 'KEY FINDINGS\n';
    content += '------------\n';
    interpretation.keyFindings.forEach((finding, index) => {
      content += `${index + 1}. ${finding}\n`;
    });
    content += '\n';

    content += 'DESCRIPTIVE STATISTICS\n';
    content += '----------------------\n';
    results.descriptiveStatistics.forEach((stats) => {
      content += `\n${stats.variable} (${stats.type}):\n`;
      if (stats.type === 'numerical') {
        content += `  Mean: ${stats.mean?.toFixed(3) || 'N/A'}\n`;
        content += `  Median: ${stats.median?.toFixed(3) || 'N/A'}\n`;
        content += `  Standard Deviation: ${stats.standardDeviation?.toFixed(3) || 'N/A'}\n`;
        content += `  Min: ${stats.min?.toFixed(3) || 'N/A'}\n`;
        content += `  Max: ${stats.max?.toFixed(3) || 'N/A'}\n`;
      } else {
        content += `  Mode: ${stats.mode || 'N/A'}\n`;
        content += `  Unique Values: ${Object.keys(stats.frequencies || {}).length}\n`;
      }
      content += `  Count: ${stats.count}\n`;
      content += `  Missing: ${stats.missing}\n`;
    });

    // Quality Control Charts section
    if (results.qualityControlCharts && results.qualityControlCharts.length > 0) {
      content += '\n\nQUALITY CONTROL CHARTS\n';
      content += '======================\n';
      
      results.qualityControlCharts.forEach((chart, index) => {
        const variable = results.variables[index];
        content += `\n${chart.type.toUpperCase()}-Chart for ${variable?.name || 'Variable ' + (index + 1)}:\n`;
        content += `  Center Line (X̄): ${chart.centerLine.toFixed(4)}\n`;
        content += `  Upper Control Limit (UCL): ${chart.upperControlLimit.toFixed(4)}\n`;
        content += `  Lower Control Limit (LCL): ${chart.lowerControlLimit.toFixed(4)}\n`;
        content += `  Sample Size: ${chart.dataPoints.length} observations\n`;
        content += `  Out of Control Points: ${chart.outOfControlPoints.length}\n`;
        
        const processCapability = this.calculateProcessCapability(chart);
        content += `  Process Capability (Cp): ${processCapability.cp.toFixed(3)}\n`;
        content += `  Process Capability (Cpk): ${processCapability.cpk.toFixed(3)}\n`;
        
        if (chart.outOfControlPoints.length > 0) {
          content += `  PROCESS STATUS: OUT OF CONTROL\n`;
          content += `  Special Causes Detected at Points: ${chart.outOfControlPoints.join(', ')}\n`;
          content += `  Recommended Actions:\n`;
          content += `    • Investigate root causes for out-of-control points\n`;
          content += `    • Implement corrective actions\n`;
          content += `    • Monitor process more closely\n`;
        } else {
          content += `  PROCESS STATUS: IN STATISTICAL CONTROL\n`;
          content += `  Process is stable and predictable\n`;
        }
        
        // Add ASCII chart
        content += '\n  Control Chart Visualization:\n';
        const chartVisualization = this.generateASCIIControlChart(chart);
        chartVisualization.split('\n').forEach(line => {
          content += `  ${line}\n`;
        });
        content += '\n';
      });
      
      // Overall assessment
      const overallAssessment = this.generateOverallProcessAssessment(results.qualityControlCharts);
      content += '\nOVERALL PROCESS ASSESSMENT:\n';
      content += `${overallAssessment.summary}\n\n`;
      content += 'RECOMMENDATIONS:\n';
      overallAssessment.recommendations.forEach((rec, index) => {
        content += `${index + 1}. ${rec}\n`;
      });
    }

    content += '\n\nPowered by IBM SPSS and R Studio with Automation Workflow\n';
    content += '© 2024 ROMAN CHAUDHARY. All rights reserved.\n';
    content += 'Contact Developer: chaudharyroman.com.np\n';

    fs.writeFileSync(filePath, content);
    return fileName;
  }

  private addAdvancedTests(doc: PDFKit.PDFDocument, results: StatisticalResults) {
    doc.fontSize(16).text('Advanced Statistical Tests', 50, 50);

    let y = 80;

    // Normality Tests
    doc.fontSize(14).text('Normality Tests', 50, y);
    y += 30;

    results.advancedTests.normalityTests.forEach((test) => {
      if (y > 650) {
        doc.addPage();
        y = 50;
      }

      doc.fontSize(12).text(`${test.variable}:`, 50, y);
      y += 20;

      doc.fontSize(10);
      doc.text(`Shapiro-Wilk Statistic: ${test.shapiroWilk.toFixed(4)}`, 70, y);
      doc.text(`Jarque-Bera Statistic: ${test.jarqueBera.toFixed(4)}`, 250, y);
      y += 15;

      doc.text(`p-value: ${test.pValue.toFixed(4)}`, 70, y);
      doc.text(`Distribution: ${test.pValue > 0.05 ? 'Normal' : 'Non-Normal'}`, 250, y);
      y += 25;
    });
  }

  private addRegressionAnalysis(doc: PDFKit.PDFDocument, results: StatisticalResults) {
    doc.fontSize(16).text('Regression Analysis', 50, 50);

    let y = 80;

    results.regressionAnalysis!.forEach((regression, index) => {
      if (y > 600) {
        doc.addPage();
        y = 50;
      }

      doc.fontSize(12).text(`${regression.type.toUpperCase()} Regression Model ${index + 1}`, 50, y);
      y += 20;

      doc.fontSize(10);
      doc.text(`R-squared: ${regression.rSquared.toFixed(4)}`, 70, y);
      doc.text(`Adjusted R-squared: ${regression.adjustedRSquared.toFixed(4)}`, 250, y);
      y += 15;

      doc.text(`F-statistic: ${regression.fStatistic.toFixed(4)}`, 70, y);
      doc.text(`p-value: ${regression.pValue.toFixed(4)}`, 250, y);
      y += 15;

      doc.text(`Model Equation: y = ${regression.coefficients[0]?.toFixed(4)} + ${regression.coefficients[1]?.toFixed(4)}x`, 70, y);
      y += 20;

      doc.text(`Significance: ${regression.pValue <= 0.05 ? 'Significant' : 'Not Significant'}`, 70, y);
      y += 30;
    });
  }

  private addQualityControlSection(doc: PDFKit.PDFDocument, results: StatisticalResults) {
    doc.fontSize(16).text('Quality Control Charts', 50, 50);
    doc.fontSize(11).text('Statistical Process Control Analysis', 50, 75);

    let y = 100;

    results.qualityControlCharts!.forEach((chart, index) => {
      if (y > 500) {
        doc.addPage();
        y = 50;
      }

      const variable = results.variables[index];
      doc.fontSize(14).text(`${chart.type.toUpperCase()}-Chart for ${variable?.name || 'Variable ' + (index + 1)}`, 50, y);
      y += 25;

      // Chart parameters
      doc.fontSize(12).text('Control Chart Parameters:', 50, y);
      y += 20;
      
      doc.fontSize(10);
      doc.text(`Center Line (X̄): ${chart.centerLine.toFixed(4)}`, 70, y);
      doc.text(`Standard Deviation (σ): ${(chart.upperControlLimit - chart.centerLine) / 3).toFixed(4)}`, 300, y);
      y += 15;
      doc.text(`Upper Control Limit (UCL): ${chart.upperControlLimit.toFixed(4)}`, 70, y);
      doc.text(`Lower Control Limit (LCL): ${chart.lowerControlLimit.toFixed(4)}`, 300, y);
      y += 20;

      // Sample size and data points
      doc.text(`Sample Size: ${chart.dataPoints.length} observations`, 70, y);
      doc.text(`Out of Control Points: ${chart.outOfControlPoints.length}`, 300, y);
      y += 20;

      // Process capability analysis
      doc.fontSize(11).text('Process Capability Assessment:', 50, y);
      y += 20;

      const processCapability = this.calculateProcessCapability(chart);
      doc.fontSize(10);
      doc.text(`Cp (Process Potential): ${processCapability.cp.toFixed(3)}`, 70, y);
      doc.text(`Cpk (Process Capability): ${processCapability.cpk.toFixed(3)}`, 300, y);
      y += 15;

      // Control chart interpretation
      if (chart.outOfControlPoints.length > 0) {
        doc.fillColor('red').text(`◆ PROCESS STATUS: OUT OF CONTROL`, 70, y);
        y += 15;
        doc.fillColor('black').text(`Special Causes Detected at Points: ${chart.outOfControlPoints.join(', ')}`, 70, y);
        y += 15;
        doc.text(`Recommended Actions:`, 70, y);
        y += 12;
        doc.text(`• Investigate root causes for out-of-control points`, 90, y);
        y += 12;
        doc.text(`• Implement corrective actions`, 90, y);
        y += 12;
        doc.text(`• Monitor process more closely`, 90, y);
      } else {
        doc.fillColor('green').text(`◆ PROCESS STATUS: IN STATISTICAL CONTROL`, 70, y);
        y += 15;
        doc.fillColor('black').text(`Process is stable and predictable`, 70, y);
        y += 15;
        doc.text(`All data points fall within control limits`, 70, y);
      }
      y += 25;

      // Statistical analysis of control chart data
      doc.fontSize(11).text('Statistical Summary:', 50, y);
      y += 20;
      
      const stats = this.calculateControlChartStatistics(chart);
      doc.fontSize(10);
      doc.text(`Range (R): ${stats.range.toFixed(4)}`, 70, y);
      doc.text(`Process Sigma: ${stats.processSigma.toFixed(4)}`, 200, y);
      doc.text(`Control Limits Sigma: ${stats.controlLimitsSigma.toFixed(4)}`, 330, y);
      y += 15;

      // Control chart rules violations
      const rulesViolations = this.checkControlChartRules(chart);
      if (rulesViolations.length > 0) {
        doc.fontSize(11).text('Control Chart Rules Violations:', 50, y);
        y += 20;
        doc.fontSize(10);
        rulesViolations.forEach(violation => {
          doc.text(`• ${violation}`, 70, y);
          y += 15;
        });
      }

      y += 20;
      
      // ASCII representation of control chart
      doc.fontSize(11).text('Control Chart Visualization:', 50, y);
      y += 20;
      
      const chartVisualization = this.generateASCIIControlChart(chart);
      doc.fontSize(8).font('Courier');
      chartVisualization.split('\n').forEach(line => {
        if (y > 750) {
          doc.addPage();
          y = 50;
        }
        doc.text(line, 50, y);
        y += 10;
      });
      doc.font('Helvetica');
      
      y += 30;
    });

    // Overall process assessment
    if (results.qualityControlCharts!.length > 0) {
      if (y > 600) {
        doc.addPage();
        y = 50;
      }
      
      doc.fontSize(14).text('Overall Process Assessment', 50, y);
      y += 25;
      
      const overallAssessment = this.generateOverallProcessAssessment(results.qualityControlCharts!);
      doc.fontSize(11).text(overallAssessment.summary, 50, y, { width: 500, align: 'justify' });
      y += 40;
      
      doc.fontSize(12).text('Recommendations:', 50, y);
      y += 20;
      doc.fontSize(10);
      overallAssessment.recommendations.forEach(rec => {
        doc.text(`• ${rec}`, 70, y, { width: 450 });
        y += 15;
      });
    }
  }

  private addTimeSeriesAnalysis(doc: PDFKit.PDFDocument, results: StatisticalResults) {
    const ts = results.timeSeriesAnalysis!;

    doc.fontSize(16).text('Time Series Analysis', 50, 50);

    let y = 80;

    doc.fontSize(12).text('Time Series Components', 50, y);
    y += 30;

    doc.fontSize(10);
    doc.text(`Trend: ${ts.trend.toUpperCase()}`, 70, y);
    y += 15;
    doc.text(`Seasonality: ${ts.seasonality ? 'DETECTED' : 'NOT DETECTED'}`, 70, y);
    y += 15;

    if (ts.autocorrelation.length > 0) {
      doc.text('Autocorrelation Function:', 70, y);
      y += 15;
      ts.autocorrelation.slice(0, 5).forEach((corr, lag) => {
        doc.text(`  Lag ${lag + 1}: ${corr.toFixed(4)}`, 90, y);
        y += 12;
      });
    }

    if (ts.arima) {
      y += 10;
      doc.text(`ARIMA Model: (${ts.arima.p}, ${ts.arima.d}, ${ts.arima.q})`, 70, y);
      y += 15;
      doc.text(`AIC: ${ts.arima.aic.toFixed(3)}`, 70, y);
      y += 15;
      doc.text(`BIC: ${ts.arima.bic.toFixed(3)}`, 70, y);
    }
  }

  private calculateProcessCapability(chart: any) {
    const range = chart.upperControlLimit - chart.lowerControlLimit;
    const sigma = range / 6; // 6 sigma range
    const cp = range / (6 * sigma);
    const cpk = Math.min(
      (chart.upperControlLimit - chart.centerLine) / (3 * sigma),
      (chart.centerLine - chart.lowerControlLimit) / (3 * sigma)
    );
    
    return { cp, cpk };
  }

  private calculateControlChartStatistics(chart: any) {
    const min = Math.min(...chart.dataPoints);
    const max = Math.max(...chart.dataPoints);
    const range = max - min;
    const processSigma = (chart.upperControlLimit - chart.centerLine) / 3;
    const controlLimitsSigma = 3; // 3-sigma control limits
    
    return { range, processSigma, controlLimitsSigma };
  }

  private checkControlChartRules(chart: any) {
    const violations: string[] = [];
    const data = chart.dataPoints;
    const ucl = chart.upperControlLimit;
    const lcl = chart.lowerControlLimit;
    const cl = chart.centerLine;
    
    // Rule 1: Points beyond control limits
    if (chart.outOfControlPoints.length > 0) {
      violations.push(`Rule 1: ${chart.outOfControlPoints.length} points beyond control limits`);
    }
    
    // Rule 2: 8 consecutive points on one side of center line
    let consecutiveAbove = 0;
    let consecutiveBelow = 0;
    for (let i = 0; i < data.length; i++) {
      if (data[i] > cl) {
        consecutiveAbove++;
        consecutiveBelow = 0;
      } else {
        consecutiveBelow++;
        consecutiveAbove = 0;
      }
      
      if (consecutiveAbove >= 8) {
        violations.push('Rule 2: 8+ consecutive points above center line');
        break;
      }
      if (consecutiveBelow >= 8) {
        violations.push('Rule 2: 8+ consecutive points below center line');
        break;
      }
    }
    
    return violations;
  }

  private generateASCIIControlChart(chart: any) {
    const width = 60;
    const height = 15;
    const data = chart.dataPoints.slice(0, width); // Limit to chart width
    
    const min = Math.min(chart.lowerControlLimit, ...data);
    const max = Math.max(chart.upperControlLimit, ...data);
    
    let chartLines: string[] = [];
    
    // Create chart grid
    for (let row = 0; row < height; row++) {
      let line = '';
      const yValue = max - (row / (height - 1)) * (max - min);
      
      // Add y-axis label
      if (row === 0) line += 'UCL |';
      else if (row === Math.floor(height / 2)) line += ' CL |';
      else if (row === height - 1) line += 'LCL |';
      else line += '    |';
      
      // Plot data points
      for (let col = 0; col < Math.min(width - 5, data.length); col++) {
        const dataValue = data[col];
        const plotRow = Math.round((max - dataValue) / (max - min) * (height - 1));
        
        if (plotRow === row) {
          if (dataValue > chart.upperControlLimit || dataValue < chart.lowerControlLimit) {
            line += 'X'; // Out of control
          } else {
            line += '*'; // In control
          }
        } else if (row === 0 && yValue >= chart.upperControlLimit) {
          line += '-'; // UCL line
        } else if (row === Math.floor(height / 2) && Math.abs(yValue - chart.centerLine) < (max - min) / (height * 2)) {
          line += '-'; // Center line
        } else if (row === height - 1 && yValue <= chart.lowerControlLimit) {
          line += '-'; // LCL line
        } else {
          line += ' ';
        }
      }
      
      chartLines.push(line);
    }
    
    // Add legend
    chartLines.push('');
    chartLines.push('Legend: * = In Control, X = Out of Control');
    chartLines.push(`UCL = ${chart.upperControlLimit.toFixed(3)}, CL = ${chart.centerLine.toFixed(3)}, LCL = ${chart.lowerControlLimit.toFixed(3)}`);
    
    return chartLines.join('\n');
  }

  private generateOverallProcessAssessment(charts: any[]) {
    const totalCharts = charts.length;
    const outOfControlCharts = charts.filter(chart => chart.outOfControlPoints.length > 0).length;
    const inControlCharts = totalCharts - outOfControlCharts;
    
    const summary = `Process assessment based on ${totalCharts} control chart(s): ${inControlCharts} process(es) are in statistical control, while ${outOfControlCharts} process(es) show signs of special cause variation. Overall process stability: ${outOfControlCharts === 0 ? 'STABLE' : outOfControlCharts < totalCharts / 2 ? 'MOSTLY STABLE' : 'UNSTABLE'}.`;
    
    const recommendations = [];
    if (outOfControlCharts > 0) {
      recommendations.push('Investigate and eliminate special causes in out-of-control processes');
      recommendations.push('Implement corrective actions for identified issues');
      recommendations.push('Increase sampling frequency for unstable processes');
    }
    if (inControlCharts > 0) {
      recommendations.push('Continue monitoring stable processes with regular control charts');
      recommendations.push('Consider process improvement initiatives for controlled processes');
    }
    recommendations.push('Review control limits periodically and update as needed');
    recommendations.push('Train personnel on control chart interpretation and response procedures');
    
    return { summary, recommendations };
  }
}