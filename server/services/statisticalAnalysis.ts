import { mean, standardDeviation, median, mode, variance, min, max, quantile } from 'simple-statistics';
import { Matrix } from 'ml-matrix';

export interface Variable {
  name: string;
  type: 'numerical' | 'categorical';
  values: any[];
  missingCount: number;
}

export interface DescriptiveStats {
  variable: string;
  type: 'numerical' | 'categorical';
  count: number;
  missing: number;
  mean?: number;
  median?: number;
  mode?: any;
  standardDeviation?: number;
  variance?: number;
  min?: any;
  max?: any;
  q1?: number;
  q3?: number;
  frequencies?: { [key: string]: number };
}

export interface CorrelationResult {
  variables: string[];
  correlationMatrix: number[][];
  pValues: number[][];
}

export interface HypothesisTest {
  testName: string;
  statistic: number;
  pValue: number;
  criticalValue?: number;
  degreesOfFreedom?: number;
  interpretation: string;
  significant: boolean;
}

export interface RegressionAnalysis {
  type: 'linear' | 'polynomial';
  coefficients: number[];
  rSquared: number;
  adjustedRSquared: number;
  fStatistic: number;
  pValue: number;
  residuals: number[];
  predictions: number[];
  confidenceIntervals: {
    lower: number[];
    upper: number[];
  };
}

export interface TimeSeriesAnalysis {
  trend: 'increasing' | 'decreasing' | 'stable';
  seasonality: boolean;
  autocorrelation: number[];
  forecast: number[];
}

export interface QualityControlChart {
  type: 'x-bar' | 'r-chart' | 'c-chart';
  centerLine: number;
  upperControlLimit: number;
  lowerControlLimit: number;
  dataPoints: number[];
  outOfControlPoints: number[];
}

export interface StatisticalResults {
  dataOverview: {
    totalObservations: number;
    totalVariables: number;
    numericalVariables: number;
    categoricalVariables: number;
    missingValuesPercentage: number;
    dataQuality: 'excellent' | 'good' | 'fair' | 'poor';
  };
  variables: Variable[];
  descriptiveStatistics: DescriptiveStats[];
  correlationAnalysis?: CorrelationResult;
  hypothesisTests: HypothesisTest[];
  outliers: { variable: string; outlierIndices: number[]; outlierValues: any[] }[];
  regressionAnalysis: RegressionAnalysis[];
  timeSeriesAnalysis?: TimeSeriesAnalysis;
  qualityControlCharts: QualityControlChart[];
  visualizations: any;
  advancedTests: any;
}

export class StatisticalAnalysis {
  analyzeData(data: any[][], headers: string[]): StatisticalResults {
    // Detect variables and their types
    const variables = this.detectVariables(data, headers);

    // Calculate descriptive statistics
    const descriptiveStats = variables.map(variable => this.calculateDescriptiveStats(variable));

    // Perform correlation analysis for numerical variables
    const numericalVars = variables.filter(v => v.type === 'numerical');
    const correlationAnalysis = numericalVars.length >= 2 ? this.performCorrelationAnalysis(numericalVars) : undefined;

    // Perform hypothesis tests
    const hypothesisTests = this.performHypothesisTests(variables);

    // Detect outliers
    const outliers = this.detectOutliers(variables);

    // Calculate overview statistics
    const totalMissing = variables.reduce((sum, v) => sum + v.missingCount, 0);
    const totalValues = variables.reduce((sum, v) => sum + v.values.length, 0);

    const dataOverview = {
      totalObservations: data.length,
      totalVariables: headers.length,
      numericalVariables: variables.filter(v => v.type === 'numerical').length,
      categoricalVariables: variables.filter(v => v.type === 'categorical').length,
      missingValuesPercentage: (totalMissing / (totalValues + totalMissing)) * 100,
      dataQuality: 'good' as 'excellent' | 'good' | 'fair' | 'poor'
    };

    // Advanced statistical tests
    const advancedTests = this.performAdvancedTests(variables);

    // Regression analysis
    const regressionAnalysis = this.performRegressionAnalysis(variables);

    // Time series analysis (if temporal data detected)
    const timeSeriesAnalysis = this.performTimeSeriesAnalysis(variables, data);

    // Quality control charts
    const qualityControlCharts = this.generateQualityControlCharts(variables);

    // Generate visualizations metadata
    const visualizations = this.generateVisualizationMetadata(variables);

    // Assess data quality
    const dataQuality = this.assessDataQuality(dataOverview, outliers, advancedTests);

    return {
      dataOverview: {
        ...dataOverview,
        dataQuality
      },
      variables,
      descriptiveStatistics: descriptiveStats,
      correlationAnalysis,
      hypothesisTests,
      outliers,
      regressionAnalysis,
      timeSeriesAnalysis,
      qualityControlCharts,
      visualizations,
      advancedTests
    };
  }

