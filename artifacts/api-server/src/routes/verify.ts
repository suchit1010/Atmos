import { Router } from "express";
import { anthropic } from "@workspace/integrations-anthropic-ai";

const router = Router();

interface ProjectMetadata {
  [key: string]: string | number | undefined;
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

    const prompt = buildCarbonPrompt(type, metadata, location || "India");

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      res.status(500).json({ error: "No response from AI" });
      return;
    }

    let parsed: Record<string, unknown>;
    try {
      const raw = textBlock.text.trim();
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch {
      res.status(500).json({ error: "Failed to parse AI response", raw: textBlock.text });
      return;
    }

    res.json({
      co2: Number(parsed.co2) || 1.5,
      confidence: Number(parsed.confidence) || 75,
      grade: String(parsed.grade || "B"),
      methodology: String(parsed.methodology || "VER"),
      fraudRisk: String(parsed.fraudRisk || "LOW"),
      explanation: String(parsed.explanation || ""),
      pricePerTonne: Number(parsed.pricePerTonne) || 820,
    });
  } catch (err) {
    req.log.error(err, "verify error");
    res.status(500).json({ error: "Verification failed" });
  }
});

export default router;
