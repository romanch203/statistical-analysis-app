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
      formData.append('researchQuestion', researchQuestion);

      const response = await apiRequest('POST', '/api/analyze', formData);
      const result = await response.json();

      toast({
        title: "File uploaded successfully",
        description: "Analysis has started. You can track progress below."
      });

      onFileUploaded(result.analysisId);
    } catch (error) {
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
      
      <Upload className="text-5xl text-ibm-blue mb-4 mx-auto" />
      <h3 className="text-xl font-semibold text-primary mb-2">Upload Your Data File</h3>
      <p className="text-secondary mb-4">
        Supports CSV, Excel (.xls, .xlsx), PDF, Word (.doc, .docx), Images, and more
      </p>
      
      <div className="flex justify-center flex-wrap gap-2 mb-4">
        {supportedFormats.map((format) => (
          <Badge key={format.name} variant="outline" className="border-ibm-blue text-ibm-blue">
            {format.name}
          </Badge>
        ))}
      </div>
      
      <Button 
        className="bg-ibm-blue hover:bg-ibm-blue-dark"
        disabled={uploading}
      >
        <FolderOpen className="w-4 h-4 mr-2" />
        {uploading ? "Uploading..." : "Choose File or Drag & Drop"}
      </Button>
      
      <p className="text-sm text-secondary mt-2">Maximum file size: 500MB</p>
    </div>
  );
}