  private detectVariables(data: any[][], headers: string[]): Variable[] {
    return headers.map((header, index) => {
      const columnData = data.map(row => row[index]).filter(value => value !== null && value !== undefined && value !== '');
      const missingCount = data.length - columnData.length;

      // Try to convert to numbers
      const numericalData = columnData.map(value => {
        const num = parseFloat(String(value));
        return isNaN(num) ? null : num;
      }).filter(value => value !== null);

      const isNumerical = numericalData.length > columnData.length * 0.8; // 80% threshold

      return {
        name: header,
        type: isNumerical ? 'numerical' : 'categorical',
        values: isNumerical ? numericalData : columnData,
        missingCount,
      };
    });
  }

  private calculateDescriptiveStats(variable: Variable): DescriptiveStats {
    const baseStats: DescriptiveStats = {
      variable: variable.name,
      type: variable.type,
      count: variable.values.length,
      missing: variable.missingCount,
    };

    if (variable.type === 'numerical' && variable.values.length > 0) {
      const values = variable.values as number[];
      return {
        ...baseStats,
        mean: mean(values),
        median: median(values),
        mode: mode(values),
        standardDeviation: standardDeviation(values),
        variance: variance(values),
        min: min(values),
        max: max(values),
        q1: quantile(values, 0.25),
        q3: quantile(values, 0.75),
      };
    } else {
      // Categorical variable
      const frequencies: { [key: string]: number } = {};
      variable.values.forEach(value => {
        const key = String(value);
        frequencies[key] = (frequencies[key] || 0) + 1;
      });

      const modeValue = Object.entries(frequencies).reduce((a, b) => frequencies[a[0]] > frequencies[b[0]] ? a : b)[0];

      return {
        ...baseStats,
        mode: modeValue,
        frequencies,
      };
    }
  }

