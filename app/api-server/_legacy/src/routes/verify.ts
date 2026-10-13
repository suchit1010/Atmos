import { Router } from "express";
import * as nodeCrypto from "crypto";
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

interface EvidenceImageInput {
  data: string;
  mimeType?: string;
}

interface ImageEvidenceResult {
  verdict: "pass" | "review" | "reject";
  confidence: number;
  reasons: string[];
  signals: string[];
}

interface ValidationSummary {
  validationStatus: "pass" | "review" | "reject";
  requiresManualReview: boolean;
  confidencePenalty: number;
  issues: string[];
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

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function getMetadataNumber(metadata: ProjectMetadata, key: string): number | null {
  return toNumber(metadata[key]);
}

function normalizeEvidenceImages(images: unknown): EvidenceImageInput[] {
  if (!Array.isArray(images)) return [];

  const normalized = images
    .map((image) => {
      if (typeof image === "string") {
        const trimmed = image.trim();
        if (!trimmed) return null;
        if (trimmed.startsWith("data:")) {
          const match = trimmed.match(/^data:([^;]+);base64,(.+)$/);
          if (!match) return null;
          return { mimeType: match[1], data: match[2] };
        }
        return { data: trimmed, mimeType: "image/jpeg" };
      }

      if (!image || typeof image !== "object") return null;
      const raw = image as { data?: unknown; mimeType?: unknown; uri?: unknown; base64?: unknown };
      const dataValue = raw.base64 ?? raw.data ?? raw.uri;
      if (typeof dataValue !== "string" || !dataValue.trim()) return null;

      if (dataValue.startsWith("data:")) {
        const match = dataValue.match(/^data:([^;]+);base64,(.+)$/);
        if (!match) return null;
        return { mimeType: match[1], data: match[2] };
      }

      return {
        data: dataValue.trim(),
        mimeType: typeof raw.mimeType === "string" && raw.mimeType.trim() ? raw.mimeType : "image/jpeg",
      };
    }) as Array<EvidenceImageInput | null>;

  return normalized.filter((image): image is EvidenceImageInput => image !== null && Boolean(image.data));
}

function sha256(input: string): string {
  return nodeCrypto.createHash("sha256").update(input).digest("hex");
}

function analyzeHeuristicEvidence(images: EvidenceImageInput[]): ImageEvidenceResult {
  if (!images.length) {
    return {
      verdict: "reject",
      confidence: 0,
      reasons: ["No evidence images were uploaded."],
      signals: ["missing_images"],
    };
  }

  const hashes = images.map((image) => sha256(image.data));
  const uniqueHashes = new Set(hashes);
  const duplicateCount = images.length - uniqueHashes.size;
  const suspiciousSignals: string[] = [];
  const reasons: string[] = [];
  let confidence = 82;

  if (images.length < 2) {
    confidence -= 10;
    suspiciousSignals.push("single_image_only");
    reasons.push("Only one image was provided for evidence review.");
  }

  if (duplicateCount > 0) {
    confidence -= 18 * duplicateCount;
    suspiciousSignals.push("duplicate_images_detected");
    reasons.push("One or more images are repeated duplicates.");
  }

  const tinyImages = images.filter((image) => image.data.length < 2400).length;
  if (tinyImages > 0) {
    confidence -= 12;
    suspiciousSignals.push("low_detail_images");
    reasons.push("At least one uploaded image is too small or low detail for reliable validation.");
  }

  if (confidence < 20 || (duplicateCount > 0 && images.length <= 2)) {
    return {
      verdict: "reject",
      confidence: clamp(confidence, 0, 100),
      reasons,
      signals: suspiciousSignals,
    };
  }

  if (confidence < 65 || duplicateCount > 0 || tinyImages > 0) {
    return {
      verdict: "review",
      confidence: clamp(confidence, 0, 100),
      reasons: reasons.length ? reasons : ["Uploaded images need manual review."],
      signals: suspiciousSignals,
    };
  }

  return {
    verdict: "pass",
    confidence: clamp(confidence, 0, 100),
    reasons: ["Images passed heuristic evidence checks."],
    signals: ["heuristic_pass"],
  };
}

async function analyzeImageEvidence(
  type: string,
  metadata: ProjectMetadata,
  location: string,
  images: EvidenceImageInput[],
): Promise<ImageEvidenceResult> {
  const heuristic = analyzeHeuristicEvidence(images);
  if (!images.length) return heuristic;

  try {
    const message = await anthropic.messages.create({
      model: VERIFY_MODEL,
      max_tokens: 1200,
      system: [
        "You are ATMOS evidence forensics.",
        "Review the supplied project photos for signs of synthetic generation, screenshots, stock imagery, duplicates, heavy branding overlays, or corruption.",
        "Return only JSON with verdict (pass|review|reject), confidence (0-100), reasons (array of strings), and signals (array of strings).",
      ].join(" "),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  projectType: type,
                  location,
                  metadata,
                  imageCount: images.length,
                  instruction: "Assess whether these images are genuine project evidence for the described carbon asset.",
                },
                null,
                2,
              ),
            },
            ...images.slice(0, 4).map((image) => ({
              type: "image",
              source: {
                type: "base64",
                media_type: image.mimeType ?? "image/jpeg",
                data: image.data,
              },
            })),
          ] as any,
        },
      ],
    });

    const textBlock = message.content.find((block: { type: string }) => block.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return heuristic;
    }

    const raw = textBlock.text.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return heuristic;
    }

    const parsed = JSON.parse(jsonMatch[0]) as Partial<ImageEvidenceResult>;
    const verdict = parsed.verdict === "reject" || parsed.verdict === "review" ? parsed.verdict : "pass";
    const confidence = clamp(Number(parsed.confidence) || heuristic.confidence, 0, 100);
    const reasons = Array.isArray(parsed.reasons) && parsed.reasons.length ? parsed.reasons.map(String) : heuristic.reasons;
    const signals = Array.isArray(parsed.signals) && parsed.signals.length ? parsed.signals.map(String) : heuristic.signals;

    if (verdict === "reject") {
      return { verdict, confidence, reasons, signals };
    }

    if (heuristic.verdict === "reject") {
      return heuristic;
    }

    if (verdict === "review" || heuristic.verdict === "review") {
      return {
        verdict: "review",
        confidence: Math.min(confidence, heuristic.confidence),
        reasons: [...new Set([...reasons, ...heuristic.reasons])],
        signals: [...new Set([...signals, ...heuristic.signals])],
      };
    }

    return {
      verdict: "pass",
      confidence: Math.max(confidence, heuristic.confidence),
      reasons: reasons.length ? reasons : heuristic.reasons,
      signals: signals.length ? signals : heuristic.signals,
    };
  } catch {
    return heuristic;
  }
}

