import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertCircle, Play, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface AnalysisProgressProps {
  analysisId: number | null;
}

export default function AnalysisProgress({ analysisId }: AnalysisProgressProps) {
  const { data: analysis, isLoading, refetch } = useQuery({
    queryKey: ["/api/analysis", analysisId],
    enabled: !!analysisId,
    refetchInterval: analysis?.status === "processing" ? 3000 : false,
  });

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
    if (!analysis) return "pending";

    switch (step) {
      case 1: // File Upload
        return "completed";
      case 2: // Data Processing
        if (analysis.status === "pending") return "pending";
        if (analysis.status === "processing") return "processing";
        return "completed";
      case 3: // Statistical Analysis
        if (analysis.status === "pending" || analysis.status === "processing") return "pending";
        if (analysis.status === "completed") return "completed";
        if (analysis.status === "failed") return "failed";
        return "pending";
      case 4: // Report Generation
        if (analysis.status === "completed") return "completed";
        return "pending";
      default:
        return "pending";
    }
  };

  const steps = [
    {
      id: 1,
      title: "File Upload",
      description: analysis ? "File uploaded successfully" : "Ready for analysis",
      status: getStepStatus(1)
    },
    {
      id: 2,
      title: "Data Processing", 
      description: analysis?.status === "processing" ? "Processing data..." : "Data processed",
      status: getStepStatus(2)
    },
    {
      id: 3,
      title: "Statistical Analysis",
      description: analysis?.status === "failed" ? analysis.errorMessage || "Analysis failed" : "Statistical tests complete",
      status: getStepStatus(3)
    },
    {
      id: 4,
      title: "Report Generation",
      description: "Ready for download",
      status: getStepStatus(4)
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-6 h-6 text-success-green" />;
      case "processing":
        return <Loader2 className="w-6 h-6 text-ibm-blue animate-spin" />;
      case "failed":
        return <AlertCircle className="w-6 h-6 text-error-red" />;
      default:
        return <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 text-white rounded-full flex items-center justify-center text-sm">{}</div>;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "completed":
        return "status-completed";
      case "processing":
        return "status-processing";
      case "failed":
        return "status-failed";
      default:
        return "status-pending opacity-60";
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
        <Clock className="text-ibm-blue mr-2" />
        Analysis Pipeline
      </h3>

      <div className="space-y-4">
        {steps.map((step) => (
          <div key={step.id} className={`flex items-center space-x-3 p-3 rounded-lg ${getStatusClass(step.status)}`}>
            {getStatusIcon(step.status)}
            <div className="flex-1">
              <p className="text-sm font-medium">{step.title}</p>
              <p className="text-xs opacity-75">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      {analysis?.status === "completed" && (
        <div className="mt-6 space-y-2">
          <Button 
            className="w-full bg-success-green hover:bg-green-600"
            asChild
          >
            <a href={`/api/analysis/${analysisId}/report?format=pdf`} download>
              Download PDF Report
            </a>
          </Button>
          <Button 
            variant="outline" 
            className="w-full"
            asChild
          >
            <a href={`/api/analysis/${analysisId}/report?format=word`} download>
              Download Word Report
            </a>
          </Button>
        </div>
      )}

      {analysis?.status === "failed" && (
        <div className="mt-6">
          <Badge variant="destructive" className="w-full justify-center">
            Analysis Failed: {analysis.errorMessage}
          </Badge>
        </div>
      )}
    </Card>
  );
}