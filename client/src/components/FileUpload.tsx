import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, FolderOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface FileUploadProps {
  researchQuestion: string;
  onFileUploaded: (analysisId: number) => void;
}

export default function FileUpload({ researchQuestion, onFileUploaded }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const supportedFormats = [
    { name: "CSV", ext: ".csv" },
    { name: "Excel", ext: ".xlsx,.xls" },
    { name: "PDF", ext: ".pdf" },
    { name: "Word", ext: ".doc,.docx" },
    { name: "Image", ext: ".jpg,.jpeg,.png,.gif" },
  ];

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);
    
    if (file.size > 500 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Maximum file size is 500MB"
      });
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('researchQuestion', researchQuestion || '');

      console.log('Sending FormData with file:', file.name);
      const response = await apiRequest('POST', '/api/analyze', formData);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Upload result:', result);

      toast({
        title: "File uploaded successfully",
        description: "Analysis has started. You can track progress below."
      });

      onFileUploaded(result.analysisId);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message || "Failed to upload file"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div 
      className={`upload-area ${dragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept=".csv,.xlsx,.xls,.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
        onChange={(e) => handleFileSelect(e.target.files)}
        disabled={uploading}
      />
      
      <Upload className="w-16 h-16 text-blue-500 mb-6 mx-auto" />
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Upload Your Data File</h3>
      <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 max-w-lg mx-auto">
        Drag and drop or click to select files. We support CSV, Excel, PDF, Word documents, and images for statistical analysis.
      </p>
      
      <div className="flex justify-center flex-wrap gap-2 mb-4">
        {supportedFormats.map((format) => (
          <Badge key={format.name} variant="outline" className="border-ibm-blue text-ibm-blue">
            {format.name}
          </Badge>
        ))}
      </div>
      
      <Button 
        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-medium"
        disabled={uploading}
        size="lg"
      >
        <FolderOpen className="w-5 h-5 mr-2" />
        {uploading ? "Uploading..." : "Choose File or Drag & Drop"}
      </Button>
      
      <p className="text-base text-gray-500 dark:text-gray-400 mt-4 font-medium">Maximum file size: 500MB</p>
    </div>
  );
}