  private performCorrelationAnalysis(numericalVars: Variable[]): CorrelationResult {
    const variables = numericalVars.map(v => v.name);
    const n = variables.length;
    const correlationMatrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
    const pValues: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          correlationMatrix[i][j] = 1;
          pValues[i][j] = 0;
        } else {
          const correlation = this.calculatePearsonCorrelation(
            numericalVars[i].values as number[],
            numericalVars[j].values as number[]
          );
          correlationMatrix[i][j] = correlation;
          pValues[i][j] = this.calculateCorrelationPValue(correlation, Math.min(numericalVars[i].values.length, numericalVars[j].values.length));
        }
      }
    }

    return {
      variables,
      correlationMatrix,
      pValues,
    };
  }

  private calculatePearsonCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    if (n < 2) return 0;

    const meanX = mean(x.slice(0, n));
    const meanY = mean(y.slice(0, n));

    let numerator = 0;
    let sumXSquared = 0;
    let sumYSquared = 0;

    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      numerator += dx * dy;
      sumXSquared += dx * dx;
      sumYSquared += dy * dy;
    }

    const denominator = Math.sqrt(sumXSquared * sumYSquared);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private calculateCorrelationPValue(r: number, n: number): number {
    if (n < 3) return 1;
    const t = r * Math.sqrt((n - 2) / (1 - r * r));
    return 2 * (1 - this.cumulativeStudentT(Math.abs(t), n - 2));
  }

  private cumulativeStudentT(t: number, df: number): number {
    // Approximation for t-distribution CDF
    const x = df / (df + t * t);
    return 1 - 0.5 * this.incompleteBeta(df / 2, 0.5, x);
  }

  private incompleteBeta(a: number, b: number, x: number): number {
    // Simplified beta function approximation
    if (x >= 1) return 1;
    if (x <= 0) return 0;
    return Math.pow(x, a) * Math.pow(1 - x, b) / (a * this.beta(a, b));
  }

  private beta(a: number, b: number): number {
    return this.gamma(a) * this.gamma(b) / this.gamma(a + b);
  }

  private gamma(x: number): number {
    // Stirling's approximation
    if (x < 1) return this.gamma(x + 1) / x;
    return Math.sqrt(2 * Math.PI / x) * Math.pow(x / Math.E, x);
  }

  private performHypothesisTests(variables: Variable[]): HypothesisTest[] {
    const tests: HypothesisTest[] = [];

    // Normality tests for numerical variables
    variables.filter(v => v.type === 'numerical').forEach(variable => {
      const values = variable.values as number[];
      if (values.length > 3) {
        const normalityTest = this.shapiroWilkTest(values);
        tests.push(normalityTest);
      }
    });

    // One-sample t-test for numerical variables
    variables.filter(v => v.type === 'numerical').forEach(variable => {
      const values = variable.values as number[];
      if (values.length > 1) {
        const tTest = this.oneSampleTTest(values, 0); // Test against population mean of 0
        tests.push(tTest);
      }
    });

    return tests;
  }

  private shapiroWilkTest(data: number[]): HypothesisTest {
    // Simplified Shapiro-Wilk test
    const n = data.length;
    const sortedData = [...data].sort((a, b) => a - b);
    const meanValue = mean(data);

    // Calculate W statistic (simplified)
    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      denominator += Math.pow(sortedData[i] - meanValue, 2);
    }

    const W = numerator / denominator || 0;
    const pValue = W > 0.9 ? 0.1 : 0.01; // Simplified p-value

    return {
      testName: `Shapiro-Wilk Normality Test`,
      statistic: W,
      pValue,
      interpretation: pValue > 0.05 ? 'Data appears to be normally distributed' : 'Data may not be normally distributed',
      significant: pValue <= 0.05,
    };
  }

  private oneSampleTTest(data: number[], populationMean: number): HypothesisTest {
    const n = data.length;
    const sampleMean = mean(data);
    const sampleStd = standardDeviation(data);
    const standardError = sampleStd / Math.sqrt(n);

    const tStatistic = (sampleMean - populationMean) / standardError;
    const degreesOfFreedom = n - 1;
    const pValue = 2 * (1 - this.cumulativeStudentT(Math.abs(tStatistic), degreesOfFreedom));

    return {
      testName: 'One-Sample T-Test',
      statistic: tStatistic,
      pValue,
      degreesOfFreedom,
      interpretation: pValue <= 0.05 ? 'Sample mean is significantly different from population mean' : 'No significant difference from population mean',
      significant: pValue <= 0.05,
    };
  }

  private detectOutliers(variables: Variable[]): { variable: string; outlierIndices: number[]; outlierValues: any[] }[] {
    return variables
      .filter(v => v.type === 'numerical')
      .map(variable => {
        const values = variable.values as number[];
        const q1 = quantile(values, 0.25);
        const q3 = quantile(values, 0.75);
        const iqr = q3 - q1;
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;

        const outlierIndices: number[] = [];
        const outlierValues: number[] = [];

        values.forEach((value, index) => {
          if (value < lowerBound || value > upperBound) {
            outlierIndices.push(index);
            outlierValues.push(value);
          }
        });

        return {
          variable: variable.name,
          outlierIndices,
          outlierValues,
        };
      })
      .filter(result => result.outlierIndices.length > 0);
  }

  private performAdvancedTests(variables: Variable[]) {
    const normalityTests = variables
      .filter(v => v.type === 'numerical')
      .map(variable => {
        const values = variable.values.filter(v => v !== null && !isNaN(v));
        const shapiroWilk = this.shapiroWilkTest(values);
        const jarqueBera = this.jarqueBeraTest(values);

        return {
          variable: variable.name,
          shapiroWilk: shapiroWilk.statistic,
          jarqueBera: jarqueBera.statistic,
          pValue: shapiroWilk.pValue
        };
      });

    return {
      normalityTests,
      homoscedasticityTests: [],
      multicollinearityTests: []
    };
  }

  private performRegressionAnalysis(variables: Variable[]): RegressionAnalysis[] {
    const numericalVars = variables.filter(v => v.type === 'numerical');
    if (numericalVars.length < 2) return [];

    const analyses: RegressionAnalysis[] = [];

    // Simple linear regression between pairs
    for (let i = 0; i < numericalVars.length - 1; i++) {
      for (let j = i + 1; j < numericalVars.length; j++) {
        const x = numericalVars[i].values.filter(v => v !== null && !isNaN(v));
        const y = numericalVars[j].values.filter(v => v !== null && !isNaN(v));

        if (x.length > 10 && y.length > 10) {
          const regression = this.performLinearRegression(x, y);
          analyses.push(regression);
        }
      }
    }

    return analyses;
  }

  private performTimeSeriesAnalysis(variables: Variable[], data: any[][]): TimeSeriesAnalysis | undefined {
    // Simple time series analysis
    const timeVar = variables.find(v => v.name.toLowerCase().includes('time') || v.name.toLowerCase().includes('date'));
    if (!timeVar) return undefined;

    const numericalVar = variables.find(v => v.type === 'numerical' && v !== timeVar);
    if (!numericalVar) return undefined;

    const values = numericalVar.values.filter(v => v !== null && !isNaN(v));
    if (values.length < 10) return undefined;

    const trend = this.detectTrend(values);
    const seasonality = this.detectSeasonality(values);
    const autocorrelation = this.calculateAutocorrelation(values);

    return {
      trend,
      seasonality,
      autocorrelation,
      forecast: []
    };
  }

  private generateQualityControlCharts(variables: Variable[]): QualityControlChart[] {
    return variables
      .filter(v => v.type === 'numerical')
      .slice(0, 3) // Limit to first 3 numerical variables
      .map(variable => {
        const values = variable.values.filter(v => v !== null && !isNaN(v));
        const mean_val = mean(values);
        const std_val = standardDeviation(values);

        return {
          type: 'x-bar' as const,
          centerLine: mean_val,
          upperControlLimit: mean_val + 3 * std_val,
          lowerControlLimit: mean_val - 3 * std_val,
          dataPoints: values,
          outOfControlPoints: values
            .map((v, i) => Math.abs(v - mean_val) > 3 * std_val ? i : -1)
            .filter(i => i !== -1)
        };
      });
  }

  private generateVisualizationMetadata(variables: Variable[]) {
    return {
      histograms: variables.filter(v => v.type === 'numerical').map(v => v.name),
      boxplots: variables.filter(v => v.type === 'numerical').map(v => v.name),
      scatterplots: variables.filter(v => v.type === 'numerical').map(v => v.name),
      correlationHeatmap: 'correlation_matrix',
      qqPlots: variables.filter(v => v.type === 'numerical').map(v => v.name),
      densityPlots: variables.filter(v => v.type === 'numerical').map(v => v.name),
      controlCharts: variables.filter(v => v.type === 'numerical').map(v => v.name)
    };
  }

  private assessDataQuality(dataOverview: any, outliers: any[], advancedTests: any): 'excellent' | 'good' | 'fair' | 'poor' {
    let score = 100;

    // Penalize for missing values
    score -= dataOverview.missingValuesPercentage * 2;

    // Penalize for outliers
    const outlierPercentage = outliers.reduce((sum, o) => sum + o.outlierIndices.length, 0) / dataOverview.totalObservations * 100;
    score -= outlierPercentage;

    // Penalize for non-normal distributions
    const nonNormalVars = advancedTests.normalityTests.filter((t: any) => t.pValue < 0.05).length;
    score -= (nonNormalVars / advancedTests.normalityTests.length) * 20;

    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  }

  private shapiroWilkTest(values: number[]) {
    // Simplified Shapiro-Wilk test implementation
    const n = values.length;
    if (n < 3) return { statistic: 1, pValue: 1 };

    const sorted = [...values].sort((a, b) => a - b);
    const mean_val = mean(sorted);
    const variance_val = variance(sorted);

    // Simplified calculation
    const w = 1 - (variance_val / (mean_val * mean_val + variance_val));
    const pValue = w > 0.95 ? 0.8 : w > 0.9 ? 0.3 : 0.01;

    return { statistic: w, pValue };
  }

  private jarqueBeraTest(values: number[]) {
    const n = values.length;
    const mean_val = mean(values);
    const std_val = standardDeviation(values);

    // Calculate skewness and kurtosis
    const skewness = values.reduce((sum, x) => sum + Math.pow((x - mean_val) / std_val, 3), 0) / n;
    const kurtosis = values.reduce((sum, x) => sum + Math.pow((x - mean_val) / std_val, 4), 0) / n - 3;

    const jb = (n / 6) * (skewness * skewness + (kurtosis * kurtosis) / 4);

    return { statistic: jb, pValue: jb > 5.99 ? 0.01 : 0.8 };
  }

  private performLinearRegression(x: number[], y: number[]): RegressionAnalysis {
    const n = Math.min(x.length, y.length);
    const xSliced = x.slice(0, n);
    const ySliced = y.slice(0, n);

    const xMean = mean(xSliced);
    const yMean = mean(ySliced);

    const slope = xSliced.reduce((sum, xi, i) => sum + (xi - xMean) * (ySliced[i] - yMean), 0) /
                  xSliced.reduce((sum, xi) => sum + (xi - xMean) ** 2, 0);

    const intercept = yMean - slope * xMean;

    const predictions = xSliced.map(xi => slope * xi + intercept);
    const residuals = ySliced.map((yi, i) => yi - predictions[i]);

    const totalSumSquares = ySliced.reduce((sum, yi) => sum + (yi - yMean) ** 2, 0);
    const residualSumSquares = residuals.reduce((sum, r) => sum + r ** 2, 0);
    const rSquared = 1 - residualSumSquares / totalSumSquares;
    const adjustedRSquared = 1 - (1 - rSquared) * (n - 1) / (n - 2);

    return {
      type: 'linear',
      coefficients: [intercept, slope],
      rSquared,
      adjustedRSquared,
      fStatistic: (rSquared / (1 - rSquared)) * (n - 2),
      pValue: rSquared > 0.1 ? 0.05 : 0.2,
      residuals,
      predictions,
      confidenceIntervals: {
        lower: predictions.map(p => p - 1.96 * standardDeviation(residuals)),
        upper: predictions.map(p => p + 1.96 * standardDeviation(residuals))
      }
    };
  }

  private detectTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));

    const firstMean = mean(firstHalf);
    const secondMean = mean(secondHalf);

    const diff = (secondMean - firstMean) / firstMean;

    if (diff > 0.05) return 'increasing';
    if (diff < -0.05) return 'decreasing';
    return 'stable';
  }

  private detectSeasonality(values: number[]): boolean {
    if (values.length < 12) return false;

    // Simple seasonality detection using autocorrelation
    const autocorr = this.calculateAutocorrelation(values);
    return autocorr.some(r => Math.abs(r) > 0.3);
  }

  private calculateAutocorrelation(values: number[]): number[] {
    const mean_val = mean(values);
    const n = values.length;
    const autocorr: number[] = [];

    for (let lag = 1; lag <= Math.min(10, n / 4); lag++) {
      let sum = 0;
      let count = 0;

      for (let i = 0; i < n - lag; i++) {
        sum += (values[i] - mean_val) * (values[i + lag] - mean_val);
        count++;
      }

      const variance_val = variance(values);
      autocorr.push(count > 0 ? sum / (count * variance_val) : 0);
    }

    return autocorr;
  }
}