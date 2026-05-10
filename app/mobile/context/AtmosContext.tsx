import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export interface Project {
  id: string;
  name: string;
  type: "biochar" | "agroforestry" | "solar" | "ev" | "building" | "shipping" | "aviation" | "city" | "individual";
  location: string;
  status: "draft" | "verifying" | "verified" | "minted" | "sold";
  co2?: number;
  confidence?: number;
  grade?: string;
  fraudRisk?: string;
  proofHash?: string;
  mintAddress?: string;
  createdAt: string;
  metadata: Record<string, string | number>;
  mediaCount: number;
  mediaUris?: string[];
}

export interface Asset {
  id: string;
  projectId: string;
  name: string;
  type: string;
  amount: number;
  grade: string;
  price: number;
  methodology: string;
  vintage: number;
  location: string;
  mintAddress: string;
  proofHash: string;
  available: number;
  seller?: string;
}

export interface Payment {
  id: string;
  assetId: string;
  assetName: string;
  amount: number;
  quantity: number;
  currency: "INR" | "USDC";
  status: "pending" | "processing" | "completed" | "failed";
  dodoPaymentId?: string;
  settlementId?: string;
  settlementStatus?: "pending" | "credit_received" | "minted" | "settled" | "failed";
  grantId?: string;
  txId?: string;
  createdAt: string;
  updatedAt?: string;
}

interface AtmosContextType {
  projects: Project[];
  assets: Asset[];
  payments: Payment[];
  addProject: (p: Omit<Project, "id" | "createdAt">) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  addPayment: (p: Omit<Payment, "id" | "createdAt">) => Payment;
  updatePayment: (id: string, updates: Partial<Payment>) => void;
  getPaymentByDodoId: (dodoPaymentId: string) => Payment | undefined;
  totalCO2: number;
  totalValue: number;
}

const AtmosContext = createContext<AtmosContextType | null>(null);

const BASE58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function toBase58Like(input: string, length = 44): string {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  let out = "";
  let state = hash >>> 0;
  for (let i = 0; i < length; i++) {
    state = Math.imul(state ^ (i * 2654435761), 2246822519) >>> 0;
    out += BASE58_ALPHABET[state % BASE58_ALPHABET.length];
  }
  return out;
}

function normalizeProjectMintAddress(project: Project): string {
  if (project.mintAddress && project.mintAddress.trim().length >= 32) {
    return project.mintAddress;
  }
  return toBase58Like(`${project.id}:${project.createdAt}:${project.name}`);
}

function projectToAsset(project: Project): Asset {
  const amount = Number((project.co2 ?? 0).toFixed(2));
  const grade = project.grade ?? "B";
  const priceFromGrade: Record<string, number> = {
    S: 2100,
    A: 1485,
    B: 820,
    C: 550,
    D: 300,
  };
  const metadataPrice = Number(project.metadata.pricePerTonne);
  const price = Number.isFinite(metadataPrice) && metadataPrice > 0
    ? metadataPrice
    : (priceFromGrade[grade] ?? 820);

  return {
    id: `asset_${project.id}`,
    projectId: project.id,
    name: project.name,
    type: project.type,
    amount,
    grade,
    price,
    methodology: String(project.metadata.methodology ?? "VER Estimate"),
    vintage: new Date().getFullYear(),
    location: project.location,
    mintAddress: normalizeProjectMintAddress(project),
    proofHash: project.proofHash ?? "zk_pending",
    available: Math.max(1, Math.ceil(amount * 10)),
    seller: "Self",
  };
}

const MOCK_PROJECTS: Project[] = [
  {
    id: "proj_001",
    name: "Biochar Batch #824-018",
    type: "biochar",
    location: "Jaipur, Rajasthan, India",
    status: "minted",
    co2: 2.46,
    confidence: 87,
    grade: "A",
    fraudRisk: "LOW",
    proofHash: "zk_79a2b1c...",
    mintAddress: "Sol_Dev_...",
    createdAt: "2025-05-20",
    metadata: { biomassInput: 12500, biocharOutput: 3200, equipmentType: "Retort Kiln" },
    mediaCount: 3,
  },
  {
    id: "proj_002",
    name: "Agroforestry Plot A7",
    type: "agroforestry",
    location: "Surat, Gujarat, India",
    status: "minted",
    co2: 1.88,
    confidence: 91,
    grade: "A",
    fraudRisk: "LOW",
    proofHash: "zk_b4c9d2e...",
    mintAddress: "Sol_Dev_2...",
    createdAt: "2025-05-18",
    metadata: { forestArea: 8500, treeCount: 2400 },
    mediaCount: 4,
  },
  {
    id: "proj_003",
    name: "Solar Farm Maharashtra",
    type: "solar",
    location: "Pune, Maharashtra, India",
    status: "verified",
    co2: 1.12,
    confidence: 78,
    grade: "B",
    fraudRisk: "MEDIUM",
    createdAt: "2025-05-25",
    metadata: { capacity: 50, generation: 85000 },
    mediaCount: 2,
  },
];

