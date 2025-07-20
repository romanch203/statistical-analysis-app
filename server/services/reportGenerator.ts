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

    let y = 80;

    results.qualityControlCharts!.forEach((chart, index) => {
      if (y > 650) {
        doc.addPage();
        y = 50;
      }

      doc.fontSize(12).text(`${chart.type.toUpperCase()} Control Chart ${index + 1}`, 50, y);
      y += 20;

      doc.fontSize(10);
      doc.text(`Center Line (CL): ${chart.centerLine.toFixed(3)}`, 70, y);
      y += 15;
      doc.text(`Upper Control Limit (UCL): ${chart.upperControlLimit.toFixed(3)}`, 70, y);
      y += 15;
      doc.text(`Lower Control Limit (LCL): ${chart.lowerControlLimit.toFixed(3)}`, 70, y);
      y += 15;
      doc.text(`Out of Control Points: ${chart.outOfControlPoints.length}`, 70, y);
      y += 25;

      if (chart.outOfControlPoints.length > 0) {
        doc.text(`Process Status: OUT OF CONTROL`, 70, y);
        doc.text(`Action Required: Investigate special causes`, 70, y + 15);
      } else {
        doc.text(`Process Status: IN CONTROL`, 70, y);
        doc.text(`Process appears stable`, 70, y + 15);
      }
      y += 40;
    });
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
}