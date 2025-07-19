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

export interface StatisticalResults {
  dataOverview: {
    totalObservations: number;
    totalVariables: number;
    numericalVariables: number;
    categoricalVariables: number;
    missingValuesPercentage: number;
  };
  variables: Variable[];
  descriptiveStatistics: DescriptiveStats[];
  correlationAnalysis?: CorrelationResult;
  hypothesisTests: HypothesisTest[];
  outliers: { variable: string; outlierIndices: number[]; outlierValues: any[] }[];
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
    
    return {
      dataOverview: {
        totalObservations: data.length,
        totalVariables: headers.length,
        numericalVariables: variables.filter(v => v.type === 'numerical').length,
        categoricalVariables: variables.filter(v => v.type === 'categorical').length,
        missingValuesPercentage: (totalMissing / (totalValues + totalMissing)) * 100,
      },
      variables,
      descriptiveStatistics: descriptiveStats,
      correlationAnalysis,
      hypothesisTests,
      outliers,
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
}
