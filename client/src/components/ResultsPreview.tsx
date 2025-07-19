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
    refetchInterval: 2000,
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
            asChild
          >
            <a href={`/api/analysis/${analysisId}/report?format=pdf`} download>
              <Download className="w-4 h-4 mr-2" />
              Download PDF Report
            </a>
          </Button>
          <Button 
            variant="outline"
            asChild
          >
            <a href={`/api/analysis/${analysisId}/report?format=word`} download>
              <FileText className="w-4 h-4 mr-2" />
              Download Word Report
            </a>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Data Summary</TabsTrigger>
          <TabsTrigger value="descriptive">Descriptive Statistics</TabsTrigger>
          <TabsTrigger value="tests">Statistical Tests</TabsTrigger>
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
                    <td className="py-2 text-right text-secondary">
                      {stats.type === 'numerical' 
                        ? stats.mean?.toFixed(3) || 'N/A'
                        : stats.mode || 'N/A'
                      }
                    </td>
                    <td className="py-2 text-right text-secondary">
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

        <TabsContent value="visualizations" className="space-y-6">
          <div className="text-center text-secondary py-8">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Statistical visualizations will be included in the full report</p>
            <p className="text-sm mt-2">Download the PDF report to view all charts and graphs</p>
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