const MOCK_ASSETS: Asset[] = [
  {
    id: "asset_001",
    projectId: "proj_001",
    name: "Biochar Production, Rajasthan",
    type: "biochar",
    amount: 2.46,
    grade: "A",
    price: 1485,
    methodology: "VM0044 (Biochar)",
    vintage: 2026,
    location: "Rajasthan",
    mintAddress: "Sol_Dev_...",
    proofHash: "zk_79a2b1c...",
    available: 48,
    seller: "Self",
  },
  {
    id: "asset_002",
    projectId: "proj_002",
    name: "Agroforestry, Gujarat",
    type: "agroforestry",
    amount: 1.88,
    grade: "A",
    price: 945,
    methodology: "ACM0003",
    vintage: 2026,
    location: "Gujarat",
    mintAddress: "Sol_Dev_2...",
    proofHash: "zk_b4c9d2e...",
    available: 30,
    seller: "Self",
  },
  {
    id: "asset_003",
    projectId: "proj_003",
    name: "Solar Energy, Maharashtra",
    type: "solar",
    amount: 1.12,
    grade: "B",
    price: 820,
    methodology: "AMS-I.D",
    vintage: 2026,
    location: "Maharashtra",
    mintAddress: "Sol_Dev_3...",
    proofHash: "zk_c5d1e3f...",
    available: 25,
    seller: "Self",
  },
  {
    id: "asset_004",
    projectId: "ext_001",
    name: "Biochar Production, Karnataka",
    type: "biochar",
    amount: 3.2,
    grade: "A",
    price: 1550,
    methodology: "VM0044 (Biochar)",
    vintage: 2025,
    location: "Karnataka",
    mintAddress: "Sol_Dev_4...",
    proofHash: "zk_d6e2f4g...",
    available: 62,
    seller: "GreenVentures",
  },
  {
    id: "asset_005",
    projectId: "ext_002",
    name: "Mangrove Restoration, Kerala",
    type: "agroforestry",
    amount: 4.1,
    grade: "S",
    price: 2100,
    methodology: "VM0033",
    vintage: 2025,
    location: "Kerala",
    mintAddress: "Sol_Dev_5...",
    proofHash: "zk_e7f3g5h...",
    available: 15,
    seller: "CoastalCarbon",
  },
];

export function AtmosProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const storedProjects = await AsyncStorage.getItem("atmos_projects");
      const storedPayments = await AsyncStorage.getItem("atmos_payments");
      if (storedProjects) {
        const parsed = JSON.parse(storedProjects);
        setProjects([...MOCK_PROJECTS, ...parsed]);
      }
      if (storedPayments) setPayments(JSON.parse(storedPayments));
    } catch {}
  }

  function addProject(p: Omit<Project, "id" | "createdAt">): Project {
    const newProject: Project = {
      ...p,
      id: "proj_" + Date.now().toString(36),
      createdAt: new Date().toISOString().split("T")[0],
    };
    const updated = [...projects, newProject];
    setProjects(updated);
    const userProjects = updated.filter((proj) =>
      !MOCK_PROJECTS.find((m) => m.id === proj.id)
    );
    AsyncStorage.setItem("atmos_projects", JSON.stringify(userProjects));
    return newProject;
  }

  function updateProject(id: string, updates: Partial<Project>) {
    setProjects((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, ...updates } : p));
      const userProjects = updated.filter((proj) =>
        !MOCK_PROJECTS.find((m) => m.id === proj.id)
      );
      AsyncStorage.setItem("atmos_projects", JSON.stringify(userProjects));
      return updated;
    });
  }

  function addPayment(p: Omit<Payment, "id" | "createdAt">): Payment {
    const newPayment: Payment = {
      ...p,
      id: "pay_" + Date.now().toString(36),
      createdAt: new Date().toISOString(),
    };
    const updated = [...payments, newPayment];
    setPayments(updated);
    AsyncStorage.setItem("atmos_payments", JSON.stringify(updated));
    return newPayment;
  }

  function updatePayment(id: string, updates: Partial<Payment>) {
    setPayments((prev) => {
      const updated = prev.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      );
      AsyncStorage.setItem("atmos_payments", JSON.stringify(updated));
      return updated;
    });
  }

  function getPaymentByDodoId(dodoPaymentId: string): Payment | undefined {
    return payments.find((p) => p.dodoPaymentId === dodoPaymentId);
  }

  const totalCO2 = projects
    .filter((p) => p.status === "minted")
    .reduce((sum, p) => sum + (p.co2 || 0), 0);

  const totalValue = totalCO2 * 1247;

  const mintedProjectAssets = projects
    .filter((p) => p.status === "minted")
    .map(projectToAsset);

  const externalMarketplaceAssets = MOCK_ASSETS.filter((a) => a.seller !== "Self");
  const assets = [...mintedProjectAssets, ...externalMarketplaceAssets];

  return (
    <AtmosContext.Provider
      value={{
        projects,
        assets,
        payments,
        addProject,
        updateProject,
        addPayment,
        updatePayment,
        getPaymentByDodoId,
        totalCO2,
        totalValue,
      }}
    >
      {children}
    </AtmosContext.Provider>
  );
}

export function useAtmos() {
  const ctx = useContext(AtmosContext);
  if (!ctx) throw new Error("useAtmos must be used within AtmosProvider");
  return ctx;
}
