
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, CheckCircle, AlertCircle, Download, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface AnalysisProgressProps {
  analysisId: number | null;
}

export default function AnalysisProgress({ analysisId }: AnalysisProgressProps) {
  const queryResult = useQuery({
    queryKey: ["/api/analysis", analysisId],
    enabled: !!analysisId,
  });

  const { data: analysis, isLoading, refetch } = queryResult;

  // Set up conditional polling after the query is established
  const shouldPoll = analysis?.status === "processing";
  
  const pollingQuery = useQuery({
    queryKey: ["/api/analysis", analysisId, "polling"],
    enabled: !!analysisId && shouldPoll,
    refetchInterval: shouldPoll ? 3000 : false,
    queryFn: () => fetch(`/api/analysis/${analysisId}`).then(res => res.json()),
  });

  // Use polling data if available, otherwise use main query data
  const currentAnalysis = pollingQuery.data || analysis;

  if (!analysisId || isLoading) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
          <Clock className="text-ibm-blue mr-2" />
          Analysis Pipeline
        </h3>
        <div className="text-center text-secondary py-8">
          <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Upload a file to start analysis</p>
        </div>
      </Card>
    );
  }

  const getStepStatus = (step: number) => {
    if (!currentAnalysis) return "pending";
    
    if (currentAnalysis.status === "failed") return "failed";
    if (currentAnalysis.status === "completed") return "completed";
    if (currentAnalysis.status === "processing") {
      return step <= 2 ? "completed" : "processing";
    }
    return "pending";
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-success-green" />;
      case "processing":
        return <Clock className="w-5 h-5 text-ibm-blue animate-pulse" />;
      case "failed":
        return <AlertCircle className="w-5 h-5 text-error-red" />;
      default:
        return <Clock className="w-5 h-5 text-secondary" />;
    }
  };

  const steps = [
    { label: "File Upload", description: "Processing uploaded file" },
    { label: "Data Parsing", description: "Extracting and validating data" },
    { label: "Statistical Analysis", description: "Running statistical tests" },
    { label: "AI Interpretation", description: "Generating insights" },
    { label: "Report Generation", description: "Creating final report" }
  ];

  const getProgressPercentage = () => {
    if (!currentAnalysis) return 0;
    if (currentAnalysis.status === "completed") return 100;
    if (currentAnalysis.status === "failed") return 0;
    if (currentAnalysis.status === "processing") return 60;
    return 0;
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
        <Clock className="text-ibm-blue mr-2" />
        Analysis Pipeline
      </h3>

      {currentAnalysis && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-secondary">Progress</span>
            <span className="text-sm font-medium">{getProgressPercentage()}%</span>
          </div>
          
          <Progress value={getProgressPercentage()} className="w-full" />
          
          <div className="space-y-3">
            {steps.map((step, index) => {
              const status = getStepStatus(index + 1);
              return (
                <div key={index} className="flex items-center space-x-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                  {getStepIcon(status)}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-primary">{step.label}</p>
                    <p className="text-xs text-secondary">{step.description}</p>
                  </div>
                  <Badge variant={
                    status === "completed" ? "default" :
                    status === "processing" ? "secondary" :
                    status === "failed" ? "destructive" : "outline"
                  }>
                    {status}
                  </Badge>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-primary">File: {currentAnalysis.filename}</p>
                <p className="text-xs text-secondary">Status: {currentAnalysis.status}</p>
              </div>
              <Badge variant={
                currentAnalysis.status === "completed" ? "default" :
                currentAnalysis.status === "processing" ? "secondary" :
                currentAnalysis.status === "failed" ? "destructive" : "outline"
              }>
                {currentAnalysis.status}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {currentAnalysis?.status === "completed" && (
        <div className="mt-6 space-y-2">
          <Button 
            className="w-full bg-success-green hover:bg-green-600"
            asChild
          >
            <a href={`/api/analysis/${analysisId}/report?format=pdf`} download>
              <Download className="w-4 h-4 mr-2" />
              Download PDF Report
            </a>
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            asChild
          >
            <a href={`/api/analysis/${analysisId}/report?format=word`} download>
              <FileText className="w-4 h-4 mr-2" />
              Download Word Report
            </a>
          </Button>
        </div>
      )}

      {currentAnalysis?.status === "failed" && (
        <div className="mt-6">
          <Badge variant="destructive" className="w-full justify-center">
            Analysis Failed: {currentAnalysis.errorMessage}
          </Badge>
        </div>
      )}
    </Card>
  );
}