function evaluateDataConsistency(type: string, metadata: ProjectMetadata, satelliteImageryAvailable: boolean): ValidationSummary {
  const issues: string[] = [];
  let penalty = 0;

  const requireBoundary = ["biochar", "agroforestry", "solar", "building", "city"].includes(type);
  if (requireBoundary && !satelliteImageryAvailable) {
    issues.push("Satellite cross-check is unavailable for this project footprint.");
    penalty += 6;
  }

  switch (type) {
    case "biochar": {
      const biomassInput = getMetadataNumber(metadata, "biomassInput");
      const biocharOutput = getMetadataNumber(metadata, "biocharOutput");
      if (biomassInput === null || biocharOutput === null) {
        issues.push("Biochar projects require biomass input and biochar output values.");
        penalty += 14;
      } else {
        if (biocharOutput > biomassInput) {
          issues.push("Biochar output cannot exceed biomass input.");
          penalty += 22;
        }
        if (biocharOutput / Math.max(biomassInput, 1) > 0.65) {
          issues.push("Biochar yield is unusually high for the reported feedstock.");
          penalty += 10;
        }
      }
      break;
    }
    case "agroforestry": {
      const forestArea = getMetadataNumber(metadata, "forestArea");
      const treeCount = getMetadataNumber(metadata, "treeCount");
      const canopyCover = getMetadataNumber(metadata, "canopyCover");
      if (forestArea === null || treeCount === null) {
        issues.push("Agroforestry projects require forest area and tree count.");
        penalty += 14;
      } else {
        const treesPerHectare = treeCount / Math.max(forestArea, 0.01);
        if (treesPerHectare > 5000) {
          issues.push("Tree density is far above normal forestry ranges.");
          penalty += 20;
        }
        if (treesPerHectare < 5) {
          issues.push("Tree density is too low for a credible carbon project.");
          penalty += 12;
        }
      }
      if (canopyCover !== null && (canopyCover < 0 || canopyCover > 100)) {
        issues.push("Canopy cover must be between 0 and 100 percent.");
        penalty += 15;
      }
      break;
    }
    case "solar": {
      const systemCapacity = getMetadataNumber(metadata, "systemCapacity");
      const annualGeneration = getMetadataNumber(metadata, "annualGeneration");
      const panelCount = getMetadataNumber(metadata, "panelCount");
      if (systemCapacity === null || annualGeneration === null) {
        issues.push("Solar projects require system capacity and annual generation.");
        penalty += 18;
      } else {
        const yieldPerKw = annualGeneration / Math.max(systemCapacity, 0.1);
        if (yieldPerKw < 300 || yieldPerKw > 2500) {
          issues.push("Solar generation per kW is outside a credible operating range.");
          penalty += 18;
        }
      }
      if (panelCount !== null && panelCount <= 0) {
        issues.push("Solar projects need at least one panel.");
        penalty += 10;
      }
      break;
    }
    case "building": {
      const preEnergy = getMetadataNumber(metadata, "preEnergy");
      const postEnergy = getMetadataNumber(metadata, "postEnergy");
      if (preEnergy === null || postEnergy === null) {
        issues.push("Building projects require pre- and post-retrofit energy values.");
        penalty += 18;
      } else if (postEnergy >= preEnergy) {
        issues.push("Post-retrofit energy must be lower than the pre-retrofit baseline.");
        penalty += 24;
      }
      break;
    }
    case "ev": {
      const fleetSize = getMetadataNumber(metadata, "fleetSize");
      const annualDistance = getMetadataNumber(metadata, "annualDistance");
      if (fleetSize === null || annualDistance === null) {
        issues.push("EV projects require fleet size and annual distance.");
        penalty += 16;
      }
      break;
    }
    case "shipping": {
      const routesPerYear = getMetadataNumber(metadata, "routesPerYear");
      const distancePerRoute = getMetadataNumber(metadata, "distancePerRoute");
      if (routesPerYear === null || distancePerRoute === null) {
        issues.push("Shipping projects require routes per year and distance per route.");
        penalty += 16;
      }
      break;
    }
    case "aviation": {
      const safBlend = getMetadataNumber(metadata, "safBlend");
      if (safBlend !== null && (safBlend < 0 || safBlend > 100)) {
        issues.push("SAF blend must stay within 0 to 100 percent.");
        penalty += 18;
      }
      break;
    }
    case "city": {
      const populationCovered = getMetadataNumber(metadata, "populationCovered");
      const reductionTarget = getMetadataNumber(metadata, "reductionTarget");
      if (populationCovered === null || reductionTarget === null) {
        issues.push("City initiatives require population covered and reduction target values.");
        penalty += 14;
      }
      break;
    }
    case "individual": {
      const duration = getMetadataNumber(metadata, "duration");
      const carbonGoal = getMetadataNumber(metadata, "carbonGoal");
      if (duration === null || carbonGoal === null) {
        issues.push("Individual actions require duration and monthly reduction goal.");
        penalty += 12;
      }
      break;
    }
    default:
      break;
  }

  const validationStatus: ValidationSummary["validationStatus"] = issues.length === 0 ? "pass" : penalty >= 24 ? "reject" : "review";
  return {
    validationStatus,
    requiresManualReview: validationStatus !== "pass",
    confidencePenalty: clamp(penalty, 0, 40),
    issues,
  };
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

router.post("/verify/evidence", async (req, res) => {
  try {
    const { type, metadata, location, images } = req.body as {
      type: string;
      metadata: ProjectMetadata;
      location: string;
      images?: unknown;
    };

    if (!type || !metadata) {
      res.status(400).json({ error: "type and metadata are required" });
      return;
    }

    const normalizedImages = normalizeEvidenceImages(images);
    const imageResult = await analyzeImageEvidence(type, metadata, location || "India", normalizedImages);

    res.json({
      verdict: imageResult.verdict,
      confidence: imageResult.confidence,
      reasons: imageResult.reasons,
      signals: imageResult.signals,
    });
  } catch (err) {
    req.log.error(err, "evidence verify error");
    res.status(500).json({ error: "Evidence verification failed" });
  }
});

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

    const dataValidation = evaluateDataConsistency(type, metadata, satellite.imageryAvailable);
    const baseConfidence = clamp(Number(qualityAgent.confidence) || 75, 0, 100);
    const confidenceDelta = (satellite.imageryAvailable ? 4 : -3) - dataValidation.confidencePenalty;
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
      dataValidation.issues.length
        ? `Data cross-check issues: ${dataValidation.issues.join(" | ")}.`
        : "Data cross-check passed.",
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
      validationStatus: dataValidation.validationStatus,
      requiresManualReview: dataValidation.requiresManualReview,
      validationIssues: dataValidation.issues,
    });
  } catch (err) {
    req.log.error(err, "verify error");
    res.status(500).json({ error: "Verification failed" });
  }
});

export default router;
