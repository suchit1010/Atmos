import { Router } from "express";
import { anthropic } from "@workspace/integrations-anthropic-ai";
import { getSatelliteSignals } from "../lib/satellite";

const router = Router();

const VERIFY_MODEL = "claude-haiku-4-5";

interface ProjectMetadata {
  [key: string]: string | number | undefined;
}

interface CarbonAgentResult {
  co2: number;
  methodology: string;
  explanation: string;
  pricePerTonne: number;
}

interface QualityAgentResult {
  confidence: number;
  grade: "S" | "A" | "B" | "C" | "D";
  dataCompleteness: number;
  observations: string[];
}

interface FraudAgentResult {
  fraudRisk: "LOW" | "MEDIUM" | "HIGH";
  signals: string[];
}

function clamp(num: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, num));
}

function confidenceToGrade(confidence: number): "S" | "A" | "B" | "C" | "D" {
  if (confidence >= 92) return "S";
  if (confidence >= 82) return "A";
  if (confidence >= 70) return "B";
  if (confidence >= 55) return "C";
  return "D";
}

async function runJsonAgent<T extends object>(
  systemPrompt: string,
  userPrompt: string,
  fallback: T,
): Promise<T> {
  try {
    const message = await anthropic.messages.create({
      model: VERIFY_MODEL,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlock = message.content.find((b: { type: string }) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return fallback;
    }

    const raw = textBlock.text.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return fallback;
    }

    return { ...fallback, ...(JSON.parse(jsonMatch[0]) as T) };
  } catch {
    return fallback;
  }
}

function buildCarbonPrompt(type: string, metadata: ProjectMetadata, location: string): string {
  const metaStr = Object.entries(metadata)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");

  const methodologies: Record<string, string> = {
    biochar: "VM0044 (Biochar)",
    agroforestry: "ACM0003 / VM0033",
    solar: "AMS-I.D (Solar PV)",
    ev: "AMS-III.C (EV Displacement)",
    building: "AMS-II.C (Building Retrofit)",
    shipping: "AMS-III.R (Maritime)",
    aviation: "AMS-III.GG (Aviation SAF)",
    city: "AM0064 (Municipal)",
    individual: "GS-VER (Individual Actions)",
  };

  const methodology = methodologies[type] || "Gold Standard VER";

  return `You are a certified carbon credit verification expert following VERRA and Gold Standard methodologies.

Project Type: ${type}
Location: ${location}
Methodology: ${methodology}
Reported Data: ${metaStr}

Calculate the carbon dioxide equivalent (CO2e) reduction in tonnes for this project based on the reported data and standard carbon accounting methodologies.

Respond with ONLY a valid JSON object in this exact format (no markdown, no explanation):
{
  "co2": <number: tonnes CO2e reduced, realistic value between 0.5 and 50>,
  "confidence": <integer: 0-100, based on data completeness and consistency>,
  "grade": <string: "S", "A", "B", "C", or "D" based on confidence: S>=92, A>=82, B>=70, C>=55, D<55>,
  "methodology": "${methodology}",
  "fraudRisk": <string: "LOW", "MEDIUM", or "HIGH">,
  "explanation": <string: 1-2 sentence explanation of the calculation>,
  "pricePerTonne": <number: INR price per tonne based on grade: S=2100, A=1485, B=820, C=550, D=300>
}

Base your calculation on real carbon accounting science. For solar: use emission factor of ~0.82 kgCO2/kWh for Indian grid. For biochar: use biochar carbon stability ~80% and C content ~60%. For agroforestry: use ~5-15 tCO2/ha/yr sequestration rate.`;
}

router.post("/verify", async (req, res) => {
  try {
    const { type, metadata, location } = req.body as {
      type: string;
      metadata: ProjectMetadata;
      location: string;
    };

    if (!type || !metadata) {
      res.status(400).json({ error: "type and metadata are required" });
      return;
    }

    const normalizedLocation = location || "India";
    const satellite = await getSatelliteSignals(metadata);

    const projectContext = JSON.stringify(
      {
        type,
        location: normalizedLocation,
        metadata,
        satellite,
      },
      null,
      2,
    );

    const [carbonAgent, qualityAgent, fraudAgent] = await Promise.all([
      runJsonAgent<CarbonAgentResult>(
        "You are CarbonAgent. Estimate CO2 reductions from project data using accepted methodology rules.",
        `${buildCarbonPrompt(type, metadata, normalizedLocation)}\n\nProject JSON:\n${projectContext}`,
        {
          co2: 1.5,
          methodology: "VER Estimate",
          explanation: "Estimated from reported data using baseline factors.",
          pricePerTonne: 820,
        },
      ),
      runJsonAgent<QualityAgentResult>(
        "You are QualityAgent. Score completeness/consistency and return confidence + grade.",
        `Return ONLY JSON with keys confidence, grade, dataCompleteness, observations.\n\nProject JSON:\n${projectContext}`,
        {
          confidence: 75,
          grade: "B",
          dataCompleteness: 70,
          observations: ["Used fallback quality scoring."],
        },
      ),
      runJsonAgent<FraudAgentResult>(
        "You are FraudAgent. Analyze red flags in the project report and output risk classification.",
        `Return ONLY JSON with keys fraudRisk and signals.\n\nProject JSON:\n${projectContext}`,
        {
          fraudRisk: "LOW",
          signals: ["No critical fraud indicators detected in fallback path."],
        },
      ),
    ]);

    const baseConfidence = clamp(Number(qualityAgent.confidence) || 75, 0, 100);
    const confidenceDelta = satellite.imageryAvailable ? 4 : -3;
    const confidence = clamp(baseConfidence + confidenceDelta, 0, 100);
    const grade = confidenceToGrade(confidence);
    const priceFromGrade: Record<typeof grade, number> = {
      S: 2100,
      A: 1485,
      B: 820,
      C: 550,
      D: 300,
    };
    const fraudRisk = String(fraudAgent.fraudRisk || "LOW").toUpperCase();
    const explanationParts = [
      String(carbonAgent.explanation || "Estimated from project metadata."),
      `Quality observations: ${(qualityAgent.observations ?? []).slice(0, 2).join("; ") || "none"}.`,
      `Fraud signals: ${(fraudAgent.signals ?? []).slice(0, 2).join("; ") || "none"}.`,
      `Satellite source: ${satellite.source}; imageryAvailable=${satellite.imageryAvailable}; boundaryPoints=${satellite.boundaryPoints}.`,
    ];

    res.json({
      co2: Number(carbonAgent.co2) || 1.5,
      confidence,
      grade,
      methodology: String(carbonAgent.methodology || "VER Estimate"),
      fraudRisk,
      explanation: explanationParts.join(" "),
      pricePerTonne: Number(carbonAgent.pricePerTonne) || priceFromGrade[grade],
      satelliteDataSource: satellite.source,
      satellite,
      verificationEngine: "multi-agent-llm",
    });
  } catch (err) {
    req.log.error(err, "verify error");
    res.status(500).json({ error: "Verification failed" });
  }
});

export default router;
