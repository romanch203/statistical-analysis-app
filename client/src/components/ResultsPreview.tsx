import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileText, BarChart3, TrendingUp, Eye, Bot } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface ResultsPreviewProps {
  analysisId: number;
}

export default function ResultsPreview({ analysisId }: ResultsPreviewProps) {
  const { data: analysis, isLoading } = useQuery({
    queryKey: ["/api/analysis", analysisId],
    enabled: !!analysisId,
  });

  if (isLoading || !analysis) {
    return (
      <Card className="p-6">
        <div className="text-center text-secondary py-8">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Loading analysis results...</p>
        </div>
      </Card>
    );
  }

  if (analysis.status !== "completed" || !analysis.statisticalResults) {
    return (
      <Card className="p-6">
        <div className="text-center text-secondary py-8">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Analysis results will appear here once processing is complete</p>
        </div>
      </Card>
    );
  }

  const results = analysis.statisticalResults;
  const aiInterpretation = analysis.aiInterpretation ? JSON.parse(analysis.aiInterpretation) : null;

  return (
    <Card className="p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-primary flex items-center">
          <BarChart3 className="text-ibm-blue mr-3" />
          Analysis Results Preview
        </h3>
        <div className="flex space-x-3">
          <Button 
            className="bg-success-green hover:bg-green-600"
            onClick={() => {
              const link = document.createElement('a');
              link.href = `/api/analysis/${analysisId}/report?format=pdf`;
              link.download = `analysis_report_${analysisId}.pdf`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF Report
          </Button>
          <Button 
            variant="outline"
            onClick={() => {
              const link = document.createElement('a');
              link.href = `/api/analysis/${analysisId}/report?format=word`;
              link.download = `analysis_report_${analysisId}.txt`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          >
            <FileText className="w-4 h-4 mr-2" />
            Download Word Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Data Summary</TabsTrigger>
          <TabsTrigger value="descriptive">Descriptive Statistics</TabsTrigger>
          <TabsTrigger value="tests">Statistical Tests</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Analysis</TabsTrigger>
          <TabsTrigger value="regression">Regression</TabsTrigger>
          <TabsTrigger value="visualizations">Visualizations</TabsTrigger>
          <TabsTrigger value="interpretation">AI Interpretation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-medium text-primary mb-4">Dataset Overview</h4>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-secondary">Total Observations:</span>
                  <span className="font-medium">{results.dataOverview.totalObservations}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-secondary">Total Variables:</span>
                  <span className="font-medium">{results.dataOverview.totalVariables}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-secondary">Numerical Variables:</span>
                  <span className="font-medium">{results.dataOverview.numericalVariables}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-secondary">Categorical Variables:</span>
                  <span className="font-medium">{results.dataOverview.categoricalVariables}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-secondary">Missing Values:</span>
                  <span className="font-medium text-error-red">{results.dataOverview.missingValuesPercentage.toFixed(2)}%</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-medium text-primary mb-4">Detected Variables</h4>
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 max-h-64 overflow-y-auto">
                {results.variables.map((variable, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      {variable.type === 'numerical' ? (
                        <BarChart3 className="w-4 h-4 text-ibm-blue" />
                      ) : (
                        <Eye className="w-4 h-4 text-success-green" />
                      )}
                      <span className="text-sm font-medium">{variable.name}</span>
                    </div>
                    <Badge variant={variable.type === 'numerical' ? 'default' : 'secondary'}>
                      {variable.type}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="descriptive" className="space-y-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-300 dark:border-gray-600">
                  <th className="text-left py-2 font-medium text-primary">Variable</th>
                  <th className="text-left py-2 font-medium text-primary">Type</th>
                  <th className="text-right py-2 font-medium text-primary">Count</th>
                  <th className="text-right py-2 font-medium text-primary">Missing</th>
                  <th className="text-right py-2 font-medium text-primary">Mean/Mode</th>
                  <th className="text-right py-2 font-medium text-primary">Std Dev</th>
                </tr>
              </thead>
              <tbody>
                {results.descriptiveStatistics.map((stats, index) => (
                  <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
                    <td className="py-2 text-primary">{stats.variable}</td>
                    <td className="py-2">
                      <Badge variant={stats.type === 'numerical' ? 'default' : 'secondary'}>
                        {stats.type}
                      </Badge>
                    </td>
                    <td className="py-2 text-right text-secondary">{stats.count}</td>
                    <td className="py-2 text-right text-secondary">{stats.missing}</td>
                    <td className="py-2 text-right text-gray-700 dark:text-gray-300">
                      {stats.type === 'numerical' 
                        ? stats.mean?.toFixed(3) || 'N/A'
                        : stats.mode || 'N/A'
                      }
                    </td>
                    <td className="py-2 text-right text-gray-700 dark:text-gray-300">
                      {stats.type === 'numerical' 
                        ? stats.standardDeviation?.toFixed(3) || 'N/A'
                        : Object.keys(stats.frequencies || {}).length
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="tests" className="space-y-6">
          {results.hypothesisTests && results.hypothesisTests.length > 0 ? (
            <div className="space-y-4">
              {results.hypothesisTests.map((test, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-primary">{test.testName}</h5>
                    <Badge variant={test.significant ? "destructive" : "secondary"}>
                      {test.significant ? "Significant" : "Not Significant"}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-secondary">Test Statistic:</span>
                      <p className="font-medium">{test.statistic.toFixed(4)}</p>
                    </div>
                    <div>
                      <span className="text-secondary">p-value:</span>
                      <p className="font-medium">{test.pValue.toFixed(4)}</p>
                    </div>
                    {test.degreesOfFreedom && (
                      <div>
                        <span className="text-secondary">df:</span>
                        <p className="font-medium">{test.degreesOfFreedom}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-secondary">Significance:</span>
                      <p className="font-medium">{test.pValue <= 0.05 ? "p ≤ 0.05" : "p > 0.05"}</p>
                    </div>
                  </div>
                  <p className="text-sm text-secondary mt-2">{test.interpretation}</p>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center text-secondary py-8">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No statistical tests performed</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-medium text-primary mb-4">Normality Tests</h4>
              {results.advancedTests?.normalityTests.map((test, index) => (
                <Card key={index} className="p-4 mb-4">
                  <h5 className="font-medium text-primary mb-2">{test.variable}</h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-secondary">Shapiro-Wilk:</span>
                      <p className="font-medium">{test.shapiroWilk.toFixed(4)}</p>
                    </div>
                    <div>
                      <span className="text-secondary">Jarque-Bera:</span>
                      <p className="font-medium">{test.jarqueBera.toFixed(4)}</p>
                    </div>
                    <div>
                      <span className="text-secondary">p-value:</span>
                      <p className="font-medium">{test.pValue.toFixed(4)}</p>
                    </div>
                    <div>
                      <span className="text-secondary">Distribution:</span>
                      <Badge variant={test.pValue > 0.05 ? "default" : "destructive"}>
                        {test.pValue > 0.05 ? "Normal" : "Non-Normal"}
                      </Badge>
                    </div>
                  </div>
                </Card>
              )) || <p className="text-secondary">No normality tests performed</p>}
            </div>

            <div>
              <h4 className="text-lg font-medium text-primary mb-4">Quality Control Charts</h4>
              {results.qualityControlCharts?.map((chart, index) => (
                <Card key={index} className="p-4 mb-4">
                  <h5 className="font-medium text-primary mb-2">{chart.type.toUpperCase()} Chart</h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-secondary">Center Line:</span>
                      <p className="font-medium">{chart.centerLine.toFixed(3)}</p>
                    </div>
                    <div>
                      <span className="text-secondary">UCL:</span>
                      <p className="font-medium">{chart.upperControlLimit.toFixed(3)}</p>
                    </div>
                    <div>
                      <span className="text-secondary">LCL:</span>
                      <p className="font-medium">{chart.lowerControlLimit.toFixed(3)}</p>
                    </div>
                    <div>
                      <span className="text-secondary">Out of Control:</span>
                      <Badge variant={chart.outOfControlPoints.length > 0 ? "destructive" : "default"}>
                        {chart.outOfControlPoints.length} points
                      </Badge>
                    </div>
                  </div>
                </Card>
              )) || <p className="text-secondary">No quality control charts generated</p>}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="regression" className="space-y-6">
          {results.regressionAnalysis && results.regressionAnalysis.length > 0 ? (
            <div className="space-y-4">
              {results.regressionAnalysis.map((regression, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="font-medium text-primary">{regression.type.toUpperCase()} Regression Model {index + 1}</h5>
                    <Badge variant={regression.pValue <= 0.05 ? "default" : "secondary"}>
                      {regression.pValue <= 0.05 ? "Significant" : "Not Significant"}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-secondary">R²:</span>
                      <p className="font-medium">{regression.rSquared.toFixed(4)}</p>
                    </div>
                    <div>
                      <span className="text-secondary">Adjusted R²:</span>
                      <p className="font-medium">{regression.adjustedRSquared.toFixed(4)}</p>
                    </div>
                    <div>
                      <span className="text-secondary">F-Statistic:</span>
                      <p className="font-medium">{regression.fStatistic.toFixed(4)}</p>
                    </div>
                    <div>
                      <span className="text-secondary">p-value:</span>
                      <p className="font-medium">{regression.pValue.toFixed(4)}</p>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <span className="text-secondary text-sm">Coefficients:</span>
                    <div className="flex space-x-4 mt-1">
                      <span className="text-sm">Intercept: {regression.coefficients[0]?.toFixed(4)}</span>
                      <span className="text-sm">Slope: {regression.coefficients[1]?.toFixed(4)}</span>
                    </div>
                  </div>
                  
                  <div className="text-sm">
                    <span className="text-secondary">Model Equation:</span>
                    <p className="font-mono mt-1">
                      y = {regression.coefficients[0]?.toFixed(4)} + {regression.coefficients[1]?.toFixed(4)}x
                    </p>
                  </div>
                </Card>
              ))}
              
              {results.timeSeriesAnalysis && (
                <Card className="p-4">
                  <h5 className="font-medium text-primary mb-4">Time Series Analysis</h5>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-secondary">Trend:</span>
                      <p className="font-medium capitalize">{results.timeSeriesAnalysis.trend}</p>
                    </div>
                    <div>
                      <span className="text-secondary">Seasonality:</span>
                      <Badge variant={results.timeSeriesAnalysis.seasonality ? "default" : "secondary"}>
                        {results.timeSeriesAnalysis.seasonality ? "Detected" : "Not Detected"}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-secondary">Autocorrelation:</span>
                      <p className="font-medium">{results.timeSeriesAnalysis.autocorrelation[0]?.toFixed(3) || 'N/A'}</p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center text-secondary py-8">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No regression analysis performed</p>
              <p className="text-sm mt-2">Need at least 2 numerical variables for regression analysis</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="visualizations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-medium text-primary mb-4">Available Visualizations</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-ibm-blue" />
                    <span className="text-sm">Histograms</span>
                  </div>
                  <Badge variant="outline">{results.visualizations?.histograms?.length || 0} charts</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-success-green" />
                    <span className="text-sm">Box Plots</span>
                  </div>
                  <Badge variant="outline">{results.visualizations?.boxplots?.length || 0} charts</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Eye className="w-4 h-4 text-purple-600" />
                    <span className="text-sm">Scatter Plots</span>
                  </div>
                  <Badge variant="outline">{results.visualizations?.scatterplots?.length || 0} charts</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-error-red" />
                    <span className="text-sm">Q-Q Plots</span>
                  </div>
                  <Badge variant="outline">{results.visualizations?.qqPlots?.length || 0} charts</Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-ibm-blue" />
                    <span className="text-sm">Control Charts</span>
                  </div>
                  <Badge variant="outline">{results.visualizations?.controlCharts?.length || 0} charts</Badge>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-medium text-primary mb-4">Data Quality Assessment</h4>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-secondary">Overall Data Quality</span>
                    <Badge variant={
                      results.dataOverview.dataQuality === 'excellent' ? 'default' :
                      results.dataOverview.dataQuality === 'good' ? 'secondary' :
                      results.dataOverview.dataQuality === 'fair' ? 'outline' : 'destructive'
                    }>
                      {results.dataOverview.dataQuality?.toUpperCase() || 'UNKNOWN'}
                    </Badge>
                  </div>
                  <div className="text-xs text-secondary">
                    Based on missing values, outliers, and distribution normality
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h5 className="text-sm font-medium text-primary mb-2">EDA Recommendations</h5>
                  <ul className="text-xs text-secondary space-y-1">
                    <li>• Check histogram distributions for skewness</li>
                    <li>• Review box plots for outlier detection</li>
                    <li>• Examine Q-Q plots for normality assessment</li>
                    <li>• Use correlation heatmap for variable relationships</li>
                    <li>• Monitor control charts for process stability</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <div className="text-center text-secondary py-4 border-t">
            <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">All visualization charts will be included in the full PDF report</p>
            <p className="text-xs mt-1">Download the report to view interactive plots and detailed analysis</p>
          </div>
        </TabsContent>

        <TabsContent value="interpretation" className="space-y-6">
          {aiInterpretation ? (
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Bot className="text-ibm-blue" />
                  <h5 className="font-medium text-primary">AI-Powered Interpretation</h5>
                </div>
                <p className="text-secondary">{aiInterpretation.executiveSummary}</p>
              </div>

              <div>
                <h5 className="font-medium text-primary mb-3">Key Findings</h5>
                <ul className="space-y-2">
                  {aiInterpretation.keyFindings.map((finding, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-ibm-blue font-medium">{index + 1}.</span>
                      <span className="text-secondary">{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h5 className="font-medium text-primary mb-3">Statistical Significance</h5>
                <p className="text-secondary">{aiInterpretation.statisticalSignificance}</p>
              </div>

              <div>
                <h5 className="font-medium text-primary mb-3">Practical Implications</h5>
                <p className="text-secondary">{aiInterpretation.practicalImplications}</p>
              </div>

              {aiInterpretation.recommendations && aiInterpretation.recommendations.length > 0 && (
                <div>
                  <h5 className="font-medium text-primary mb-3">Recommendations</h5>
                  <ul className="space-y-2">
                    {aiInterpretation.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-success-green font-medium">•</span>
                        <span className="text-secondary">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-secondary py-8">
              <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>AI interpretation will appear here once analysis is complete</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}
