import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ChartLine, Upload, ServerCog, BarChart3, FileText, Bot, Globe, Mail, TrendingUp, Database, Brain } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import AnalysisProgress from "@/components/AnalysisProgress";
import ResultsPreview from "@/components/ResultsPreview";
import { useQuery } from "@tanstack/react-query";

export default function Home() {
  const [researchQuestion, setResearchQuestion] = useState("");
  const [currentAnalysisId, setCurrentAnalysisId] = useState<number | null>(null);
  
  const { data: analyses } = useQuery({
    queryKey: ["/api/analyses"],
  });

  const handleFileUploaded = (analysisId: number) => {
    setCurrentAnalysisId(analysisId);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-background">
      {/* Header */}
      <header className="bg-white dark:bg-card shadow-sm border-b border-border-gray dark:border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <ChartLine className="text-2xl text-ibm-blue" />
                <h1 className="text-xl font-semibold text-primary">StatAnalyzer Pro</h1>
              </div>
              <div className="hidden md:flex items-center space-x-1 text-sm text-secondary">
                <span>Powered by</span>
                <span className="font-medium text-ibm-blue">IBM SPSS</span>
                <span>&</span>
                <span className="font-medium text-ibm-blue">R Studio</span>
                <span>with Automation Workflow</span>
              </div>
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-secondary hover:text-ibm-blue transition-colors">Features</a>
              <a href="#documentation" className="text-secondary hover:text-ibm-blue transition-colors">Documentation</a>
              <Button asChild className="bg-ibm-blue hover:bg-ibm-blue-dark">
                <a href="https://chaudharyroman.com.np" target="_blank">
                  <Globe className="w-4 h-4 mr-2" />
                  Technical Support
                </a>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Hero Section */}
        <Card className="p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-6">Advanced Statistical Analysis Platform</h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
              Upload your data files and get comprehensive statistical analysis with professional SPSS/R-equivalent output, 
              complete with AI-powered insights and publication-ready reports.
            </p>
          </div>
          
          <FileUpload 
            researchQuestion={researchQuestion}
            onFileUploaded={handleFileUploaded}
          />
        </Card>

        {/* Analysis Configuration & Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2">
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-primary mb-6 flex items-center">
                <ServerCog className="text-ibm-blue mr-3" />
                Analysis Configuration
              </h3>
              
              <div className="space-y-6">
                {/* Auto-Detection Status */}
                <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <Brain className="text-ibm-blue" />
                    <div>
                      <h4 className="font-medium text-primary">Intelligent Auto-Detection Enabled</h4>
                      <p className="text-sm text-secondary">System will automatically detect data types, variables, and optimal statistical tests</p>
                    </div>
                  </div>
                </div>

                {/* Analysis Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-border rounded-lg p-4">
                    <h5 className="font-medium text-primary mb-3 flex items-center">
                      <BarChart3 className="text-ibm-blue mr-2" />
                      Descriptive Analysis
                    </h5>
                    <div className="space-y-2 text-sm">
                      <label className="flex items-center space-x-2">
                        <Checkbox defaultChecked />
                        <span>Summary Statistics</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <Checkbox defaultChecked />
                        <span>Distribution Analysis</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <Checkbox defaultChecked />
                        <span>Outlier Detection</span>
                      </label>
                    </div>
                  </div>

                  <div className="border border-border rounded-lg p-4">
                    <h5 className="font-medium text-primary mb-3 flex items-center">
                      <TrendingUp className="text-ibm-blue mr-2" />
                      Inferential Tests
                    </h5>
                    <div className="space-y-2 text-sm">
                      <label className="flex items-center space-x-2">
                        <Checkbox defaultChecked />
                        <span>Hypothesis Testing</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <Checkbox defaultChecked />
                        <span>Correlation Analysis</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <Checkbox defaultChecked />
                        <span>Regression Analysis</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Research Question Input */}
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">Research Question (Optional)</label>
                  <Textarea 
                    value={researchQuestion}
                    onChange={(e) => setResearchQuestion(e.target.value)}
                    rows={3}
                    placeholder="Describe your research question or hypothesis to get more targeted analysis and interpretation..."
                  />
                </div>
              </div>
            </Card>
          </div>

          <AnalysisProgress analysisId={currentAnalysisId} />
        </div>

        {/* Results Preview */}
        {currentAnalysisId && (
          <ResultsPreview analysisId={currentAnalysisId} />
        )}

        {/* Features Section */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/50 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Bot className="text-xl text-ibm-blue" />
            </div>
            <h3 className="text-lg font-semibold text-primary mb-2">AI-Powered Analysis</h3>
            <p className="text-secondary text-sm">Advanced algorithms automatically detect optimal statistical tests and provide intelligent interpretations of results.</p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-950/50 rounded-lg flex items-center justify-center mx-auto mb-4">
              <FileText className="text-xl text-success-green" />
            </div>
            <h3 className="text-lg font-semibold text-primary mb-2">Professional Reports</h3>
            <p className="text-secondary text-sm">Generate publication-ready reports with complete statistical analysis, visualizations, and methodology documentation.</p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-950/50 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Database className="text-xl text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-primary mb-2">SPSS/R Compatible</h3>
            <p className="text-secondary text-sm">Output identical to professional statistical software with the same accuracy and formatting standards.</p>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-card border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <ChartLine className="text-2xl text-ibm-blue" />
                <h3 className="text-xl font-semibold text-primary">StatAnalyzer Pro</h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                Advanced statistical analysis platform powered by IBM SPSS and R Studio with intelligent automation workflow.
                Professional-grade statistical computing for researchers, analysts, and data scientists.
              </p>
              <div className="text-sm text-secondary">
                <p className="mb-2">Powered by IBM SPSS and R Studio with Automation Workflow</p>
                <p>© 2024 ROMAN CHAUDHARY. All rights reserved.</p>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-primary mb-4">Support</h4>
              <ul className="space-y-2 text-secondary">
                <li><a href="#" className="hover:text-ibm-blue transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-ibm-blue transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-ibm-blue transition-colors">Tutorial Videos</a></li>
                <li><a href="https://chaudharyroman.com.np" target="_blank" className="hover:text-ibm-blue transition-colors font-medium">
                  <Globe className="inline w-4 h-4 mr-1" />Technical Support
                </a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-primary mb-4">Contact Developer</h4>
              <div className="space-y-3">
                <a href="https://chaudharyroman.com.np" target="_blank" className="flex items-center text-secondary hover:text-ibm-blue transition-colors">
                  <Globe className="mr-2 w-4 h-4" />
                  chaudharyroman.com.np
                </a>
                <a href="mailto:support@chaudharyroman.com.np" className="flex items-center text-secondary hover:text-ibm-blue transition-colors">
                  <Mail className="mr-2 w-4 h-4" />
                  Technical Support
                </a>
                <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-4">
                  <p className="text-sm text-ibm-blue font-medium">Need help with complex analysis?</p>
                  <p className="text-xs text-secondary">Contact our developer for personalized statistical consulting.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
