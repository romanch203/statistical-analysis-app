import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAnalysisSchema } from "@shared/schema";
import multer from 'multer';
import path from 'path';

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}
import { FileParser } from "./services/fileParser";
import { StatisticalAnalysis } from "./services/statisticalAnalysis";
import { OpenAIService } from "./services/openai";
import { ReportGenerator } from "./services/reportGenerator";

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit
});

const fileParser = new FileParser();
const statisticalAnalysis = new StatisticalAnalysis();
const openaiService = new OpenAIService();
const reportGenerator = new ReportGenerator();

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Upload and analyze file
  app.post("/api/analyze", upload.single('file'), async (req: MulterRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { researchQuestion } = req.body;
      
      // Create analysis record
      const analysisData = {
        filename: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        researchQuestion: researchQuestion || undefined,
      };

      const validatedData = insertAnalysisSchema.parse(analysisData);
      const analysis = await storage.createAnalysis(validatedData);

      // Start background processing
      processAnalysis(analysis.id, req.file.buffer, req.file.originalname, req.file.mimetype, researchQuestion);

      res.json({ 
        message: "File uploaded successfully", 
        analysisId: analysis.id,
        status: "processing"
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Get analysis status and results
  app.get("/api/analysis/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const analysis = await storage.getAnalysis(id);
      
      if (!analysis) {
        return res.status(404).json({ message: "Analysis not found" });
      }

      res.json(analysis);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Download report
  app.get("/api/analysis/:id/report", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const format = req.query.format as string || 'pdf';
      const analysis = await storage.getAnalysis(id);
      
      if (!analysis || analysis.status !== 'completed') {
        return res.status(404).json({ message: "Analysis not found or not completed" });
      }

      if (!analysis.statisticalResults) {
        return res.status(400).json({ message: "No statistical results available" });
      }

      // Generate fresh report
      const reportFileName = await reportGenerator.generateReport(
        analysis,
        analysis.statisticalResults as any,
        JSON.parse(analysis.aiInterpretation || '{}'),
        { format: format as 'pdf' | 'word', includeCharts: true, includeRawData: false }
      );

      // Set appropriate headers and send file
      const filePath = path.join(process.cwd(), 'reports', reportFileName);
      
      if (format === 'pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="analysis_report_${id}.pdf"`);
      } else {
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="analysis_report_${id}.txt"`);
      }
      
      const fs = await import('fs');
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "Report file not found" });
      }
      
      res.sendFile(path.resolve(filePath));
    } catch (error: any) {
      console.error("Report generation error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get all analyses
  app.get("/api/analyses", async (req, res) => {
    try {
      const analyses = await storage.getAllAnalyses();
      res.json(analyses);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Background processing function
async function processAnalysis(
  analysisId: number, 
  fileBuffer: Buffer, 
  fileName: string, 
  mimeType: string,
  researchQuestion?: string
) {
  try {
    // Update status to processing
    await storage.updateAnalysis(analysisId, { status: "processing" });

    // Parse file
    const parsedData = await fileParser.parseFile(fileBuffer, fileName, mimeType);
    
    // Update with data preview
    await storage.updateAnalysis(analysisId, { 
      dataPreview: {
        headers: parsedData.headers,
        sampleData: parsedData.data.slice(0, 10), // First 10 rows
        metadata: parsedData.metadata
      }
    });

    // Perform statistical analysis
    const statisticalResults = statisticalAnalysis.analyzeData(parsedData.data, parsedData.headers);

    // Generate AI interpretation
    const aiInterpretation = await openaiService.interpretStatisticalResults(
      statisticalResults, 
      researchQuestion
    );

    // Update with complete results
    await storage.updateAnalysis(analysisId, {
      status: "completed",
      statisticalResults: statisticalResults as any,
      aiInterpretation: JSON.stringify(aiInterpretation)
    });

  } catch (error: any) {
    console.error(`Analysis ${analysisId} failed:`, error);
    await storage.updateAnalysis(analysisId, {
      status: "failed",
      errorMessage: error.message
    });
  }
}
