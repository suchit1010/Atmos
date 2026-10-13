"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { AtmosIcon } from "./AtmosIcon";
import { FirebaseAuthService, FirebaseGoogleUser, sampleGoogleAccounts } from "../services/firebaseAuth";
import { GODS_EYE_KALOL_OBSERVATION, SatelliteLayerData } from "../services/satelliteGodsEye";
import {
  Smartphone,
  Sparkles,
  Wifi,
  Battery,
  Volume2,
  VolumeX,
  Languages,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  SlidersHorizontal,
  Home,
  Layers,
  LineChart,
  Briefcase,
  User,
  Check,
  Clock,
  ArrowRight,
  ArrowUpRight,
  X,
  Camera,
  MapPin,
  Lock,
  Globe,
  HelpCircle,
  Copy,
  Search,
  Leaf,
  Sun,
  Car,
  Building,
  Anchor,
  Plane,
  Download,
  Share2,
  Satellite,
  Eye,
  Flame,
  Target,
  Scan,
  Activity,
  Cpu,
  Shield,
  Radio,
  CheckCheck,
  Upload,
  Image as ImageIcon,
  Wallet,
  CreditCard,
  QrCode,
  DollarSign,
} from "lucide-react";
import {
  DodoPaymentsService,
  DodoCheckoutRequest,
  DodoPaymentSession,
  DodoPaymentResult,
} from "../services/dodoPayments";
import {
  PhantomSolanaService,
  PhantomWalletState,
  DEFAULT_DEVNET_WALLET,
} from "../services/phantomSolanaWallet";

export type ScreenId =
  | "01_welcome"          // 1. Splash / Welcome
  | "02_auth"             // 2. Auth (OTP)
  | "03_home"             // 3. Home Dashboard
  | "04_select_project"   // 4. Select Project Type
  | "05_capture_data"     // 5. Biochar Production / Metrics
  | "06_verification"     // 6. Verification
  | "07_zk_proof"         // 7. ZK Proof
  | "08_credits_issued"   // 8. Credits Issued
  | "09_marketplace"      // 9. Market
  | "10_payment"          // 10. Payment
  | "11_certificate"      // 11. Solana Certificate
  | "12_portfolio"        // 12. Portfolio
  | "13_profile";         // 13. Profile

interface ScreenMeta {
  id: ScreenId;
  number: number;
  title: string;
  badge?: string;
}

export interface ProjectConfig {
  id: string;
  title: string;
  shortTitle: string;
  badge: string;
  icon: any;
  color: string;
  projectName: string;
  location: string;
  coords: string;
  metric1Name: string;
  metric1Unit: string;
  metric1Default: number;
  metric1Min: number;
  metric1Max: number;
  metric1Step: number;
  metric2Name: string;
  metric2Unit: string;
  metric2Default: number;
  metric2Min: number;
  metric2Max: number;
  metric2Step: number;
  calcBadge: string;
  calcLimit: string;
  equipmentDefault: string;
  equipmentOptions: string[];
  satelliteTitle: string;
  satelliteBadge: string;
  satellitePill1: string;
  satellitePill2: string;
  satellitePill3: string;
  photos: { label: string; desc: string; badge: string }[];
  co2Estimated: string;
}

export interface UploadedPhotoItem {
  id: string;
  label: string;
  desc: string;
  badge: string;
  url?: string;
  timestamp: string;
  gps: string;
  aiVerified: boolean;
  algoVerified: boolean;
  aiConfidence: number;
  algoConfidence: number;
  syntheticScore: number;
  aiDetections: string[];
  algoMetrics: { label: string; value: string; match: string }[];
}

export const ALL_PROJECT_CONFIGS: ProjectConfig[] = [
  {
    id: "biochar",
    title: "Biochar production",
    shortTitle: "Biochar",
    badge: "Active Pilot",
    icon: Leaf,
    color: "#276A3C",
    projectName: "Biochar Unit · Kalol",
    location: "Kalol, Gujarat, India",
    coords: "23.2798° N, 72.4984° E",
    metric1Name: "Biomass input",
    metric1Unit: "kg",
    metric1Default: 12500,
    metric1Min: 5000,
    metric1Max: 20000,
    metric1Step: 250,
    metric2Name: "Biochar output",
    metric2Unit: "kg",
    metric2Default: 3200,
    metric2Min: 1000,
    metric2Max: 8000,
    metric2Step: 100,
    calcBadge: "✓ Yield 25.6% · within 45% limit",
    calcLimit: "Max: 45.0%",
    equipmentDefault: "Retort kiln",
    equipmentOptions: [
      "Retort kiln",
      "Kon-Tiki flame curtain",
      "Continuous pyrolysis drum",
      "Gasifier unit",
    ],
    satelliteTitle: "SWIR Thermal & Radar Orbital Audit",
    satelliteBadge: "98.7% MATCH",
    satellitePill1: "SWIR Thermal: 582°C Core ✓",
    satellitePill2: "NDVI Residue: 13.7t Diverted",
    satellitePill3: "SAR Radar: Kiln Echo ✓",
    photos: [
      { label: "P#1", desc: "Cotton stalk biomass aggregation & moisture probe", badge: "Feedstock 11.4% H2O" },
      { label: "P#2", desc: "Pyrolysis chamber 582°C continuous thermal log", badge: "Retort 582°C Core" },
      { label: "P#3", desc: "Certified weighbridge biochar output scale tare", badge: "Mass 3,200 kg" },
    ],
    co2Estimated: "6.439 tCO₂e",
  },
  {
    id: "agroforestry",
    title: "Agroforestry",
    shortTitle: "Agroforestry",
    badge: "NDVI Verified",
    icon: Sparkles,
    color: "#276A3C",
    projectName: "Afforestation Reserve · Wardha",
    location: "Wardha, Maharashtra, India",
    coords: "20.7453° N, 78.6022° E",
    metric1Name: "Afforestation parcel area",
    metric1Unit: "hectares",
    metric1Default: 42.5,
    metric1Min: 10,
    metric1Max: 100,
    metric1Step: 0.5,
    metric2Name: "Saplings planted / survived",
    metric2Unit: "trees",
    metric2Default: 18400,
    metric2Min: 5000,
    metric2Max: 50000,
    metric2Step: 500,
    calcBadge: "✓ Crown density 68.4% · 94.2% survival",
    calcLimit: "Target: >60%",
    equipmentDefault: "Drone LiDAR & Multi-Spectral Sensor",
    equipmentOptions: [
      "Drone LiDAR & Multi-Spectral Sensor",
      "Tree growth caliper IoT array",
      "Soil moisture tensiometer sensor",
      "Canopy hemispherical camera",
    ],
    satelliteTitle: "Sentinel-2 Multi-Spectral NDVI Canopy Delta",
    satelliteBadge: "99.1% MATCH",
    satellitePill1: "NDVI Gain: +0.34 Index ✓",
    satellitePill2: "Canopy Area: 42.5 ha",
    satellitePill3: "Sentinel-2B: Overpass Confirmed",
    photos: [
      { label: "P#1", desc: "Sapling grid layout with RTK-GPS survey stakes", badge: "Teak & Neem 18.4k" },
      { label: "P#2", desc: "Canopy drone orthomosaic high-res multispectral", badge: "NDVI 0.68 Index" },
      { label: "P#3", desc: "Tree trunk caliper girth measurement & baseline", badge: "DBH 14.2 cm Avg" },
    ],
    co2Estimated: "14.200 tCO₂e",
  },
  {
    id: "solar",
    title: "Solar energy",
    shortTitle: "Solar Energy",
    badge: "Grid Connected",
    icon: Sun,
    color: "#D97706",
    projectName: "Bhadla Solar Array #4",
    location: "Bhadla Solar Park, Rajasthan, India",
    coords: "27.5385° N, 71.9174° E",
    metric1Name: "Monthly generation output",
    metric1Unit: "kWh",
    metric1Default: 148200,
    metric1Min: 20000,
    metric1Max: 500000,
    metric1Step: 2000,
    metric2Name: "Installed DC array capacity",
    metric2Unit: "kWp",
    metric2Default: 120,
    metric2Min: 25,
    metric2Max: 500,
    metric2Step: 5,
    calcBadge: "✓ 106.1 tCO₂e avoided · CEA factor 0.716",
    calcLimit: "CUF: 21.4%",
    equipmentDefault: "SMA Sunny Tripower 50kW × 2 + DLMS Meter",
    equipmentOptions: [
      "SMA Sunny Tripower 50kW × 2 + DLMS Meter",
      "Huawei Smart String Inverter 100kW",
      "Enphase Microinverter IQ8 Fleet",
      "Schneider Conext Solar Gateway",
    ],
    satelliteTitle: "Copernicus Solar GHI & Thermal Insolation",
    satelliteBadge: "99.4% MATCH",
    satellitePill1: "GHI Insolation: 5.8 kWh/m² ✓",
    satellitePill2: "Export Meter: 148,200 kWh",
    satellitePill3: "Thermal: No Hotspots ✓",
    photos: [
      { label: "P#1", desc: "Solar panel array string voltage & tilt orientation", badge: "120 kWp Array" },
      { label: "P#2", desc: "Bi-directional export energy meter display", badge: "DLMS 148,200 kWh" },
      { label: "P#3", desc: "Central SCADA inverter telemetry communication", badge: "Modbus Active" },
    ],
    co2Estimated: "106.110 tCO₂e",
  },
  {
    id: "ev_fleet",
    title: "EV fleet",
    shortTitle: "EV Fleet",
    badge: "IoT Telematics",
    icon: Car,
    color: "#2563EB",
    projectName: "Delhi Express EV Logistics Fleet",
    location: "Delhi NCR Logistics Corridor, India",
    coords: "28.6139° N, 77.2090° E",
    metric1Name: "Clean distance logged",
    metric1Unit: "km",
    metric1Default: 84500,
    metric1Min: 10000,
    metric1Max: 250000,
    metric1Step: 1000,
    metric2Name: "Commercial electric fleet size",
    metric2Unit: "e-vans",
    metric2Default: 28,
    metric2Min: 5,
    metric2Max: 100,
    metric2Step: 1,
    calcBadge: "✓ 16,900 L diesel displaced · 45.6 tCO₂e",
    calcLimit: "0.19 kWh/km",
    equipmentDefault: "OBD-II CAN-Bus Transponder + DC Hub",
    equipmentOptions: [
      "OBD-II CAN-Bus Transponder + DC Hub",
      "Geotab Fleet Telematics GO9",
      "Teltonika FMM130 IoT Tracker",
      "ChargePoint 60kW DC Dual Guns",
    ],
    satelliteTitle: "GNSS Fleet Breadcrumb Route Tracking",
    satelliteBadge: "98.9% MATCH",
    satellitePill1: "Trip Paths: 28 Vans Synced ✓",
    satellitePill2: "Odometer: 84,500 km Total",
    satellitePill3: "Depot Charger: Reconciled",
    photos: [
      { label: "P#1", desc: "Commercial e-van delivery fleet depot lineup", badge: "28 Vans Inspected" },
      { label: "P#2", desc: "Digital OBD-II cluster odometer screen verification", badge: "Encrypted Odo" },
      { label: "P#3", desc: "DC Fast Charging hub session power receipt", badge: "16,055 kWh Logged" },
    ],
    co2Estimated: "45.630 tCO₂e",
  },
  {
    id: "building_retrofit",
    title: "Building retrofit",
    shortTitle: "Building Retrofit",
    badge: "Smart Metering",
    icon: Building,
    color: "#059669",
    projectName: "SG Commercial Tower Retrofit",
    location: "Ahmedabad Commercial Hub, Gujarat",
    coords: "23.0338° N, 72.5073° E",
    metric1Name: "Gross floor area retrofitted",
    metric1Unit: "sq.m",
    metric1Default: 18500,
    metric1Min: 2000,
    metric1Max: 60000,
    metric1Step: 500,
    metric2Name: "Monthly electricity reduction",
    metric2Unit: "kWh/mo",
    metric2Default: 42300,
    metric2Min: 5000,
    metric2Max: 150000,
    metric2Step: 1000,
    calcBadge: "✓ 31.4% energy reduction · ASHRAE-14",
    calcLimit: "COP: 6.2 Chiller",
    equipmentDefault: "Mag-Lev Chiller (COP 6.2) + Schneider BMS",
    equipmentOptions: [
      "Mag-Lev Chiller (COP 6.2) + Schneider BMS",
      "Variable Refrigerant Flow (VRF) Heat Pump",
      "Smart IoT Occupancy Dampers",
      "Triple-Glazed Low-E Glazing",
    ],
    satelliteTitle: "Urban Surface Thermal Anomaly IR Scan",
    satelliteBadge: "97.8% MATCH",
    satellitePill1: "Thermal Delta: -4.2°C Roof ✓",
    satellitePill2: "Savings: 42,300 kWh/mo",
    satellitePill3: "BMS Data: Continuous",
    photos: [
      { label: "P#1", desc: "Magnetic levitation high-efficiency chiller plant", badge: "COP 6.2 Certified" },
      { label: "P#2", desc: "FLIR infrared thermography facade heat scan", badge: "Low-E Confirmed" },
      { label: "P#3", desc: "Schneider Smart Power Meter real-time BMS screen", badge: "31.4% Drop" },
    ],
    co2Estimated: "30.280 tCO₂e",
  },
  {
    id: "shipping",
    title: "Shipping",
    shortTitle: "Green Shipping",
    badge: "IMO CORSIA",
    icon: Anchor,
    color: "#0891B2",
    projectName: "MV Ocean Atmos Bulk Carrier",
    location: "Kandla to Singapore Green Corridor",
    coords: "22.9842° N, 70.2185° E",
    metric1Name: "Voyage nautical distance",
    metric1Unit: "NM",
    metric1Default: 3150,
    metric1Min: 500,
    metric1Max: 12000,
    metric1Step: 50,
    metric2Name: "Bio-Methanol bunker fuel swapped",
    metric2Unit: "tonnes",
    metric2Default: 145,
    metric2Min: 20,
    metric2Max: 600,
    metric2Step: 5,
    calcBadge: "✓ 132t HFO avoided · 412 tCO₂e net cut",
    calcLimit: "SFOC: 168 g/kWh",
    equipmentDefault: "Dual-Fuel MAN B&W + Coriolis Meter",
    equipmentOptions: [
      "Dual-Fuel MAN B&W + Coriolis Meter",
      "Rotor Sails Wind-Assistance Rotor",
      "Shaft Generator Variable Frequency Drive",
      "Silicon Hull Antifouling Coating",
    ],
    satelliteTitle: "Orbital Marine AIS Voyage Transponder Tracking",
    satelliteBadge: "99.8% MATCH",
    satellitePill1: "AIS Track: 3,150 NM Verified ✓",
    satellitePill2: "IMO 9824018: Bulk Carrier",
    satellitePill3: "Bunker Note: Certified",
    photos: [
      { label: "P#1", desc: "Bio-methanol bunker barge delivery manifold transfer", badge: "145t Bunker Note" },
      { label: "P#2", desc: "Engine room Coriolis mass flow meter calibration", badge: "Dual-Fuel Log" },
      { label: "P#3", desc: "Satellite AIS ECDIS bridge navigation console screen", badge: "Voyage Sealed" },
    ],
    co2Estimated: "412.000 tCO₂e",
  },
  {
    id: "aviation",
    title: "Aviation",
    shortTitle: "Aviation SAF",
    badge: "SAF Certified",
    icon: Plane,
    color: "#6366F1",
    projectName: "Flight AI-802 SAF Blend Corridor",
    location: "Mumbai (BOM) to Delhi (DEL)",
    coords: "19.0896° N, 72.8656° E",
    metric1Name: "Sector flight distance",
    metric1Unit: "flight km",
    metric1Default: 24200,
    metric1Min: 2000,
    metric1Max: 60000,
    metric1Step: 200,
    metric2Name: "Sustainable Aviation Fuel (SAF) blended",
    metric2Unit: "Liters",
    metric2Default: 18600,
    metric2Min: 2000,
    metric2Max: 80000,
    metric2Step: 200,
    calcBadge: "✓ 20% HEFA-SPK blend · 78.2% lifecycle cut",
    calcLimit: "ASTM D7566",
    equipmentDefault: "Airbus A321neo CFM LEAP-1A + ACARS Hub",
    equipmentOptions: [
      "Airbus A321neo CFM LEAP-1A + ACARS Hub",
      "Boeing 787 GEnx-1B Engine Telemetry",
      "Airport Hydrant Hydrometer Fuel Cart",
      "Electronic Flight Bag (EFB) Datalogger",
    ],
    satelliteTitle: "ADS-B Flight Radar & ACARS Overpass Telemetry",
    satelliteBadge: "99.6% MATCH",
    satellitePill1: "ADS-B Trajectory: BOM-DEL ✓",
    satellitePill2: "SAF Vol: 18,600 Liters",
    satellitePill3: "CORSIA Seal: Approved",
    photos: [
      { label: "P#1", desc: "Airport hydrant fuel truck connected to wing tank", badge: "20% SAF Blend" },
      { label: "P#2", desc: "Cockpit EFB fuel receipt and mass density certificate", badge: "ASTM D7566 PoS" },
      { label: "P#3", desc: "ACARS digital flight management computer printout", badge: "FMC Verified" },
    ],
    co2Estimated: "38.860 tCO₂e",
  },
  {
    id: "city_initiative",
    title: "City initiative",
    shortTitle: "Municipal Waste",
    badge: "Municipal dMRV",
    icon: Home,
    color: "#15803D",
    projectName: "Surat Ward 4 Waste Composting",
    location: "Surat Municipal Solid Waste Plant, Gujarat",
    coords: "21.1702° N, 72.8311° E",
    metric1Name: "Organic wet waste diverted from landfill",
    metric1Unit: "tonnes",
    metric1Default: 340,
    metric1Min: 50,
    metric1Max: 1500,
    metric1Step: 10,
    metric2Name: "Aerobic organic compost produced",
    metric2Unit: "tonnes",
    metric2Default: 68,
    metric2Min: 10,
    metric2Max: 400,
    metric2Step: 5,
    calcBadge: "✓ 285.6 tCO₂e methane avoided · IPCC FOD",
    calcLimit: "Ward #4 SMC",
    equipmentDefault: "In-Vessel Aerobic Composting Drum + RFID Scale",
    equipmentOptions: [
      "In-Vessel Aerobic Composting Drum + RFID Scale",
      "Rotary Trommel Screen Separator",
      "Automated Municipal Weighbridge",
      "Bio-Filter Odor Scrubber",
    ],
    satelliteTitle: "God's Eye Urban Hyperspectral Methane Scan",
    satelliteBadge: "98.5% MATCH",
    satellitePill1: "CH4 Plume: Zero Leakage ✓",
    satellitePill2: "Waste Diverted: 340t",
    satellitePill3: "Landfill Delta: Validated",
    photos: [
      { label: "P#1", desc: "Segregated wet waste collection hopper at municipal facility", badge: "340t Diverted" },
      { label: "P#2", desc: "High-temperature in-vessel composter drum thermals 65°C", badge: "Aerobic 65°C" },
      { label: "P#3", desc: "Electronic RFID weighbridge tare receipt printout", badge: "SMC Ward #4" },
    ],
    co2Estimated: "285.600 tCO₂e",
  },
  {
    id: "individual_action",
    title: "Individual action",
    shortTitle: "Micro-MRV",
    badge: "Micro-Credits",
    icon: User,
    color: "#7C3AED",
    projectName: "Gandhinagar Eco-Home Micro-MRV",
    location: "Gandhinagar, Gujarat, India",
    coords: "23.2156° N, 72.6369° E",
    metric1Name: "Rooftop solar clean generation",
    metric1Unit: "kWh/mo",
    metric1Default: 620,
    metric1Min: 100,
    metric1Max: 2500,
    metric1Step: 20,
    metric2Name: "Electric commuter cycling & EV scooter",
    metric2Unit: "km/mo",
    metric2Default: 480,
    metric2Min: 50,
    metric2Max: 2000,
    metric2Step: 20,
    calcBadge: "✓ 0.584 tCO₂e avoided · Micro-credit eligible",
    calcLimit: "Home Micro-MRV",
    equipmentDefault: "Enphase Solar Gateway + Ather 450X IoT",
    equipmentOptions: [
      "Enphase Solar Gateway + Ather 450X IoT",
      "Smart Home Energy Meter CT Clamp",
      "Apple Health / Strava Commute Tracker",
      "Induction Cooktop Smart Plug",
    ],
    satelliteTitle: "Zero-Knowledge Proof of Residential Micro-Offset",
    satelliteBadge: "99.2% MATCH",
    satellitePill1: "Smart Meter: 620 kWh Logged ✓",
    satellitePill2: "EV Distance: 480 km",
    satellitePill3: "Privacy: Zero PII Leaked",
    photos: [
      { label: "P#1", desc: "Residential rooftop solar panel array inspection", badge: "5 kW Monocrystal" },
      { label: "P#2", desc: "Smart bi-directional electricity meter LCD reading", badge: "620 kWh Export" },
      { label: "P#3", desc: "Electric scooter digital dashboard odometer verification", badge: "Ather 480 km" },
    ],
    co2Estimated: "0.584 tCO₂e",
  },
];

const SCREENS: ScreenMeta[] = [
  { id: "01_welcome", number: 1, title: "Welcome" },
  { id: "02_auth", number: 2, title: "Auth (OTP)" },
  { id: "03_home", number: 3, title: "Home Dashboard", badge: "Core" },
  { id: "04_select_project", number: 4, title: "Select Project" },
  { id: "05_capture_data", number: 5, title: "dMRV Capture Data", badge: "Metrics" },
  { id: "06_verification", number: 6, title: "Verification" },
  { id: "07_zk_proof", number: 7, title: "ZK Proof", badge: "Solana" },
  { id: "08_credits_issued", number: 8, title: "Credits Issued" },
  { id: "09_marketplace", number: 9, title: "Market" },
  { id: "10_payment", number: 10, title: "Payment", badge: "Dodo" },
  { id: "11_certificate", number: 11, title: "Solana Certificate" },
  { id: "12_portfolio", number: 12, title: "Portfolio" },
  { id: "13_profile", number: 13, title: "Profile" },
];

export function AtmosMobileExperience() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>("03_home");
  const [lang, setLang] = useState<"en" | "hi" | "gu">("en");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [period, setPeriod] = useState<"W" | "M" | "Y">("M");
  const [otp, setOtp] = useState(["2", "4", "7", "9", "1", ""]);
  const [biomassInput, setBiomassInput] = useState(12500);
  const [biocharOutput, setBiocharOutput] = useState(3200);
  const [equipmentType, setEquipmentType] = useState("Retort kiln");
  const [paymentMethod, setPaymentMethod] = useState<"dodo_upi" | "dodo_card" | "phantom_solana">("dodo_upi");

  // Solana & Phantom Web3 Wallet state
  const [walletState, setWalletState] = useState<PhantomWalletState>(DEFAULT_DEVNET_WALLET);
  const [showWalletModal, setShowWalletModal] = useState(false);

  // Dodo Payments state
  const [dodoActiveSession, setDodoActiveSession] = useState<DodoPaymentSession | null>(null);
  const [dodoCheckoutTab, setDodoCheckoutTab] = useState<"upi" | "card" | "netbanking">("upi");
  const [dodoUpiTimer, setDodoUpiTimer] = useState(299);
  const [dodoCardNumber, setDodoCardNumber] = useState("4242 •••• •••• 4242");
  const [dodoCardExpiry, setDodoCardExpiry] = useState("12/28");
  const [dodoCardCvv, setDodoCardCvv] = useState("883");
  const [dodoCardHolder, setDodoCardHolder] = useState("Ramesh Patel");
  const [isDodoProcessing, setIsDodoProcessing] = useState(false);
  const [portfolioTab, setPortfolioTab] = useState<"holdings" | "history" | "impact">("holdings");

  // User Profile & Firebase Google Auth state
  const [currentUser, setCurrentUser] = useState<FirebaseGoogleUser>(sampleGoogleAccounts[0]);
  const [googleAuthLoading, setGoogleAuthLoading] = useState(false);
  const [showGoogleAccountPicker, setShowGoogleAccountPicker] = useState(false);
  const [showAppleAuthModal, setShowAppleAuthModal] = useState(false);
  const [otpTimer, setOtpTimer] = useState(28);
  const [authToast, setAuthToast] = useState<string | null>(null);

  // Home Dashboard interactive features & Animated Gauge
  const [animatedTonnes, setAnimatedTonnes] = useState(0);
  const [carbonGoal, setCarbonGoal] = useState(25);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showActivityDrawer, setShowActivityDrawer] = useState(false);
  const [selectedActivityDetail, setSelectedActivityDetail] = useState<{ title: string; sub: string; metric: string; type: string } | null>(null);

  // Project methodology states for all 9 methodologies
  const [selectedProjectId, setSelectedProjectId] = useState("biochar");
  const [showMethodologyModal, setShowMethodologyModal] = useState<string | null>(null);

  // Dynamic metrics state for all 9 project methodologies
  const [projectMetricValues, setProjectMetricValues] = useState<Record<string, { m1: number; m2: number; eq: string }>>({
    biochar: { m1: 12500, m2: 3200, eq: "Retort kiln" },
    agroforestry: { m1: 42.5, m2: 18400, eq: "Drone LiDAR & Multi-Spectral Sensor" },
    solar: { m1: 148200, m2: 120, eq: "SMA Sunny Tripower 50kW × 2 + DLMS Meter" },
    ev_fleet: { m1: 84500, m2: 28, eq: "OBD-II CAN-Bus Transponder + DC Hub" },
    building_retrofit: { m1: 18500, m2: 42300, eq: "Mag-Lev Chiller (COP 6.2) + Schneider BMS" },
    shipping: { m1: 3150, m2: 145, eq: "Dual-Fuel MAN B&W + Coriolis Meter" },
    aviation: { m1: 24200, m2: 18600, eq: "Airbus A321neo CFM LEAP-1A + ACARS Hub" },
    city_initiative: { m1: 340, m2: 68, eq: "In-Vessel Aerobic Composting Drum + RFID Scale" },
    individual_action: { m1: 620, m2: 480, eq: "Enphase Solar Gateway + Ather 450X IoT" },
  });

  // AI Vision, Photo Upload & "God's Eye View" Satellite Cross-Verification
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [uploadedPhotosByProject, setUploadedPhotosByProject] = useState<Record<string, UploadedPhotoItem[]>>({});
  const [isVerifyingPhoto, setIsVerifyingPhoto] = useState(false);
  const [verificationProgressStep, setVerificationProgressStep] = useState<string>("");
  const [cameraCaptureMode, setCameraCaptureMode] = useState<"upload" | "camera">("upload");
  const [pendingUploadPreview, setPendingUploadPreview] = useState<string | null>(null);
  const [showAiVisionModal, setShowAiVisionModal] = useState(false);
  const [activePhotoInspectionIndex, setActivePhotoInspectionIndex] = useState(0);
  const [showSatelliteGodsEyeModal, setShowSatelliteGodsEyeModal] = useState(false);
  const [satelliteActiveLayer, setSatelliteActiveLayer] = useState<"optical" | "thermal" | "ndvi" | "sar">("optical");
  const [satelliteScanActive, setSatelliteScanActive] = useState(false);

  // Screen 6: Dual-Verifier Consensus & Calculation States
  const [verifier2Approved, setVerifier2Approved] = useState(false);
  const [showCalculationModal, setShowCalculationModal] = useState(false);
  const [showLabReportModal, setShowLabReportModal] = useState(false);

  // Screen 7: Zero-Knowledge Prover States
  const [zkStep, setZkStep] = useState<1 | 2 | 3>(3);
  const [zkWitnessLogOpen, setZkWitnessLogOpen] = useState(false);
  const [zkGenerating, setZkGenerating] = useState(false);

  // Screen 9 & 10: Marketplace & Payment States
  const [marketSearch, setMarketSearch] = useState("");
  const [marketFilter, setMarketFilter] = useState<"all" | "biochar" | "agroforestry">("all");
  const [showListCreditsModal, setShowListCreditsModal] = useState(false);
  const [listPrice, setListPrice] = useState(11100);
  const [listTonnes, setListTonnes] = useState(5.796);
  const [purchaseTonnes, setPurchaseTonnes] = useState(5.0);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [marketListings, setMarketListings] = useState([
    {
      id: "kalol-batch-3",
      title: "Biochar · Kalol, Gujarat",
      batch: "Batch #3 · 6.439 tCO₂e · Vintage 2026",
      pricePerTonne: 11100,
      availableTonnes: 5.796,
      score: "92/100",
      verifiers: 2,
      badge: "Pilot · unrecognised",
      location: "Kalol",
      type: "biochar",
    },
    {
      id: "jaipur-batch-7",
      title: "Biochar · Jaipur, Rajasthan",
      batch: "Batch #7 · 3.100 tCO₂e · Vintage 2026",
      pricePerTonne: 12400,
      availableTonnes: 2.790,
      score: "88/100",
      verifiers: 2,
      badge: "Pilot · unrecognised",
      location: "Jaipur",
      type: "biochar",
    },
    {
      id: "wardha-batch-1",
      title: "Agroforestry · Wardha, Maharashtra",
      batch: "Batch #1 · 14.200 tCO₂e · Vintage 2026",
      pricePerTonne: 13800,
      availableTonnes: 12.000,
      score: "95/100",
      verifiers: 2,
      badge: "Early Access",
      location: "Wardha",
      type: "agroforestry",
    },
  ]);

  // Modals & sub-sheets
  const [showScreenDropdown, setShowScreenDropdown] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showSolanaTxModal, setShowSolanaTxModal] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [showDodoModal, setShowDodoModal] = useState(false);
  const [activeProfileSheet, setActiveProfileSheet] = useState<string | null>(null);

  // Play subtle Apple tactile click sound
  const playHapticSound = (type: "tap" | "success" | "shutter" = "tap") => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === "tap") {
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
      } else if (type === "shutter") {
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
      } else if (type === "success") {
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      }
    } catch (e) {}
  };

  const navigateTo = (screen: ScreenId) => {
    playHapticSound("tap");
    setActiveScreen(screen);
  };

  // Celebration on certificate settlement and credit issuance
  useEffect(() => {
    if (activeScreen === "11_certificate" || activeScreen === "08_credits_issued") {
      playHapticSound("success");
      confetti({
        particleCount: 85,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#35C46A", "#E2F2DF", "#0C150A", "#FFD700"],
      });
    }
  }, [activeScreen]);

  // Animated circular radial gauge count-up upon screen load or period switch
  useEffect(() => {
    if (activeScreen === "03_home") {
      const target = period === "W" ? 4.25 : period === "M" ? 18.0 : 142.5;
      setAnimatedTonnes(0);
      const startTime = performance.now();
      const duration = 1500;
      let frameId: number;

      const animate = (time: number) => {
        const elapsed = time - startTime;
        const progress = Math.min(1, elapsed / duration);
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        setAnimatedTonnes(target * eased);
        if (progress < 1) {
          frameId = requestAnimationFrame(animate);
        }
      };

      frameId = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(frameId);
    }
  }, [activeScreen, period]);

  // Resend OTP countdown timer
  useEffect(() => {
    if (activeScreen === "02_auth") {
      const interval = setInterval(() => {
        setOtpTimer((prev) => (prev > 0 ? prev - 1 : 28));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeScreen]);

  // Handle Firebase Google Sign-In selection
  const handleGoogleSignIn = async (account: FirebaseGoogleUser) => {
    setGoogleAuthLoading(true);
    playHapticSound("tap");
    try {
      const user = await FirebaseAuthService.signInWithGoogle(account);
      setCurrentUser(user);
      playHapticSound("success");
      setAuthToast(`Signed in with Firebase as ${user.displayName}`);
      setTimeout(() => setAuthToast(null), 3500);
      setShowGoogleAccountPicker(false);
      navigateTo("03_home");
    } catch (e) {
      console.error(e);
    } finally {
      setGoogleAuthLoading(false);
    }
  };

  // Handle Apple Sign-In
  const handleAppleSignIn = () => {
    playHapticSound("tap");
    setShowAppleAuthModal(true);
  };


  // Compute live yield percentage
  const yieldPct = ((biocharOutput / biomassInput) * 100).toFixed(1);

  // Active Project configuration accessor for the selected methodology
  const currentProjectConfig =
    ALL_PROJECT_CONFIGS.find((p) => p.id === selectedProjectId) || ALL_PROJECT_CONFIGS[0];
  const currentMetric1 =
    projectMetricValues[selectedProjectId]?.m1 ?? currentProjectConfig.metric1Default;
  const currentMetric2 =
    projectMetricValues[selectedProjectId]?.m2 ?? currentProjectConfig.metric2Default;
  const currentEquipment =
    projectMetricValues[selectedProjectId]?.eq ?? currentProjectConfig.equipmentDefault;

  // Active Project Photos: default verified photos + user uploaded/captured photos
  const currentProjectPhotos: UploadedPhotoItem[] = [
    ...currentProjectConfig.photos.map((p, idx) => ({
      id: `default-${currentProjectConfig.id}-${idx}`,
      label: p.label,
      desc: p.desc,
      badge: p.badge,
      timestamp: "2026-10-12 18:25 UTC",
      gps: currentProjectConfig.coords,
      aiVerified: true,
      algoVerified: true,
      aiConfidence: 99.4,
      algoConfidence: 99.1,
      syntheticScore: 0.00,
      aiDetections: [
        `${currentProjectConfig.shortTitle.toUpperCase()} ASSET CONFIRMED · 99.4%`,
        `CALIBRATION SCALE 1:1 · ZERO LENS DISTORTION`,
        `GENAI / SYNTHETIC ARTIFACTS: 0.00%`
      ],
      algoMetrics: [
        { label: "Orbital Band Reflectance", value: currentProjectConfig.satelliteBadge, match: "MATCHED ✓" },
        { label: "Thermodynamic Assertion", value: currentProjectConfig.calcLimit, match: "PASSED ✓" },
        { label: "Hardware Ed25519 Enclave", value: "Valid Key", match: "SIGNED ✓" }
      ]
    })),
    ...(uploadedPhotosByProject[selectedProjectId] || [])
  ];

  // Currently inspected photo for AI+Algo suite
  const activeInspectedPhoto = currentProjectPhotos[activePhotoInspectionIndex] || currentProjectPhotos[0];

  // Dynamic ZK proof & Solana tokenization values
  const activeZKCommitment = `zk_snark_${selectedProjectId}_${((Math.round(currentMetric1 * 13 + currentMetric2 * 7)) % 899999 + 100000).toString(16)}e904df62`;
  const activeSolanaTxSig = `5ayYk98X2z21QwLa771vM2kZ18bQs8XfVjC${selectedProjectId.slice(0, 3).toUpperCase()}982KLmN5v`;

  // Photo Upload & Verification Handlers
  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setPendingUploadPreview(dataUrl);
      playHapticSound("tap");
    };
    reader.readAsDataURL(file);
  };

  const handleCommitPhotoVerification = (photoDataUrl?: string) => {
    const imgUrl = photoDataUrl || pendingUploadPreview;
    setIsVerifyingPhoto(true);
    playHapticSound("shutter");
    setVerificationProgressStep("1. Gemini 2.5 Multi-Modal Vision Scanning...");

    setTimeout(() => {
      setVerificationProgressStep("2. Algorithmic IoT & Orbital Reflectance Cross-Check...");
      playHapticSound("tap");
    }, 600);

    setTimeout(() => {
      setVerificationProgressStep("3. Formulating Ed25519 Enclave & Solana ZK Witness...");
      playHapticSound("tap");
    }, 1200);

    setTimeout(() => {
      setIsVerifyingPhoto(false);
      setVerificationProgressStep("");
      setPendingUploadPreview(null);
      setShowCameraModal(false);

      const newIndex = currentProjectPhotos.length + 1;
      const newPhotoItem: UploadedPhotoItem = {
        id: `photo-${Date.now()}`,
        label: `P#${newIndex}`,
        desc: `${currentProjectConfig.shortTitle} Field Evidence`,
        badge: "AI+Algo Verified ✓",
        url: imgUrl || undefined,
        timestamp: new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC",
        gps: currentProjectConfig.coords,
        aiVerified: true,
        algoVerified: true,
        aiConfidence: 99.5,
        algoConfidence: 99.2,
        syntheticScore: 0.00,
        aiDetections: [
          `${currentProjectConfig.shortTitle.toUpperCase()} GROUND TRUTH CONFIRMED · 99.5%`,
          `PHYSICAL CAMERA SENSOR: SONY-IMX989 1-INCH ENCLAVE`,
          `GENAI / SYNTHETIC ARTIFACTS: 0.00% (AUTHENTIC PHYSICAL)`
        ],
        algoMetrics: [
          { label: "Orbital Cross-Correlation", value: currentProjectConfig.satelliteBadge, match: "MATCHED ✓" },
          { label: "Thermodynamic Limit Check", value: currentProjectConfig.calcLimit, match: "PASSED ✓" },
          { label: "Hardware Ed25519 Enclave", value: "Valid Key", match: "SIGNED ✓" }
        ]
      };

      setUploadedPhotosByProject((prev) => ({
        ...prev,
        [selectedProjectId]: [...(prev[selectedProjectId] || []), newPhotoItem]
      }));

      setActivePhotoInspectionIndex(currentProjectPhotos.length);
      playHapticSound("success");
      setAuthToast(`Photo P#${newIndex} Verified with AI + Algo (99.5% Match)! Enclave Sealed ✓`);
      setTimeout(() => {
        setAuthToast(null);
        setShowAiVisionModal(true);
      }, 2200);
    }, 1800);
  };

  // Phantom Wallet Web3 Handlers
  const handleConnectPhantom = async () => {
    playHapticSound("tap");
    setWalletState((prev) => ({ ...prev, isConnecting: true }));
    const result = await PhantomSolanaService.connect();
    setWalletState(result.state);
    if (result.success) {
      playHapticSound("success");
      setAuthToast(`Phantom Wallet Connected: ${result.state.shortAddress} (Devnet) ✓`);
      setTimeout(() => setAuthToast(null), 3000);
    }
  };

  const handleDisconnectPhantom = async () => {
    playHapticSound("tap");
    const newState = await PhantomSolanaService.disconnect();
    setWalletState(newState);
    setAuthToast("Phantom Wallet Disconnected");
    setTimeout(() => setAuthToast(null), 2000);
  };

  const handleAirdropDevnetSol = async () => {
    playHapticSound("tap");
    setAuthToast("Requesting 1.0 SOL Devnet Airdrop...");
    const newBal = await PhantomSolanaService.airdropSol(walletState.solBalance);
    setWalletState((prev) => ({ ...prev, solBalance: newBal }));
    playHapticSound("success");
    setAuthToast(`Airdrop Confirmed! New Balance: ${newBal} SOL ✓`);
    setTimeout(() => setAuthToast(null), 3000);
  };

  // Dodo Payments Checkout Handlers
  const handleInitiateDodoPayment = async () => {
    playHapticSound("tap");
    setIsProcessingPayment(true);
    const inrAmt = Math.round(purchaseTonnes * 11100);
    const session = await DodoPaymentsService.createCheckoutSession({
      projectId: selectedProjectId,
      projectName: currentProjectConfig.projectName,
      tonnesCO2e: purchaseTonnes,
      amountINR: inrAmt,
      amountUSD: DodoPaymentsService.inrToUsd(inrAmt),
      currency: "INR",
      customerEmail: currentUser?.email || "buyer@atmos.eco",
      customerName: currentUser?.displayName || "Ramesh Patel",
      paymentMethod: paymentMethod === "dodo_upi" ? "upi" : "card",
      beneficiaryUpi: "rameshp@upi",
    });
    setDodoActiveSession(session);
    setDodoCheckoutTab(paymentMethod === "dodo_card" ? "card" : "upi");
    setIsProcessingPayment(false);
    setShowDodoModal(true);
  };

  const handleConfirmDodoPayment = async () => {
    setIsDodoProcessing(true);
    playHapticSound("tap");
    const inrAmt = Math.round(purchaseTonnes * 11100);
    await DodoPaymentsService.confirmPayment(
      dodoActiveSession?.sessionId || "dodo_demo",
      dodoCheckoutTab === "card" ? "card" : "upi",
      inrAmt
    );
    setTimeout(() => {
      setIsDodoProcessing(false);
      setShowDodoModal(false);
      playHapticSound("success");
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      setAuthToast(`Dodo Escrow Released ₹${inrAmt.toLocaleString("en-IN")} · Certificate Deed Minted on Solana Devnet ✓`);
      setTimeout(() => setAuthToast(null), 3500);
      navigateTo("11_certificate");
    }, 1200);
  };

  // Direct Phantom Solana Pay Execution
  const handlePayWithPhantom = async () => {
    if (!walletState.isConnected) {
      await handleConnectPhantom();
      return;
    }
    setIsProcessingPayment(true);
    playHapticSound("tap");
    const usdcAmt = DodoPaymentsService.inrToUsd(Math.round(purchaseTonnes * 11100));
    await PhantomSolanaService.signAndPayUSDC(
      "AtmoSEscrow1111111111111111111111111111111111",
      usdcAmt,
      purchaseTonnes,
      selectedProjectId
    );
    setIsProcessingPayment(false);
    playHapticSound("success");
    confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } });
    setAuthToast(`Solana Pay: ${usdcAmt} USDC Confirmed on Devnet (Slot #250,231) ✓`);
    setTimeout(() => setAuthToast(null), 3500);
    navigateTo("11_certificate");
  };

  // Helper: renders bottom 5-tab bar on main screens
  const renderBottomNav = (currentTab: "home" | "projects" | "market" | "portfolio" | "profile") => (
    <div className="absolute left-0 right-0 bottom-0 h-[76px] bg-[#F1F1F1] rounded-t-[32px] px-3 flex justify-between items-center shadow-lg border-t border-black/5 z-30 select-none">
      <button
        onClick={() => navigateTo("03_home")}
        className={`flex-1 flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-colors ${
          currentTab === "home" ? "text-[#0C150A]" : "text-[#3F463E] hover:text-[#0C150A]"
        }`}
      >
        <Home size={20} strokeWidth={currentTab === "home" ? 2.5 : 2} />
        <span>Home</span>
      </button>

      <button
        onClick={() => navigateTo("04_select_project")}
        className={`flex-1 flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-colors ${
          currentTab === "projects" ? "text-[#0C150A]" : "text-[#3F463E] hover:text-[#0C150A]"
        }`}
      >
        <Layers size={20} strokeWidth={currentTab === "projects" ? 2.5 : 2} />
        <span>Projects</span>
      </button>

      <button
        onClick={() => navigateTo("09_marketplace")}
        className={`flex-1 flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-colors ${
          currentTab === "market" ? "text-[#0C150A]" : "text-[#3F463E] hover:text-[#0C150A]"
        }`}
      >
        <LineChart size={20} strokeWidth={currentTab === "market" ? 2.5 : 2} />
        <span>Market</span>
      </button>

      <button
        onClick={() => navigateTo("12_portfolio")}
        className={`flex-1 flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-colors ${
          currentTab === "portfolio" ? "text-[#0C150A]" : "text-[#3F463E] hover:text-[#0C150A]"
        }`}
      >
        <Briefcase size={20} strokeWidth={currentTab === "portfolio" ? 2.5 : 2} />
        <span>Portfolio</span>
      </button>

      <button
        onClick={() => navigateTo("13_profile")}
        className={`flex-1 flex flex-col items-center justify-center gap-1 text-[11px] font-bold transition-colors ${
          currentTab === "profile" ? "text-[#0C150A]" : "text-[#3F463E] hover:text-[#0C150A]"
        }`}
      >
        <User size={20} strokeWidth={currentTab === "profile" ? 2.5 : 2} />
        <span>Profile</span>
      </button>
    </div>
  );

  return (
    <div className="relative select-none shrink-0">
      {/* Titanium iPhone 16 Pro Device Frame */}
      <div className="relative w-[390px] h-[844px] bg-[#0C150A] rounded-[52px] p-[10px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.1),inset_0_0_0_2px_rgba(255,255,255,0.12)]">
        {/* Inner Screen Bezel */}
        <div className="relative w-full h-full bg-[#FFFFFF] rounded-[42px] overflow-hidden flex flex-col font-['Inter',sans-serif] text-[#0C150A]">
          
          {/* iOS Dynamic Island & Status Bar */}
          <div className="relative z-40 w-full pt-3 px-7 flex items-center justify-between text-[13px] font-bold tracking-tight text-[#0C150A] select-none">
            <div className="flex items-center gap-2">
              <span>9:41</span>
              {/* Phantom Wallet Web3 Status Pill */}
              <button
                onClick={() => {
                  if (!walletState.isConnected) {
                    handleConnectPhantom();
                  } else {
                    setShowWalletModal(true);
                  }
                }}
                className={`px-1.5 py-0.5 rounded-full text-[8.5px] font-bold font-mono transition-all flex items-center gap-1 shadow-2xs border ${
                  walletState.isConnected
                    ? "bg-[#512da8]/15 border-[#795290]/40 text-[#512da8] hover:bg-[#512da8]/25"
                    : "bg-[#512da8] text-white border-transparent hover:bg-[#4527a0]"
                }`}
                title="Phantom Solana Web3 Wallet"
              >
                <Wallet size={9} />
                <span>{walletState.isConnected ? walletState.shortAddress : "Phantom"}</span>
                {walletState.isConnected && <span className="w-1.5 h-1.5 rounded-full bg-[#35C46A]" />}
              </button>
            </div>

            {/* Dynamic Island Pill with Interactive Screen Jumper */}
            <div
              onClick={() => setShowScreenDropdown(!showScreenDropdown)}
              className="cursor-pointer hover:scale-105 transition-transform absolute left-1/2 -translate-x-1/2 top-2.5 h-[28px] px-3 bg-black rounded-full flex items-center gap-1.5 text-white text-[10px] shadow-md border border-white/10"
              title="Tap to switch between the 13 screens"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#35C46A] animate-pulse" />
              <span className="font-mono text-[9px] text-[#A6E3B8]">
                {SCREENS.find((s) => s.id === activeScreen)?.title || "Atmos"}
              </span>
              <AtmosIcon name="mk" size={12} className="text-[#35C46A]" />
            </div>

            <div className="flex items-center gap-1.5 text-[#0C150A]">
              <Wifi size={13} strokeWidth={2.5} />
              <Battery size={15} strokeWidth={2.5} />
            </div>
          </div>

          {/* Quick Screen Dropdown Switcher (inside phone bezel) */}
          <AnimatePresence>
            {showScreenDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-12 left-4 right-4 z-50 bg-[#0C150A]/95 backdrop-blur-xl border border-white/15 rounded-2xl p-2 shadow-2xl max-h-[460px] overflow-y-auto text-xs"
              >
                <div className="px-2 py-1 text-[10px] uppercase tracking-wider font-extrabold text-[#6FCF97] border-b border-white/10 mb-1">
                  Atmos 13-Screen Userflow Navigation
                </div>
                {SCREENS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      navigateTo(s.id);
                      setShowScreenDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between transition-colors ${
                      activeScreen === s.id
                        ? "bg-[#276A3C] text-white font-bold"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span>{s.number}. {s.title}</span>
                    {activeScreen === s.id && <Check size={14} className="text-[#6FCF97]" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating iOS Toast Notification */}
          <AnimatePresence>
            {authToast && (
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                className="absolute top-12 left-4 right-4 z-50 bg-[#0C150A] text-white px-3.5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-white/15 text-xs font-semibold backdrop-blur-md"
              >
                <div className="w-6 h-6 rounded-full bg-[#35C46A]/20 text-[#35C46A] flex items-center justify-center shrink-0">
                  <Check size={14} />
                </div>
                <span className="flex-1 text-[11px] leading-tight text-white/95">{authToast}</span>
                <button
                  onClick={() => setAuthToast(null)}
                  className="text-white/50 hover:text-white text-xs p-1"
                >
                  ✕
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Screen Content Render Area with Apple Spring Transitions */}
          <div className="relative flex-1 flex flex-col overflow-y-auto overflow-x-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeScreen}
                initial={{ opacity: 0, y: 10, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.99 }}
                  transition={{ type: "spring", stiffness: 380, damping: 28 }}
                  className="flex-1 flex flex-col h-full"
                >
                  {/* ============================================================== */}
                  {/* SCREEN 1: SPLASH / WELCOME (Page 1 in Userflow) */}
                  {/* ============================================================== */}
                  {activeScreen === "01_welcome" && (
                    <div className="flex-1 flex flex-col justify-between p-6 bg-[#E2F2DF]">
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2">
                          <AtmosIcon name="mk" size={32} className="text-[#0C150A]" />
                          <b className="text-2xl font-extrabold text-[#0C150A]">Atmos</b>
                        </div>
                        <button
                          onClick={() => alert("Atmos dMRV Support: Helpline 1800-ATMOS")}
                          className="text-xs font-bold text-[#0C150A] hover:underline"
                        >
                          Help
                        </button>
                      </div>

                      {/* Central Rotating Rosette Motif */}
                      <div className="flex items-center justify-center my-auto">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                          className="text-[#3F463E] opacity-90"
                        >
                          <AtmosIcon name="mk" size={210} />
                        </motion.div>
                      </div>

                      {/* Bottom Copy Area */}
                      <div className="flex flex-col gap-3 pb-2">
                        <div className="flex flex-col gap-1">
                          <h1 className="text-[26px] leading-tight font-extrabold text-[#0C150A]">
                            Evidence you can audit.<br />Credits you can trust.
                          </h1>
                          <p className="text-xs text-[#3F463E] leading-relaxed">
                            Real-world climate action, verified by people and recorded on Solana.
                          </p>
                        </div>

                        {/* Segmented Progress Pill */}
                        <div className="w-24 h-1.5 rounded-full bg-black/15 overflow-hidden my-0.5">
                          <div className="w-[40%] h-full bg-[#0C150A] rounded-full" />
                        </div>

                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => navigateTo("02_auth")}
                          className="w-full h-14 rounded-full bg-[#0C150A] text-white font-extrabold text-base shadow-md hover:bg-black transition-all flex items-center justify-center gap-2"
                        >
                          <span>Get Started</span>
                          <ChevronRight size={18} />
                        </motion.button>
                      </div>
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* SCREEN 2: AUTH / OTP (Page 2 in Userflow) */}
                  {/* ============================================================== */}
                  {activeScreen === "02_auth" && (
                    <div className="flex-1 flex flex-col justify-between p-6 bg-white">
                      <div className="flex flex-col gap-3.5 pt-2">
                        <button
                          onClick={() => navigateTo("01_welcome")}
                          className="w-10 h-10 rounded-full bg-[#F1F1F1] text-[#0C150A] flex items-center justify-center hover:bg-[#E2F2DF] transition-colors"
                        >
                          <ChevronLeft size={20} />
                        </button>

                        <div>
                          <p className="text-xs text-[#3F463E] font-medium">Welcome to</p>
                          <h1 className="text-3xl font-extrabold text-[#0C150A] mt-0.5">Atmos</h1>
                          <p className="text-xs text-[#3F463E] mt-0.5">Sign in to continue</p>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-[#3F463E] block mb-1">
                            Phone number
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="h-12 px-3.5 rounded-2xl bg-[#F7F9F6] border border-black/10 flex items-center font-bold text-xs text-[#0C150A]">
                              IN +91
                            </span>
                            <input
                              type="text"
                              defaultValue="98765 43210"
                              className="flex-1 h-12 px-4 rounded-2xl bg-[#F7F9F6] border border-black/10 font-bold text-sm text-[#0C150A] outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-[#3F463E] block mb-1">
                            Enter code
                          </label>
                          <div className="grid grid-cols-6 gap-2">
                            {otp.map((digit, idx) => (
                              <input
                                key={idx}
                                type="text"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => {
                                  const newOtp = [...otp];
                                  newOtp[idx] = e.target.value;
                                  setOtp(newOtp);
                                  playHapticSound("tap");
                                }}
                                className={`h-12 rounded-xl text-center text-lg font-black outline-none transition-all ${
                                  idx === 4
                                    ? "border-2 border-[#0C150A] bg-white text-[#0C150A] shadow-xs"
                                    : "bg-[#F7F9F6] border border-black/10 text-[#0C150A]"
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-[#3F463E] font-medium">
                          <span>Resend code in 00:{otpTimer < 10 ? `0${otpTimer}` : otpTimer}</span>
                          {otpTimer === 0 && (
                            <button
                              onClick={() => {
                                setOtpTimer(28);
                                playHapticSound("tap");
                                setAuthToast("New OTP code 247910 sent to +91 98765 43210");
                                setTimeout(() => setAuthToast(null), 3000);
                              }}
                              className="text-[#276A3C] font-bold underline"
                            >
                              Resend now
                            </button>
                          )}
                        </div>

                        <div className="relative flex items-center justify-center my-0.5">
                          <div className="border-t border-black/10 w-full" />
                          <span className="bg-white px-3 text-[10px] text-[#3F463E] font-medium absolute">
                            or continue with
                          </span>
                        </div>

                        <div className="flex flex-col gap-2">
                          {/* Firebase Google Auth Button */}
                          <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              playHapticSound("tap");
                              setShowGoogleAccountPicker(true);
                            }}
                            disabled={googleAuthLoading}
                            className="w-full h-11 rounded-2xl border border-black/10 bg-white text-xs font-bold text-[#0C150A] hover:bg-black/5 hover:border-black/20 transition-all flex items-center justify-center gap-2.5 shadow-xs relative"
                          >
                            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                              <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                              />
                              <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                              />
                              <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                              />
                              <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                              />
                            </svg>
                            <span>Continue with Google</span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#E2F2DF] text-[#276A3C] font-extrabold border border-[#276A3C]/20">
                              Firebase
                            </span>
                          </motion.button>

                          {/* Apple Auth Button */}
                          <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={handleAppleSignIn}
                            className="w-full h-11 rounded-2xl border border-black/10 bg-white text-xs font-bold text-[#0C150A] hover:bg-black/5 hover:border-black/20 transition-all flex items-center justify-center gap-2 shadow-xs"
                          >
                            <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 170 170">
                              <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.73-7.98-12.13-14.7-6.53-9.98-11.75-21.57-15.66-34.78-3.91-13.2-5.86-25.56-5.86-37.08 0-14.74 3.59-27.12 10.78-37.13 7.18-10.02 16.33-15.14 27.46-15.37 5.09 0 10.72 1.34 16.89 4.02 6.18 2.68 10.23 4.08 12.15 4.2 2.11-.12 6.38-1.58 12.82-4.38 6.44-2.8 11.97-4.08 16.6-3.85 13.08.68 23.51 5.39 31.3 14.13-11.43 6.94-17.02 16.33-16.76 28.17.26 9.4 3.91 17.3 10.96 23.7 7.05 6.4 15.42 10.09 25.1 11.07-2.3 7.05-5.35 14.53-9.16 22.44zm-30.8-103.35c.12 3.45-.63 6.94-2.25 10.48-1.63 3.53-3.85 6.64-6.66 9.32-2.93 2.81-6.17 4.95-9.72 6.42-2.02.8-4.02 1.3-6.01 1.5-.12-3.45.69-6.91 2.44-10.38 1.74-3.47 3.97-6.52 6.69-9.15 2.85-2.73 6.11-4.83 9.77-6.31 1.95-.78 3.86-1.29 5.74-1.53z" />
                            </svg>
                            <span>Continue with Apple</span>
                          </motion.button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 pb-2">
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => {
                            playHapticSound("success");
                            setAuthToast(`Signed in as ${currentUser.displayName}`);
                            setTimeout(() => setAuthToast(null), 3000);
                            navigateTo("03_home");
                          }}
                          className="w-full h-13 rounded-full bg-[#0C150A] text-white font-extrabold text-base shadow-md hover:bg-black transition-all flex items-center justify-center gap-2"
                        >
                          <span>Verify</span>
                          <ChevronRight size={18} />
                        </motion.button>
                        <p className="text-center text-[10px] text-[#3F463E] leading-relaxed">
                          We never store your Aadhaar number. Your photos are signed on your phone.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* ============================================================== */}
                  {/* SCREEN 3: HOME DASHBOARD (Page 3 in Userflow) */}
                  {/* ============================================================== */}
                  {activeScreen === "03_home" && (
                    <div className="flex-1 flex flex-col justify-between p-5 bg-[#F7F9F6] pb-20">
                      <div className="flex flex-col gap-3.5">
                        {/* Header: User Profile & Carbon Goal */}
                        <div className="flex items-center justify-between pt-1">
                          <div
                            onClick={() => {
                              playHapticSound("tap");
                              setActiveProfileSheet("account");
                            }}
                            className="flex items-center gap-3 cursor-pointer group"
                            title="Tap to manage producer account profile"
                          >
                            <div className="w-11 h-11 rounded-full bg-[#E2F2DF] text-[#0C150A] flex items-center justify-center font-extrabold text-sm border border-black/5 shadow-xs group-hover:scale-105 transition-transform overflow-hidden">
                              {currentUser.photoURL ? (
                                <img
                                  src={currentUser.photoURL}
                                  alt={currentUser.displayName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                currentUser.displayName
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .slice(0, 2)
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h1 className="text-[19px] font-extrabold text-[#0C150A] leading-tight">
                                  Hi, {currentUser.displayName.split(" ")[0]}
                                </h1>
                                <ChevronRight
                                  size={14}
                                  className="text-[#3F463E] opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
                                />
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  playHapticSound("tap");
                                  setShowSetupModal(true);
                                }}
                                className="text-[11px] font-bold text-[#3F463E] hover:text-[#276A3C] flex items-center gap-1 transition-colors"
                              >
                                <span>Setup 80% · ID verified</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-[#35C46A]" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <motion.button
                              whileTap={{ scale: 0.94 }}
                              onClick={() => {
                                playHapticSound("tap");
                                setShowGoalModal(true);
                              }}
                              className="text-[10px] font-bold text-[#0C150A] bg-[#E2F2DF] hover:bg-[#d4ebcf] px-2.5 py-1 rounded-full border border-black/5 shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                              title="Adjust monthly carbon goal"
                            >
                              <Target size={11} className="text-[#276A3C]" />
                              <span>Goal: {carbonGoal} tCO₂e</span>
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.92 }}
                              onClick={() => {
                                playHapticSound("tap");
                                setShowNotificationModal(true);
                              }}
                              className="relative w-9 h-9 rounded-full bg-white border border-[#E2E2E2] text-[#0C150A] flex items-center justify-center shadow-xs hover:border-[#0C150A] transition-colors"
                              title="Notifications & dMRV alerts"
                            >
                              <AtmosIcon name="bl" size={16} />
                              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#35C46A] ring-2 ring-white animate-pulse" />
                            </motion.button>
                          </div>
                        </div>

                        {/* Top KPI Metric Tiles with interactive flows */}
                        <div className="grid grid-cols-3 gap-2">
                          <motion.div
                            whileTap={{ scale: 0.96 }}
                            onClick={() => {
                              playHapticSound("tap");
                              navigateTo("04_select_project");
                            }}
                            className="cursor-pointer bg-white border border-[#E6E6E6] rounded-2xl p-3 flex flex-col gap-1 hover:border-[#0C150A] hover:shadow-xs transition-all"
                            title="Active projects list"
                          >
                            <span className="w-7 h-7 rounded-full bg-[#E2F2DF] text-[#0C150A] flex items-center justify-center">
                              <Layers size={14} />
                            </span>
                            <span className="text-lg font-black text-[#0C150A] leading-tight mt-0.5">3</span>
                            <span className="text-[10px] text-[#3F463E] font-medium leading-tight">Active</span>
                          </motion.div>

                          <motion.div
                            whileTap={{ scale: 0.96 }}
                            onClick={() => {
                              playHapticSound("tap");
                              navigateTo("06_verification");
                            }}
                            className="cursor-pointer bg-white border border-[#E6E6E6] rounded-2xl p-3 flex flex-col gap-1 hover:border-[#0C150A] hover:shadow-xs transition-all"
                            title="Batches in review"
                          >
                            <span className="w-7 h-7 rounded-full bg-[#E2F2DF] text-[#0C150A] flex items-center justify-center">
                              <Clock size={14} />
                            </span>
                            <span className="text-lg font-black text-[#0C150A] leading-tight mt-0.5">2</span>
                            <span className="text-[10px] text-[#3F463E] font-medium leading-tight">Review</span>
                          </motion.div>

                          <motion.div
                            whileTap={{ scale: 0.96 }}
                            onClick={() => {
                              playHapticSound("tap");
                              navigateTo("10_payment");
                            }}
                            className="cursor-pointer bg-[#E2F2DF] rounded-2xl p-3 flex flex-col gap-1 hover:bg-[#d5ebd1] hover:shadow-xs transition-all"
                            title="Total UPI payouts received"
                          >
                            <span className="w-7 h-7 rounded-full bg-[#0C150A] text-white flex items-center justify-center">
                              <Briefcase size={14} />
                            </span>
                            <span className="text-sm font-black text-[#0C150A] leading-tight mt-0.5 truncate">₹22,000</span>
                            <span className="text-[10px] text-[#0C150A] font-bold leading-tight">Paid out</span>
                          </motion.div>
                        </div>

                        {/* Stitch Signature Hero Radial Progress Gauge (Animated on screen load and period switch) */}
                        <div className="bg-white rounded-3xl p-4 border border-black/5 shadow-xs flex flex-col items-center">
                          <div className="w-full flex items-center justify-between mb-2">
                            <div>
                              <p className="text-[11px] text-[#3F463E] font-bold">Your carbon assets</p>
                              <p className="text-xs text-[#8EAA97]">Pilot units · not registry-recognised</p>
                            </div>
                            <div className="flex items-center bg-[#F1F1F1] rounded-full p-0.5">
                              {(["W", "M", "Y"] as const).map((p) => (
                                <button
                                  key={p}
                                  onClick={() => {
                                    setPeriod(p);
                                    playHapticSound("tap");
                                  }}
                                  className={`w-7 h-6 rounded-full text-[10px] font-bold transition-all ${
                                    period === p ? "bg-[#0C150A] text-white shadow-xs" : "text-[#3F463E]"
                                  }`}
                                >
                                  {p}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div
                            onClick={() => {
                              playHapticSound("tap");
                              setShowGoalModal(true);
                            }}
                            className="relative flex justify-center items-center py-1 cursor-pointer group"
                            title="Tap to adjust carbon target"
                          >
                            <svg width="180" height="180" viewBox="0 0 250 250" className="transform -rotate-90">
                              <circle cx="125" cy="125" r="108" fill="none" stroke="#E2F2DF" strokeWidth="16" />
                              <motion.circle
                                key={`gauge-arc-${activeScreen}-${period}-${carbonGoal}`}
                                cx="125"
                                cy="125"
                                r="108"
                                fill="none"
                                stroke="#0C150A"
                                strokeWidth="16"
                                strokeLinecap="round"
                                initial={{ strokeDasharray: "0 678.6" }}
                                animate={{
                                  strokeDasharray: `${(
                                    678.6 *
                                    Math.min(
                                      1,
                                      (period === "W" ? 4.25 / 6.0 : period === "M" ? 18.0 / carbonGoal : 142.5 / 200.0)
                                    )
                                  ).toFixed(1)} 678.6`,
                                }}
                                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                              />
                              <circle
                                cx="125"
                                cy="125"
                                r="86"
                                fill="none"
                                stroke="#C9DEC5"
                                strokeWidth="2.5"
                                strokeDasharray="2 10"
                              />
                            </svg>

                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                              <div className="w-8 h-8 rounded-full bg-[#E2F2DF] text-[#0C150A] flex items-center justify-center mb-0.5 group-hover:scale-110 transition-transform">
                                <AtmosIcon name="mk" size={18} />
                              </div>
                              <span className="text-[10px] text-[#3F463E] font-bold">
                                Verified this {period === "W" ? "week" : period === "M" ? "month" : "year"}
                              </span>
                              <span className="text-2xl font-black text-[#0C150A] tracking-tight">
                                {animatedTonnes.toFixed(3)} t
                              </span>
                              <span className="text-[10px] text-[#276A3C] font-semibold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#35C46A] animate-pulse" />
                                Target: {period === "W" ? "6.0" : period === "M" ? carbonGoal : "200"} tCO₂e
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Recent Activity Section */}
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <h2 className="text-sm font-extrabold text-[#0C150A]">Recent activity</h2>
                            <button
                              onClick={() => {
                                playHapticSound("tap");
                                setShowActivityDrawer(true);
                              }}
                              className="text-[11px] font-bold text-[#276A3C] hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <span>View all</span>
                              <ChevronRight size={12} />
                            </button>
                          </div>

                          <motion.div
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              playHapticSound("tap");
                              navigateTo("11_certificate");
                            }}
                            className="cursor-pointer bg-white p-3 rounded-2xl flex items-center justify-between border border-black/5 hover:border-black/20 transition-all shadow-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-8 h-8 rounded-full bg-[#E2F2DF] text-[#276A3C] flex items-center justify-center font-bold text-xs">
                                ✓
                              </span>
                              <div>
                                <p className="text-xs font-extrabold text-[#0C150A]">Credits issued · Batch #2</p>
                                <p className="text-[10px] text-[#3F463E]">Biochar · Kalol · Solana Minted</p>
                              </div>
                            </div>
                            <span className="text-xs font-black text-[#276A3C]">18.000 t</span>
                          </motion.div>

                          <motion.div
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              playHapticSound("tap");
                              navigateTo("10_payment");
                            }}
                            className="cursor-pointer bg-white p-3 rounded-2xl flex items-center justify-between border border-black/5 hover:border-black/20 transition-all shadow-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-8 h-8 rounded-full bg-[#E2F2DF] text-[#276A3C] flex items-center justify-center">
                                <Briefcase size={14} />
                              </span>
                              <div>
                                <p className="text-xs font-extrabold text-[#0C150A]">Payment received</p>
                                <p className="text-[10px] text-[#3F463E]">UPI Auto-Settlement · HDFC Bank</p>
                              </div>
                            </div>
                            <span className="text-xs font-black text-[#0C150A]">₹22,000</span>
                          </motion.div>

                          <motion.div
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              playHapticSound("tap");
                              navigateTo("06_verification");
                            }}
                            className="cursor-pointer bg-white p-3 rounded-2xl flex items-center justify-between border border-black/5 hover:border-black/20 transition-all shadow-xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-8 h-8 rounded-full bg-[#E2F2DF] text-[#276A3C] flex items-center justify-center">
                                <Clock size={14} />
                              </span>
                              <div>
                                <p className="text-xs font-extrabold text-[#0C150A]">Batch #3 in review</p>
                                <p className="text-[10px] text-[#3F463E]">1 of 2 verifiers approved</p>
                              </div>
                            </div>
                            <span className="text-[11px] font-bold text-[#3F463E]">Today</span>
                          </motion.div>
                        </div>
                      </div>

                      {renderBottomNav("home")}
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* SCREEN 4: SELECT PROJECT TYPE (Page 4 in Userflow) */}
                  {/* ============================================================== */}
                  {activeScreen === "04_select_project" && (
                    <div className="flex-1 flex flex-col justify-between p-5 bg-[#F7F9F6] pb-20 overflow-y-auto">
                      <div className="flex flex-col gap-3.5 pt-2">
                        <div>
                          <div className="flex items-center justify-between">
                            <h1 className="text-2xl font-extrabold text-[#0C150A]">Select project type</h1>
                            <span className="text-[10px] bg-[#E2F2DF] text-[#276A3C] font-extrabold px-2 py-0.5 rounded-full border border-[#276A3C]/20">
                              9 / 9 Active
                            </span>
                          </div>
                          <p className="text-xs text-[#3F463E] mt-1 leading-relaxed">
                            All 9 climate methodologies are active with satellite orbital telemetry, IoT enclave feeds, and dMRV verification.
                          </p>
                        </div>

                        {/* 3x3 Tile Grid - All 9 Methodologies Active */}
                        <div className="grid grid-cols-3 gap-2.5">
                          {ALL_PROJECT_CONFIGS.map((project) => {
                            const IconComp = project.icon;
                            const isSelected = selectedProjectId === project.id;
                            return (
                              <motion.div
                                key={project.id}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                  setSelectedProjectId(project.id);
                                  playHapticSound("tap");
                                }}
                                className={`p-3 rounded-2xl border-2 flex flex-col justify-between aspect-square relative cursor-pointer transition-all ${
                                  isSelected
                                    ? "bg-white border-[#0C150A] shadow-md ring-2 ring-[#0C150A]/10 scale-[1.02]"
                                    : "bg-white border-black/10 hover:border-[#276A3C]/50 hover:shadow-xs"
                                }`}
                              >
                                <div className="flex items-center justify-between w-full">
                                  <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center relative transition-colors ${
                                      isSelected
                                        ? "bg-[#0C150A] text-white"
                                        : "bg-[#F7F9F6] text-[#0C150A] border border-black/5"
                                    }`}
                                  >
                                    <IconComp size={15} />
                                    {isSelected && (
                                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#35C46A] text-[#0C150A] text-[8px] flex items-center justify-center font-bold shadow-xs">
                                        ✓
                                      </span>
                                    )}
                                  </div>
                                  <span
                                    className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold truncate max-w-[54px] ${
                                      isSelected
                                        ? "bg-[#0C150A] text-white"
                                        : "bg-[#E2F2DF] text-[#276A3C]"
                                    }`}
                                    title={project.badge}
                                  >
                                    {project.badge}
                                  </span>
                                </div>

                                <div className="mt-1">
                                  <span className="text-[11px] font-extrabold text-[#0C150A] leading-tight block truncate">
                                    {project.title}
                                  </span>
                                  <span className="text-[9px] text-[#276A3C] font-semibold block mt-0.5 truncate">
                                    {project.location.split(",")[0]}
                                  </span>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="pt-3 pb-2">
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => {
                            playHapticSound("tap");
                            navigateTo("05_capture_data");
                          }}
                          className="w-full h-13 rounded-full bg-[#0C150A] text-white font-extrabold text-base shadow-md hover:bg-black transition-colors flex items-center justify-center gap-2"
                        >
                          <span>Next</span>
                          <ChevronRight size={18} />
                        </motion.button>
                      </div>

                      {renderBottomNav("projects")}
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* SCREEN 5: CAPTURE DATA / METRICS (Page 5 in Userflow) */}
                  {/* ============================================================== */}
                  {activeScreen === "05_capture_data" && (
                    <div className="flex-1 flex flex-col justify-between p-5 bg-[#F7F9F6] overflow-y-auto">
                      <div className="flex flex-col gap-3 pt-1">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <button onClick={() => navigateTo("04_select_project")} className="p-1">
                            <ChevronLeft size={20} />
                          </button>
                          <div className="text-center">
                            <h1 className="text-sm font-extrabold text-[#0C150A]">{currentProjectConfig.title}</h1>
                            <p className="text-[10px] text-[#3F463E] flex items-center justify-center gap-1">
                              <span>3/5 complete</span>
                              <span>·</span>
                              <span className="text-[#276A3C] font-bold">{currentProjectConfig.badge}</span>
                            </p>
                          </div>
                          <button onClick={() => navigateTo("03_home")} className="p-1">
                            <X size={18} />
                          </button>
                        </div>

                        {/* Progress Segments */}
                        <div className="grid grid-cols-5 gap-1.5">
                          <div className="h-1 rounded-full bg-[#0C150A]" />
                          <div className="h-1 rounded-full bg-[#0C150A]" />
                          <div className="h-1 rounded-full bg-[#0C150A]" />
                          <div className="h-1 rounded-full bg-black/10" />
                          <div className="h-1 rounded-full bg-black/10" />
                        </div>

                        {/* Form Card */}
                        <div className="bg-white p-4 rounded-3xl border border-black/5 flex flex-col gap-3 shadow-xs">
                          <div>
                            <span className="text-[10px] text-[#3F463E]">Project name</span>
                            <p className="text-xs font-extrabold text-[#0C150A]">{currentProjectConfig.projectName}</p>
                          </div>

                          <div>
                            <span className="text-[10px] text-[#3F463E]">Location</span>
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-xs font-extrabold text-[#0C150A]">{currentProjectConfig.location}</p>
                              <span className="text-[10px] font-mono font-bold text-[#276A3C] flex items-center gap-1">
                                <MapPin size={12} />
                                {currentProjectConfig.coords}
                              </span>
                            </div>
                            <div
                              onClick={() => {
                                playHapticSound("tap");
                                setShowSatelliteGodsEyeModal(true);
                              }}
                              className="h-16 w-full rounded-2xl bg-[#E2F2DF] relative overflow-hidden flex items-center justify-center border border-[#276A3C]/20 cursor-pointer group"
                              title="Tap to open God's Eye View satellite observation"
                            >
                              <div className="w-full h-2 bg-white/60 transform -rotate-12 absolute" />
                              <div className="w-full h-3 bg-white/40 transform rotate-45 absolute" />
                              <div className="w-5 h-5 rounded-full bg-[#0C150A] text-white flex items-center justify-center shadow-md relative z-10 group-hover:scale-125 transition-transform">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#35C46A] animate-ping" />
                              </div>
                              <span className="absolute bottom-1 right-2 text-[8px] font-bold text-[#276A3C] bg-white/80 backdrop-blur-xs px-1.5 py-0.5 rounded-full font-mono">
                                🛰️ Orbital Lock: {currentProjectConfig.coords.split(',')[0]}
                              </span>
                            </div>
                          </div>

                          {/* Sliders: Domain Specific Metric 1 and Metric 2 */}
                          <div className="space-y-2.5 pt-1 border-t border-black/5">
                            <div className="flex items-center justify-between">
                              <p className="text-[11px] font-bold text-[#3F463E]">Production & dMRV metrics · 2/3</p>
                              <span className="text-[8px] font-mono font-bold text-[#276A3C] bg-[#E2F2DF] px-1.5 py-0.2 rounded-full">
                                IoT Enclave Live
                              </span>
                            </div>

                            <div>
                              <div className="flex justify-between text-xs font-bold mb-0.5">
                                <span>{currentProjectConfig.metric1Name}</span>
                                <span className="text-[#0C150A] font-mono">
                                  {currentMetric1.toLocaleString()} {currentProjectConfig.metric1Unit}
                                </span>
                              </div>
                              <input
                                type="range"
                                min={currentProjectConfig.metric1Min}
                                max={currentProjectConfig.metric1Max}
                                step={currentProjectConfig.metric1Step}
                                value={currentMetric1}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  setProjectMetricValues((prev) => ({
                                    ...prev,
                                    [selectedProjectId]: {
                                      ...prev[selectedProjectId],
                                      m1: val,
                                    },
                                  }));
                                  if (selectedProjectId === "biochar") {
                                    setBiomassInput(val);
                                  }
                                }}
                                className="w-full accent-[#0C150A]"
                              />
                            </div>

                            <div>
                              <div className="flex justify-between text-xs font-bold mb-0.5">
                                <span>{currentProjectConfig.metric2Name}</span>
                                <span className="text-[#0C150A] font-mono">
                                  {currentMetric2.toLocaleString()} {currentProjectConfig.metric2Unit}
                                </span>
                              </div>
                              <input
                                type="range"
                                min={currentProjectConfig.metric2Min}
                                max={currentProjectConfig.metric2Max}
                                step={currentProjectConfig.metric2Step}
                                value={currentMetric2}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  setProjectMetricValues((prev) => ({
                                    ...prev,
                                    [selectedProjectId]: {
                                      ...prev[selectedProjectId],
                                      m2: val,
                                    },
                                  }));
                                  if (selectedProjectId === "biochar") {
                                    setBiocharOutput(val);
                                  }
                                }}
                                className="w-full accent-[#0C150A]"
                              />
                            </div>

                            <p className="text-xs font-bold text-[#276A3C] flex items-center justify-between">
                              <span>{currentProjectConfig.calcBadge}</span>
                              <span className="text-[10px] text-[#3F463E]">{currentProjectConfig.calcLimit}</span>
                            </p>
                          </div>

                          {/* Equipment / Sensor Selection */}
                          <div
                            onClick={() => setShowEquipmentModal(true)}
                            className="cursor-pointer pt-1 border-t border-black/5 hover:opacity-80 transition-opacity"
                          >
                            <span className="text-[10px] text-[#3F463E]">Equipment & Sensor Hardware</span>
                            <div className="flex justify-between items-center text-xs font-extrabold text-[#0C150A] mt-0.5">
                              <span>{currentEquipment}</span>
                              <ChevronRight size={14} />
                            </div>
                          </div>

                          {/* Photos with AI multi-modal inspector & Real Upload */}
                          <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageFileSelect}
                          />
                          <div className="pt-1 border-t border-black/5">
                            <div className="flex justify-between items-center text-[11px] font-bold mb-1.5">
                              <span className="flex items-center gap-1">
                                <span>Evidence photos & Field upload</span>
                                <span className="text-[8px] text-[#276A3C] bg-[#E2F2DF] px-1.5 py-0.2 rounded-full font-bold flex items-center gap-0.5">
                                  <Cpu size={8} /> AI + Algo Verified
                                </span>
                              </span>
                              <span className="text-[#3F463E] font-mono">
                                {currentProjectPhotos.length}/6
                              </span>
                            </div>
                            <div className="grid grid-cols-4 gap-1.5">
                              {currentProjectPhotos.map((photo, i) => (
                                <motion.div
                                  key={photo.id || i}
                                  whileTap={{ scale: 0.94 }}
                                  onClick={() => {
                                    setActivePhotoInspectionIndex(i);
                                    setShowAiVisionModal(true);
                                    playHapticSound("tap");
                                  }}
                                  className="aspect-square rounded-xl bg-[#0C150A] text-white flex flex-col items-center justify-center text-[9px] font-bold cursor-pointer relative group overflow-hidden border border-white/10 hover:border-[#35C46A] transition-all shadow-xs p-1 text-center"
                                  title={`Tap to run AI + Algo cross-verification inspection on ${photo.desc}`}
                                >
                                  {photo.url ? (
                                    <img
                                      src={photo.url}
                                      alt={photo.desc}
                                      className="absolute inset-0 w-full h-full object-cover rounded-xl opacity-60 group-hover:opacity-85 transition-opacity"
                                    />
                                  ) : null}
                                  <div className="relative z-10 flex flex-col items-center">
                                    <span className="text-[9px] font-extrabold">{photo.label}</span>
                                    <span className="text-[7px] text-[#35C46A] flex items-center gap-0.5 font-mono truncate max-w-full">
                                      <Cpu size={7} /> AI+Algo ✓
                                    </span>
                                    <span className="text-[6.5px] text-white/80 truncate max-w-full mt-0.5 font-mono">
                                      {photo.badge}
                                    </span>
                                  </div>
                                  <div className="absolute inset-0 bg-[#35C46A]/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                                    <Eye size={12} className="text-white" />
                                  </div>
                                </motion.div>
                              ))}
                              {currentProjectPhotos.length < 6 && (
                                <motion.div
                                  whileTap={{ scale: 0.95 }}
                                  onClick={() => {
                                    playHapticSound("tap");
                                    setShowCameraModal(true);
                                  }}
                                  className="aspect-square rounded-xl border-2 border-dashed border-[#276A3C]/40 bg-[#E2F2DF]/30 flex flex-col items-center justify-center text-[#0C150A] cursor-pointer hover:bg-[#E2F2DF]/60 transition-colors group"
                                  title="Upload or capture photo evidence for AI + Algo cross-verification"
                                >
                                  <div className="flex items-center gap-1 text-[#276A3C]">
                                    <Upload size={13} />
                                    <Camera size={13} />
                                  </div>
                                  <span className="text-[8px] font-extrabold mt-1 text-[#276A3C]">+ Upload</span>
                                </motion.div>
                              )}
                            </div>
                            <p className="text-[9px] text-[#3F463E] mt-1.5 italic">
                              * Upload field photo or capture camera. AI + Algorithmic engine verifies against God's Eye satellite telemetry.
                            </p>
                          </div>
                        </div>

                        {/* God's Eye View - Satellite Cross-Verification Card */}
                        <motion.div
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            playHapticSound("tap");
                            setShowSatelliteGodsEyeModal(true);
                          }}
                          className="bg-gradient-to-br from-[#0C150A] via-[#112313] to-[#0C150A] text-white p-3.5 rounded-3xl border border-white/10 shadow-lg cursor-pointer hover:border-[#35C46A]/50 transition-all flex flex-col gap-2.5"
                          title="God's Eye View Orbital Cross-Verification"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-8 h-8 rounded-full bg-[#35C46A]/20 text-[#35C46A] flex items-center justify-center border border-[#35C46A]/40 shrink-0">
                                <Satellite size={15} className="animate-pulse" />
                              </span>
                              <div>
                                <span className="text-[12px] font-extrabold text-white flex items-center gap-1.5">
                                  God's Eye View · Satellite dMRV
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#35C46A] animate-ping" />
                                </span>
                                <p className="text-[9px] text-[#A6E3B8]">{currentProjectConfig.satelliteTitle}</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-[#35C46A] bg-[#35C46A]/20 px-2 py-0.5 rounded-full border border-[#35C46A]/40">
                              {currentProjectConfig.satelliteBadge}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-white/10 text-[9px]">
                            <div className="bg-white/5 rounded-xl p-1.5 text-center">
                              <span className="text-white/60 block text-[7.5px] truncate">Primary Orbital Sensor</span>
                              <b className="text-[#35C46A] font-mono text-[8.5px] truncate block">{currentProjectConfig.satellitePill1}</b>
                            </div>
                            <div className="bg-white/5 rounded-xl p-1.5 text-center">
                              <span className="text-white/60 block text-[7.5px] truncate">Multi-Spectral Ground</span>
                              <b className="text-white font-mono text-[8.5px] truncate block">{currentProjectConfig.satellitePill2}</b>
                            </div>
                            <div className="bg-white/5 rounded-xl p-1.5 text-center">
                              <span className="text-white/60 block text-[7.5px] truncate">SAR / Satellite Telemetry</span>
                              <b className="text-white font-mono text-[8.5px] truncate block">{currentProjectConfig.satellitePill3}</b>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[10px] font-bold text-[#A6E3B8] pt-0.5">
                            <span className="flex items-center gap-1">
                              <Eye size={12} />
                              Open God's Eye Orbital Telemetry
                            </span>
                            <ChevronRight size={14} />
                          </div>
                        </motion.div>
                      </div>

                      <div className="pt-3 pb-2">
                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => {
                            playHapticSound("tap");
                            navigateTo("06_verification");
                          }}
                          className="w-full h-13 rounded-full bg-[#0C150A] text-white font-extrabold text-base shadow-md hover:bg-black transition-colors flex items-center justify-center gap-2"
                        >
                          <span>Next</span>
                          <ChevronRight size={18} />
                        </motion.button>
                      </div>
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* SCREEN 6: VERIFICATION REVIEW (Page 6 in Userflow) */}
                  {/* ============================================================== */}
                  {activeScreen === "06_verification" && (
                    <div className="flex-1 flex flex-col justify-between p-5 bg-[#F7F9F6] overflow-y-auto">
                      <div className="flex flex-col gap-3 pt-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h1 className="text-2xl font-extrabold text-[#0C150A]">Verification</h1>
                            <p className="text-xs text-[#3F463E] mt-0.5 leading-relaxed">
                              Dual-verifier independent consensus & automated dMRV
                            </p>
                          </div>
                          <span className="text-[9px] bg-[#E2F2DF] text-[#0C150A] px-2.5 py-1 rounded-full font-bold">
                            {currentProjectConfig.shortTitle} Batch #3
                          </span>
                        </div>

                        {/* Phase Status Card */}
                        <div className="bg-white border border-black/5 rounded-3xl p-4 flex flex-col gap-3 shadow-xs">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-extrabold text-[#0C150A]">
                              {verifier2Approved ? "Phase 3 of 3 · Consensus Achieved ✓" : "Phase 2 of 3 · Verifier Review"}
                            </span>
                            <span className="text-[#276A3C] font-bold">
                              {verifier2Approved ? "100% Ready" : "66% Complete"}
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-black/10 overflow-hidden">
                            <motion.div
                              initial={{ width: "66%" }}
                              animate={{ width: verifier2Approved ? "100%" : "66%" }}
                              transition={{ duration: 0.5 }}
                              className={`h-full rounded-full transition-all ${
                                verifier2Approved ? "bg-[#35C46A]" : "bg-[#0C150A]"
                              }`}
                            />
                          </div>

                          <div className="space-y-3 pt-1">
                            {/* 1. Evidence Checks */}
                            <div className="flex items-start gap-2.5">
                              <span className="w-6 h-6 rounded-full bg-[#E2F2DF] text-[#0C150A] flex items-center justify-center font-bold text-xs shrink-0">
                                ✓
                              </span>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-extrabold text-[#0C150A]">Evidence checks</p>
                                  <span className="text-[9px] font-bold text-[#276A3C]">AI + Satellite</span>
                                </div>
                                <p className="text-[10px] text-[#3F463E]">Automated · 92/100 · Gemini Vision + God's Eye</p>
                                <button
                                  onClick={() => {
                                    playHapticSound("tap");
                                    setShowSatelliteGodsEyeModal(true);
                                  }}
                                  className="mt-1 text-[9px] font-bold text-[#276A3C] hover:underline flex items-center gap-1"
                                >
                                  <Satellite size={10} />
                                  <span>View God's Eye Orbital Telemetry Report ({currentProjectConfig.satelliteBadge})</span>
                                </button>
                              </div>
                            </div>

                            {/* 2. Verifier Consensus Quorum */}
                            <div className="flex items-start gap-2.5">
                              <span
                                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                                  verifier2Approved
                                    ? "bg-[#E2F2DF] text-[#0C150A] font-bold text-xs"
                                    : "bg-[#0C150A] text-[#35C46A]"
                                }`}
                              >
                                {verifier2Approved ? (
                                  "✓"
                                ) : (
                                  <span className="w-2 h-2 rounded-full bg-[#35C46A] animate-pulse" />
                                )}
                              </span>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-extrabold text-[#0C150A]">Verifier Quorum (2 of 2)</p>
                                  <span
                                    className={`text-[9px] font-bold ${
                                      verifier2Approved ? "text-[#276A3C]" : "text-[#D97706]"
                                    }`}
                                  >
                                    {verifier2Approved ? "Consensus 2/2 ✓" : "1/2 Approved"}
                                  </span>
                                </div>

                                {/* Verifier 1 */}
                                <div className="mt-1.5 p-2 rounded-xl bg-[#F7F9F6] border border-black/5 flex items-center justify-between text-[10px]">
                                  <div>
                                    <b className="text-[#0C150A]">1. {currentProjectConfig.shortTitle} Regional Audit Board</b>
                                    <p className="text-[#3F463E]">Dr. K. Mehta · Ed25519 Signed (14:32 UTC)</p>
                                  </div>
                                  <span className="text-[9px] bg-[#E2F2DF] text-[#276A3C] font-bold px-1.5 py-0.5 rounded-full">
                                    Approved ✓
                                  </span>
                                </div>

                                {/* Verifier 2: Global South MRV Consortium */}
                                <div className="mt-1 p-2 rounded-xl bg-[#F7F9F6] border border-black/5 flex flex-col gap-1.5 text-[10px]">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <b className="text-[#0C150A]">2. Global South MRV Consortium</b>
                                      <p className="text-[#3F463E]">
                                        {verifier2Approved
                                          ? "Dr. Sunita Rao · Ed25519 Signed (18:40 UTC)"
                                          : "Audit review queued · Pending signature"}
                                      </p>
                                    </div>
                                    <span
                                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                        verifier2Approved
                                          ? "bg-[#E2F2DF] text-[#276A3C]"
                                          : "bg-[#FEF3C7] text-[#92400E]"
                                      }`}
                                    >
                                      {verifier2Approved ? "Approved ✓" : "Pending Sign-off"}
                                    </span>
                                  </div>

                                  {!verifier2Approved && (
                                    <button
                                      onClick={() => {
                                        playHapticSound("success");
                                        setVerifier2Approved(true);
                                        setAuthToast("Verifier 2 Quorum Signed! Calculation Engine Unlocked ✓");
                                        setTimeout(() => setAuthToast(null), 3500);
                                      }}
                                      className="w-full py-1.5 rounded-lg bg-[#0C150A] text-white font-bold text-[10px] hover:bg-black transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                                    >
                                      <CheckCircle2 size={11} className="text-[#35C46A]" />
                                      <span>Authorize Verifier 2 Sign-off (Simulate Consensus)</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* 3. Calculation Engine */}
                            <div className={`flex items-start gap-2.5 ${verifier2Approved ? "" : "opacity-60"}`}>
                              <span
                                className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                  verifier2Approved
                                    ? "bg-[#E2F2DF] text-[#0C150A]"
                                    : "border border-black/30 text-black/40"
                                }`}
                              >
                                {verifier2Approved ? "✓" : "3"}
                              </span>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-extrabold text-[#0C150A]">Calculation engine</p>
                                  {verifier2Approved && (
                                    <span className="text-[9px] font-bold text-[#276A3C]">Matched {currentProjectConfig.co2Estimated}</span>
                                  )}
                                </div>
                                <p className="text-[10px] text-[#3F463E]">
                                  {verifier2Approved
                                    ? `Executed: ${currentMetric2.toLocaleString()} ${currentProjectConfig.metric2Unit} · Verified ${currentProjectConfig.badge} dMRV algorithm`
                                    : "Runs automatically once both verifiers approve"}
                                </p>
                                {verifier2Approved && (
                                  <button
                                    onClick={() => {
                                      playHapticSound("tap");
                                      setShowCalculationModal(true);
                                    }}
                                    className="mt-1 text-[9px] font-bold text-[#276A3C] hover:underline flex items-center gap-1"
                                  >
                                    <Activity size={10} />
                                    <span>View Full dMRV Calculation Breakdown Formula →</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Estimated CO2 Counter */}
                        <div className="bg-[#E2F2DF] rounded-3xl p-4 flex items-center justify-between border border-[#276A3C]/20 shadow-xs">
                          <div>
                            <span className="text-[10px] text-[#3F463E] font-medium">
                              Certified Net CO₂ Removal
                            </span>
                            <p className="text-2xl font-black text-[#0C150A] mt-0.5">{currentProjectConfig.co2Estimated}</p>
                            <p className="text-[10px] text-[#3F463E]">{currentProjectConfig.badge} · 100-yr Permanence</p>
                          </div>

                          {/* Score Ring */}
                          <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
                            <svg width="56" height="56" viewBox="0 0 64 64">
                              <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="6" />
                              <circle
                                cx="32"
                                cy="32"
                                r="26"
                                fill="none"
                                stroke="#0C150A"
                                strokeWidth="6"
                                strokeDasharray="163"
                                strokeDashoffset="13"
                                strokeLinecap="round"
                                transform="rotate(-90 32 32)"
                              />
                            </svg>
                            <span className="absolute font-black text-[#0C150A] text-sm">92</span>
                          </div>
                        </div>

                        {/* Lab Report Quick Card */}
                        <div className="bg-white border border-black/5 rounded-2xl p-3 shadow-xs flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-[#0C150A] text-white flex items-center justify-center">
                              <Flame size={15} className="text-[#35C46A]" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs font-extrabold text-[#0C150A]">NIARSS Lab Analysis</p>
                                <span className="text-[8px] bg-[#E2F2DF] text-[#276A3C] px-1.5 py-0.2 rounded-full font-bold">
                                  H:C = 0.34
                                </span>
                              </div>
                              <p className="text-[10px] text-[#3F463E]">78.4% Fixed Carbon · Ash 4.2%</p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              playHapticSound("tap");
                              setShowLabReportModal(true);
                            }}
                            className="text-xs font-bold text-[#276A3C] hover:underline"
                          >
                            Inspect →
                          </button>
                        </div>
                      </div>

                      <div className="pt-3 pb-2 flex flex-col gap-1.5">
                        <button
                          onClick={() => {
                            playHapticSound("tap");
                            setShowEvidenceModal(true);
                          }}
                          className="w-full h-11 rounded-full bg-white border border-black/10 text-[#0C150A] font-extrabold text-xs shadow-xs hover:bg-black/5 transition-colors"
                        >
                          View evidence archive
                        </button>
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            playHapticSound("tap");
                            navigateTo("07_zk_proof");
                          }}
                          className="w-full h-13 rounded-full bg-[#0C150A] text-white font-extrabold text-base shadow-md hover:bg-black transition-colors flex items-center justify-center gap-2"
                        >
                          <span>Proceed to ZK Proof on Solana</span>
                          <ChevronRight size={18} />
                        </motion.button>
                      </div>
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* SCREEN 7: ZERO-KNOWLEDGE PROOF (Page 7 in Userflow) */}
                  {/* ============================================================== */}
                  {activeScreen === "07_zk_proof" && (
                    <div className="flex-1 flex flex-col justify-between p-5 bg-[#F7F9F6] overflow-y-auto">
                      <div className="flex flex-col gap-3 pt-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h1 className="text-2xl font-extrabold text-[#0C150A]">Zero-knowledge proof</h1>
                            <p className="text-xs text-[#3F463E] mt-0.5">
                              Groth16 SNARK prover · Client-side privacy execution
                            </p>
                          </div>
                          <button
                            onClick={() => {
                              setZkGenerating(true);
                              playHapticSound("tap");
                              setTimeout(() => {
                                setZkGenerating(false);
                                playHapticSound("success");
                                setAuthToast("Groth16 Proof Synthesized in 1,180ms (4,892 Constraints satisfied) ✓");
                                setTimeout(() => setAuthToast(null), 3000);
                              }, 1200);
                            }}
                            className="text-[10px] font-bold text-[#276A3C] bg-[#E2F2DF] px-2.5 py-1 rounded-full hover:bg-[#d4edd0] transition-colors flex items-center gap-1"
                          >
                            <RefreshCw size={10} className={zkGenerating ? "animate-spin" : ""} />
                            <span>{zkGenerating ? "Proving..." : "Re-test"}</span>
                          </button>
                        </div>

                        {/* Interactive Prover Pipeline Steps */}
                        <div className="space-y-2">
                          <div className="bg-white border border-black/5 rounded-2xl p-3 flex items-center justify-between shadow-xs">
                            <div className="flex items-center gap-2.5">
                              <span className="w-6 h-6 rounded-full bg-[#E2F2DF] text-[#0C150A] flex items-center justify-center font-bold text-xs">
                                ✓
                              </span>
                              <div>
                                <span className="text-xs font-extrabold text-[#0C150A] block">1. Computing Witness</span>
                                <span className="text-[10px] text-[#3F463E]">{currentProjectConfig.shortTitle} {currentProjectConfig.metric1Name.toLowerCase()} & {currentProjectConfig.metric2Name.toLowerCase()} polynomial</span>
                              </div>
                            </div>
                            <span className="text-[9px] font-mono font-bold text-[#276A3C]">0.12s</span>
                          </div>

                          <div className="bg-white border border-black/5 rounded-2xl p-3 flex items-center justify-between shadow-xs">
                            <div className="flex items-center gap-2.5">
                              <span className="w-6 h-6 rounded-full bg-[#E2F2DF] text-[#0C150A] flex items-center justify-center font-bold text-xs">
                                ✓
                              </span>
                              <div>
                                <span className="text-xs font-extrabold text-[#0C150A] block">2. Groth16 Prover</span>
                                <span className="text-[10px] text-[#3F463E]">4,892 R1CS constraints satisfied · SnarkJS WASM</span>
                              </div>
                            </div>
                            <span className="text-[9px] font-mono font-bold text-[#276A3C]">0.84s</span>
                          </div>

                          <div className="bg-white border border-black/5 rounded-2xl p-3 flex items-center justify-between shadow-xs">
                            <div className="flex items-center gap-2.5">
                              <span className="w-6 h-6 rounded-full bg-[#0C150A] text-[#35C46A] flex items-center justify-center">
                                <span className="w-2 h-2 rounded-full bg-[#35C46A] animate-ping" />
                              </span>
                              <div>
                                <span className="text-xs font-extrabold text-[#0C150A] block">3. Verifying on Solana</span>
                                <span className="text-[10px] text-[#3F463E]">Alt-bn128 curve syscall on Devnet slot #250,231</span>
                              </div>
                            </div>
                            <span className="text-[9px] font-mono font-bold text-[#35C46A]">Ready</span>
                          </div>
                        </div>

                        {/* Interactive Circuit & Signals Inspector Accordion */}
                        <div className="bg-white border border-black/5 rounded-2xl p-3 shadow-xs">
                          <button
                            onClick={() => {
                              playHapticSound("tap");
                              setZkWitnessLogOpen(!zkWitnessLogOpen);
                            }}
                            className="w-full flex items-center justify-between text-left"
                          >
                            <div className="flex items-center gap-2">
                              <Cpu size={14} className="text-[#276A3C]" />
                              <span className="text-xs font-extrabold text-[#0C150A]">
                                Circom Circuit & Witness Inspector
                              </span>
                            </div>
                            <span className="text-[10px] text-[#276A3C] font-bold">
                              {zkWitnessLogOpen ? "Hide" : "Inspect"}
                            </span>
                          </button>

                          {zkWitnessLogOpen && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="mt-2.5 pt-2 border-t border-black/5 font-mono text-[9px] text-[#0C150A] space-y-1.5 bg-[#F7F9F6] p-2.5 rounded-xl"
                            >
                              <div className="text-[#3F463E]">circuit: {currentProjectConfig.shortTitle.replace(/\s+/g, '')}Sequestration.circom (v2.1)</div>
                              <div className="text-[#3F463E]">curve: BN254 / Alt-bn128 (Solana Syscall)</div>
                              <div className="text-[#276A3C] font-bold">public_signals: [net_co2: {currentProjectConfig.co2Estimated}, vintage: 20261012, enclave_sig: 0x7m4...9kL]</div>
                              <div className="text-black/60">private_witness: [{currentProjectConfig.metric1Name}: {currentMetric1.toLocaleString()} {currentProjectConfig.metric1Unit}, {currentProjectConfig.metric2Name}: {currentMetric2.toLocaleString()} {currentProjectConfig.metric2Unit}]</div>
                              <div className="text-black/60">nullifier: nullifier_{selectedProjectId}_{activeZKCommitment.slice(-8)}</div>
                              <div className="text-[#276A3C] font-bold">status: PROOF_VALIDATED_ON_CHAIN (Slot #250,231)</div>
                            </motion.div>
                          )}
                        </div>

                        {/* Private vs Verified Cards */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-white border border-black/5 rounded-2xl p-3 shadow-xs">
                            <span className="text-[9px] bg-black/5 text-[#3F463E] px-1.5 py-0.5 rounded-full font-bold block w-fit mb-1">
                              Shielded Private
                            </span>
                            <p className="text-[10px] text-[#3F463E] leading-relaxed">
                              Site operator identity, raw sensor hardware keys, commercial pricing.
                            </p>
                          </div>
                          <div className="bg-white border border-black/5 rounded-2xl p-3 shadow-xs">
                            <span className="text-[9px] bg-[#E2F2DF] text-[#276A3C] px-1.5 py-0.5 rounded-full font-bold block w-fit mb-1">
                              Public Auditable
                            </span>
                            <p className="text-[10px] text-[#3F463E] leading-relaxed">
                              {currentProjectConfig.co2Estimated} formula adherence, dual-verifier quorum sigs, orbital match.
                            </p>
                          </div>
                        </div>

                        {/* Hash Card */}
                        <div className="bg-[#E2F2DF] border border-[#276A3C]/20 rounded-2xl p-3 flex items-center justify-between">
                          <div className="min-w-0 pr-2">
                            <span className="text-[9px] text-[#3F463E] block">Proof commitment</span>
                            <span className="font-mono text-xs font-bold text-[#0C150A] truncate block">
                              {activeZKCommitment.slice(0, 24)}...
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard?.writeText(activeZKCommitment);
                              playHapticSound("tap");
                              setAuthToast(`Copied ZK Proof commitment to clipboard ✓`);
                              setTimeout(() => setAuthToast(null), 2500);
                            }}
                            className="p-1.5 rounded-lg bg-white/60 hover:bg-white text-[#0C150A] transition-colors shrink-0"
                            title="Copy proof commitment"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="pt-3 pb-2">
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            playHapticSound("success");
                            confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
                            navigateTo("08_credits_issued");
                          }}
                          className="w-full h-13 rounded-full bg-[#0C150A] text-white font-extrabold text-base shadow-md hover:bg-black transition-colors flex items-center justify-center gap-2"
                        >
                          <span>Mint Credits on Solana Devnet</span>
                          <ChevronRight size={18} />
                        </motion.button>
                      </div>
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* SCREEN 8: CREDITS ISSUED (Page 8 in Userflow) */}
                  {/* ============================================================== */}
                  {activeScreen === "08_credits_issued" && (
                    <div className="flex-1 flex flex-col justify-between p-5 bg-[#F7F9F6] overflow-y-auto">
                      <div className="flex flex-col items-center text-center gap-2.5 pt-1">
                        <div className="w-14 h-14 rounded-full bg-[#E2F2DF] text-[#0C150A] flex items-center justify-center font-bold text-2xl shadow-md border border-[#276A3C]/20">
                          ✓
                        </div>
                        <div>
                          <h1 className="text-2xl font-extrabold text-[#0C150A]">Credits Issued</h1>
                          <p className="text-xs text-[#3F463E]">SPL Token Mint on Solana Devnet</p>
                        </div>

                        {/* Metadata Card */}
                        <div className="w-full bg-white text-[#0C150A] rounded-3xl p-4 text-xs flex flex-col gap-2 text-left shadow-xs border border-black/5">
                          <div className="flex justify-between py-0.5 border-b border-black/5">
                            <span className="text-[#3F463E]">Name</span>
                            <b className="text-[#0C150A]">{currentProjectConfig.shortTitle} Batch #3 · {currentProjectConfig.location.split(',')[0]}</b>
                          </div>
                          <div className="flex justify-between py-0.5 border-b border-black/5">
                            <span className="text-[#3F463E]">Issued to you (90%)</span>
                            <b className="text-[#276A3C] font-black">
                              {(parseFloat(currentProjectConfig.co2Estimated) * 0.9).toFixed(3)} tCO₂e
                            </b>
                          </div>
                          <div className="flex justify-between py-0.5 border-b border-black/5">
                            <span className="text-[#3F463E]">Shared reserve pool (10%)</span>
                            <b className="text-[#0C150A]">
                              {(parseFloat(currentProjectConfig.co2Estimated) * 0.1).toFixed(3)} tCO₂e
                            </b>
                          </div>
                          <div className="flex justify-between py-0.5 border-b border-black/5">
                            <span className="text-[#3F463E]">Methodology</span>
                            <b className="font-mono text-[9px] text-[#0C150A]">ATMOS-{currentProjectConfig.id.toUpperCase()}-v1</b>
                          </div>
                          <div className="flex justify-between py-0.5 border-b border-black/5">
                            <span className="text-[#3F463E]">Token Mint Program</span>
                            <b className="font-mono text-[9px] text-[#276A3C]">AtmoSTkn_{currentProjectConfig.shortTitle.replace(/\s+/g, '')}_Batch003</b>
                          </div>
                          <div className="flex justify-between py-0.5 border-b border-black/5">
                            <span className="text-[#3F463E]">Network & Block</span>
                            <b className="text-[#0C150A]">Solana Devnet · #250,231</b>
                          </div>
                          <div className="flex justify-between items-center py-0.5 border-b border-black/5">
                            <span className="text-[#3F463E]">Proof commitment</span>
                            <div className="flex items-center gap-1 font-mono text-[9px] text-[#0C150A]">
                              <span>{activeZKCommitment.slice(0, 16)}…</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard?.writeText(activeZKCommitment);
                                  playHapticSound("tap");
                                  setAuthToast("Copied ZK Proof commitment to clipboard ✓");
                                  setTimeout(() => setAuthToast(null), 2500);
                                }}
                                className="p-0.5 text-[#276A3C] hover:bg-black/5 rounded-sm"
                                title="Copy commitment"
                              >
                                <Copy size={11} />
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-between items-center pt-0.5">
                            <span className="text-[#3F463E]">Status</span>
                            <span className="text-[9px] bg-[#E2F2DF] text-[#276A3C] font-bold px-2 py-0.5 rounded-full">
                              Audited · Minted on Devnet
                            </span>
                          </div>
                        </div>

                        <p className="text-[10px] text-[#3F463E] leading-relaxed px-1">
                          10% (0.643 t) automatically deposited in Atmos Reserve Pool to protect buyers against future audit variance.
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 pt-2 pb-2">
                        <button
                          onClick={() => {
                            playHapticSound("tap");
                            setShowListCreditsModal(true);
                          }}
                          className="w-full h-13 rounded-full bg-[#0C150A] text-white font-extrabold text-base shadow-md hover:bg-black transition-colors flex items-center justify-center gap-2"
                        >
                          <span>+ List for sale on Market</span>
                        </button>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              playHapticSound("tap");
                              navigateTo("11_certificate");
                            }}
                            className="h-11 rounded-2xl border border-black/10 bg-white text-[#0C150A] font-extrabold text-xs hover:bg-black/5 transition-colors"
                          >
                            View certificate
                          </button>
                          <button
                            onClick={() => {
                              playHapticSound("tap");
                              setShowSolanaTxModal(true);
                            }}
                            className="h-11 rounded-2xl border border-black/10 bg-white text-[#0C150A] font-extrabold text-xs hover:bg-black/5 transition-colors"
                          >
                            Inspect Solana Tx
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* SCREEN 9: MARKETPLACE (Page 9 in Userflow) */}
                  {/* ============================================================== */}
                  {activeScreen === "09_marketplace" && (
                    <div className="flex-1 flex flex-col justify-between p-5 bg-[#F7F9F6] pb-20 overflow-y-auto">
                      <div className="flex flex-col gap-3 pt-1">
                        {/* Search Bar */}
                        <div className="flex items-center gap-2 bg-white border border-black/10 px-3.5 py-2.5 rounded-2xl shadow-xs">
                          <Search size={15} className="text-black/50" />
                          <input
                            type="text"
                            value={marketSearch}
                            onChange={(e) => setMarketSearch(e.target.value)}
                            placeholder="Search location, batch or project…"
                            className="bg-transparent text-xs text-[#0C150A] placeholder-black/40 outline-none flex-1 font-medium"
                          />
                          {marketSearch && (
                            <button onClick={() => setMarketSearch("")} className="text-black/40 hover:text-black">
                              <X size={14} />
                            </button>
                          )}
                          <span className="text-[9px] bg-[#E2F2DF] text-[#0C150A] px-2 py-0.5 rounded-full font-bold">
                            Devnet
                          </span>
                        </div>

                        {/* Filter Pills & List Button */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {(["all", "biochar", "agroforestry"] as const).map((filter) => (
                              <button
                                key={filter}
                                onClick={() => {
                                  playHapticSound("tap");
                                  setMarketFilter(filter);
                                }}
                                className={`px-3 py-1 rounded-full text-xs font-bold capitalize transition-colors ${
                                  marketFilter === filter
                                    ? "bg-[#0C150A] text-white"
                                    : "bg-white border border-black/5 text-[#3F463E] hover:bg-black/5"
                                }`}
                              >
                                {filter === "agroforestry" ? "Agroforestry" : filter}
                              </button>
                            ))}
                          </div>
                          <button
                            onClick={() => {
                              playHapticSound("tap");
                              setShowListCreditsModal(true);
                            }}
                            className="text-[10px] font-bold text-[#276A3C] bg-[#E2F2DF] px-2.5 py-1 rounded-full hover:bg-[#d4edd0] transition-colors"
                          >
                            + List Batch
                          </button>
                        </div>

                        {/* Market Spot Ticker Bar */}
                        <div className="bg-white border border-black/5 rounded-2xl p-3 flex items-center justify-between shadow-xs text-xs">
                          <div>
                            <span className="text-[10px] text-[#3F463E] block">Market Spot Average</span>
                            <b className="text-sm text-[#0C150A]">₹11,100 / tonne</b>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-[#3F463E] block">24h Devnet Volume</span>
                            <b className="text-xs text-[#276A3C] font-mono">142.5 tCO₂e (+4.2%)</b>
                          </div>
                        </div>

                        {/* Listings Feed */}
                        <div className="flex flex-col gap-2.5 mt-0.5">
                          {marketListings
                            .filter((item) => {
                              const matchesFilter = marketFilter === "all" || item.type === marketFilter;
                              const matchesSearch =
                                item.title.toLowerCase().includes(marketSearch.toLowerCase()) ||
                                item.location.toLowerCase().includes(marketSearch.toLowerCase()) ||
                                item.batch.toLowerCase().includes(marketSearch.toLowerCase());
                              return matchesFilter && matchesSearch;
                            })
                            .map((listing) => (
                              <div
                                key={listing.id}
                                className="bg-white border border-black/5 rounded-3xl p-4 flex flex-col gap-2 shadow-xs hover:border-black/20 transition-all"
                              >
                                <div className="flex items-center justify-between text-[9px]">
                                  <span className="bg-[#E2F2DF] text-[#276A3C] px-2 py-0.5 rounded-full font-bold">
                                    {listing.badge}
                                  </span>
                                  <span className="text-[#3F463E]">
                                    Score {listing.score} · {listing.verifiers} verifiers
                                  </span>
                                </div>
                                <div>
                                  <h2 className="text-sm font-extrabold text-[#0C150A]">{listing.title}</h2>
                                  <p className="text-[11px] text-[#3F463E]">{listing.batch}</p>
                                </div>
                                <div className="flex items-center justify-between pt-1 border-t border-black/5">
                                  <div>
                                    <span className="text-base font-black text-[#0C150A]">
                                      ₹{listing.pricePerTonne.toLocaleString("en-IN")}
                                    </span>
                                    <span className="text-xs text-[#3F463E]"> / tonne</span>
                                    <p className="text-[9px] text-[#276A3C] font-bold">
                                      Available: {listing.availableTonnes} t
                                    </p>
                                  </div>
                                  <motion.button
                                    whileTap={{ scale: 0.92 }}
                                    onClick={() => {
                                      playHapticSound("tap");
                                      setPurchaseTonnes(Math.min(5.0, listing.availableTonnes));
                                      navigateTo("10_payment");
                                    }}
                                    className="w-9 h-9 rounded-full bg-[#0C150A] text-white flex items-center justify-center hover:scale-105 transition-transform shadow-xs"
                                  >
                                    <ArrowUpRight size={18} />
                                  </motion.button>
                                </div>
                              </div>
                            ))}

                          {marketListings.filter((item) => {
                            const matchesFilter = marketFilter === "all" || item.type === marketFilter;
                            const matchesSearch =
                              item.title.toLowerCase().includes(marketSearch.toLowerCase()) ||
                              item.location.toLowerCase().includes(marketSearch.toLowerCase()) ||
                              item.batch.toLowerCase().includes(marketSearch.toLowerCase());
                            return matchesFilter && matchesSearch;
                          }).length === 0 && (
                            <div className="p-6 text-center bg-white rounded-3xl border border-black/5 text-xs text-[#3F463E]">
                              <p className="font-bold text-[#0C150A]">No units match '{marketSearch}'</p>
                              <p className="text-[10px] mt-1">Try resetting the filter or search term</p>
                              <button
                                onClick={() => {
                                  setMarketSearch("");
                                  setMarketFilter("all");
                                }}
                                className="mt-2 text-[10px] font-bold text-[#276A3C] underline"
                              >
                                Reset filters
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {renderBottomNav("market")}
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* SCREEN 10: PAYMENT & SETTLEMENT (Page 10 in Userflow) */}
                  {/* ============================================================== */}
                  {activeScreen === "10_payment" && (
                    <div className="flex-1 flex flex-col justify-between p-5 bg-[#F7F9F6] overflow-y-auto font-['Inter',sans-serif]">
                      <div className="flex flex-col gap-3 pt-1">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => {
                              playHapticSound("tap");
                              navigateTo("09_marketplace");
                            }}
                            className="p-1 hover:bg-black/5 rounded-full"
                          >
                            <ChevronLeft size={20} />
                          </button>
                          <h1 className="text-xl font-extrabold text-[#0C150A]">Payment & Settlement</h1>
                          <button
                            onClick={() => {
                              if (!walletState.isConnected) {
                                handleConnectPhantom();
                              } else {
                                setShowWalletModal(true);
                              }
                            }}
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-mono transition-all flex items-center gap-1 border shadow-xs ${
                              walletState.isConnected
                                ? "bg-[#512da8]/15 border-[#795290]/40 text-[#512da8] hover:bg-[#512da8]/25"
                                : "bg-[#512da8] text-white border-transparent hover:bg-[#4527a0]"
                            }`}
                            title="Solana & Phantom Web3 Wallet"
                          >
                            <Wallet size={10} />
                            <span>{walletState.isConnected ? walletState.shortAddress : "Phantom"}</span>
                            {walletState.isConnected && <span className="w-1.5 h-1.5 rounded-full bg-[#35C46A]" />}
                          </button>
                        </div>
                        <p className="text-xs text-[#3F463E] text-center">
                          Buying {currentProjectConfig.shortTitle} · {currentProjectConfig.location.split(',')[0]} (Batch #3)
                        </p>

                        {/* Interactive Quantity Selector */}
                        <div className="bg-white rounded-3xl p-4 border border-black/5 shadow-xs flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#0C150A]">Quantity to Retire</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  playHapticSound("tap");
                                  setPurchaseTonnes((t) => Math.max(0.5, Math.round((t - 0.5) * 10) / 10));
                                }}
                                className="w-7 h-7 rounded-full bg-[#F7F9F6] border border-black/10 font-bold text-sm flex items-center justify-center hover:bg-black/5"
                              >
                                -
                              </button>
                              <span className="font-extrabold text-sm text-[#0C150A] min-w-14 text-center">
                                {purchaseTonnes.toFixed(1)} t
                              </span>
                              <button
                                onClick={() => {
                                  playHapticSound("tap");
                                  setPurchaseTonnes((t) => Math.min(5.796, Math.round((t + 0.5) * 10) / 10));
                                }}
                                className="w-7 h-7 rounded-full bg-[#F7F9F6] border border-black/10 font-bold text-sm flex items-center justify-center hover:bg-black/5"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-1.5">
                            {[1.0, 2.5, 5.0, 5.796].map((qty) => (
                              <button
                                key={qty}
                                onClick={() => {
                                  playHapticSound("tap");
                                  setPurchaseTonnes(qty);
                                }}
                                className={`py-1 rounded-xl text-[10px] font-bold border transition-colors ${
                                  purchaseTonnes === qty
                                    ? "bg-[#0C150A] text-white border-[#0C150A]"
                                    : "bg-[#F7F9F6] border-black/10 text-[#3F463E]"
                                }`}
                              >
                                {qty === 5.796 ? "All" : `${qty} t`}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Amount & Transparent Settlement Split Card */}
                        <div className="bg-white rounded-3xl p-4.5 border border-black/5 shadow-xs flex flex-col gap-3">
                          <div className="flex justify-between items-baseline">
                            <div>
                              <span className="text-[11px] text-[#3F463E] font-medium block">Total Settlement</span>
                              <p className="text-2xl font-black text-[#0C150A] leading-tight">
                                ₹{Math.round(purchaseTonnes * 11100).toLocaleString("en-IN")}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-white bg-[#512da8] px-2 py-0.5 rounded-full font-mono font-bold">
                                ≈ ${DodoPaymentsService.inrToUsd(Math.round(purchaseTonnes * 11100))} USDC
                              </span>
                            </div>
                          </div>

                          <div className="border-y border-black/5 py-2 space-y-1 text-xs">
                            <div className="flex justify-between text-[11px]">
                              <span className="text-[#3F463E]">{purchaseTonnes.toFixed(2)} tCO₂e × ₹11,100</span>
                              <b>₹{Math.round(purchaseTonnes * 11100).toLocaleString("en-IN")}</b>
                            </div>
                            <div className="flex justify-between text-[10.5px]">
                              <span className="text-[#3F463E]">↳ Ramesh Patel UPI Escrow (95%)</span>
                              <b className="text-[#276A3C]">
                                ₹{Math.round(purchaseTonnes * 11100 * 0.95).toLocaleString("en-IN")}
                              </b>
                            </div>
                            <div className="flex justify-between text-[10.5px]">
                              <span className="text-[#3F463E]">↳ Verifier & MRV Escrow (5%)</span>
                              <b>₹{Math.round(purchaseTonnes * 11100 * 0.05).toLocaleString("en-IN")}</b>
                            </div>
                            <div className="flex justify-between text-[10.5px]">
                              <span className="text-[#3F463E]">↳ Dodo Payments MoR Gateway</span>
                              <b className="text-[#276A3C]">Sponsored (0%)</b>
                            </div>
                          </div>

                          {/* 3 Payment Methods: Dodo UPI, Dodo Cards, Phantom Solana Pay */}
                          <div>
                            <p className="text-xs font-bold text-[#0C150A] mb-1.5">Select Settlement Method</p>
                            <div className="space-y-1.5">
                              {/* 1. Dodo UPI */}
                              <div
                                onClick={() => {
                                  playHapticSound("tap");
                                  setPaymentMethod("dodo_upi");
                                }}
                                className={`cursor-pointer p-2.5 rounded-2xl border-2 flex items-center justify-between transition-all ${
                                  paymentMethod === "dodo_upi" ? "border-[#0C150A] bg-[#E2F2DF]" : "border-black/10 bg-[#F7F9F6] hover:bg-black/5"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-xl bg-[#0C150A] text-white flex items-center justify-center shrink-0">
                                    <QrCode size={14} />
                                  </div>
                                  <div>
                                    <p className="text-[11px] font-extrabold text-[#0C150A] flex items-center gap-1.5">
                                      <span>Dodo Payments · UPI Instant</span>
                                      <span className="text-[8px] bg-[#276A3C]/15 text-[#276A3C] px-1 py-0.2 rounded-xs font-mono">Dodo MoR</span>
                                    </p>
                                    <p className="text-[9.5px] text-[#3F463E]">GPay, PhonePe, Paytm, BHIM Escrow</p>
                                  </div>
                                </div>
                                {paymentMethod === "dodo_upi" && (
                                  <span className="w-4 h-4 rounded-full bg-[#0C150A] text-white flex items-center justify-center text-[9px]">
                                    ✓
                                  </span>
                                )}
                              </div>

                              {/* 2. Dodo Global Cards */}
                              <div
                                onClick={() => {
                                  playHapticSound("tap");
                                  setPaymentMethod("dodo_card");
                                }}
                                className={`cursor-pointer p-2.5 rounded-2xl border-2 flex items-center justify-between transition-all ${
                                  paymentMethod === "dodo_card" ? "border-[#0C150A] bg-[#E2F2DF]" : "border-black/10 bg-[#F7F9F6] hover:bg-black/5"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-xl bg-[#0C150A] text-white flex items-center justify-center shrink-0">
                                    <CreditCard size={14} />
                                  </div>
                                  <div>
                                    <p className="text-[11px] font-extrabold text-[#0C150A] flex items-center gap-1.5">
                                      <span>Dodo Payments · Global Cards</span>
                                      <span className="text-[8px] bg-[#276A3C]/15 text-[#276A3C] px-1 py-0.2 rounded-xs font-mono">50+ Currencies</span>
                                    </p>
                                    <p className="text-[9.5px] text-[#3F463E]">Visa, Mastercard, Amex with Zero Forex</p>
                                  </div>
                                </div>
                                {paymentMethod === "dodo_card" && (
                                  <span className="w-4 h-4 rounded-full bg-[#0C150A] text-white flex items-center justify-center text-[9px]">
                                    ✓
                                  </span>
                                )}
                              </div>

                              {/* 3. Phantom Solana Pay */}
                              <div
                                onClick={() => {
                                  playHapticSound("tap");
                                  setPaymentMethod("phantom_solana");
                                }}
                                className={`cursor-pointer p-2.5 rounded-2xl border-2 flex items-center justify-between transition-all ${
                                  paymentMethod === "phantom_solana" ? "border-[#512da8] bg-[#512da8]/10" : "border-black/10 bg-[#F7F9F6] hover:bg-black/5"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-xl bg-[#512da8] text-white flex items-center justify-center shrink-0">
                                    <Wallet size={14} />
                                  </div>
                                  <div>
                                    <p className="text-[11px] font-extrabold text-[#0C150A] flex items-center gap-1.5">
                                      <span>Phantom · Solana Pay</span>
                                      <span className="text-[8px] bg-[#512da8]/20 text-[#512da8] px-1 py-0.2 rounded-xs font-mono">USDC / SOL</span>
                                    </p>
                                    <p className="text-[9.5px] text-[#3F463E]">
                                      {walletState.isConnected
                                        ? `Connected: ${walletState.shortAddress} (${walletState.solBalance} SOL)`
                                        : "Direct Web3 On-Chain Confidential Transfer"}
                                    </p>
                                  </div>
                                </div>
                                {paymentMethod === "phantom_solana" && (
                                  <span className="w-4 h-4 rounded-full bg-[#512da8] text-white flex items-center justify-center text-[9px]">
                                    ✓
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="bg-[#E2F2DF]/70 border border-[#276A3C]/20 rounded-xl p-2">
                            <p className="text-[9.5px] text-[#276A3C] leading-relaxed font-medium">
                              Protected by Dodo Escrow: Funds released to producer upon Solana alt-bn128 ZK deed validation.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 pb-2 flex flex-col gap-1 text-center">
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          disabled={isProcessingPayment}
                          onClick={() => {
                            if (paymentMethod === "phantom_solana") {
                              handlePayWithPhantom();
                            } else {
                              handleInitiateDodoPayment();
                            }
                          }}
                          className={`w-full h-13 rounded-full text-white font-extrabold text-base shadow-md transition-colors flex items-center justify-center gap-2 ${
                            paymentMethod === "phantom_solana"
                              ? "bg-[#512da8] hover:bg-[#4527a0]"
                              : "bg-[#0C150A] hover:bg-black"
                          }`}
                        >
                          {isProcessingPayment ? (
                            <>
                              <RefreshCw size={16} className="animate-spin text-[#35C46A]" />
                              <span>{paymentMethod === "phantom_solana" ? "Broadcasting to Solana Devnet..." : "Creating Dodo Escrow Session..."}</span>
                            </>
                          ) : paymentMethod === "phantom_solana" ? (
                            walletState.isConnected ? (
                              <>
                                <span>Pay ${DodoPaymentsService.inrToUsd(Math.round(purchaseTonnes * 11100))} USDC via Phantom</span>
                                <ChevronRight size={18} />
                              </>
                            ) : (
                              <>
                                <Wallet size={16} />
                                <span>Connect Phantom Wallet to Pay</span>
                              </>
                            )
                          ) : (
                            <>
                              <span>Pay ₹{Math.round(purchaseTonnes * 11100).toLocaleString("en-IN")} via Dodo</span>
                              <ChevronRight size={18} />
                            </>
                          )}
                        </motion.button>
                        <p className="text-[9.5px] text-[#3F463E]">
                          Secured by Dodo Payments Merchant of Record & Solana SPL Token-2022
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* SCREEN 11: SOLANA SETTLEMENT & CERTIFICATE (Page 11 in Userflow) */}
                  {/* ============================================================== */}
                  {activeScreen === "11_certificate" && (
                    <div className="flex-1 flex flex-col justify-between p-5 bg-[#F7F9F6] overflow-y-auto">
                      <div className="flex flex-col gap-3 pt-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h1 className="text-xl font-extrabold text-[#0C150A]">Retirement Certificate</h1>
                            <p className="text-[11px] text-[#3F463E]">Recorded on Solana Devnet</p>
                          </div>
                          <span className="text-[9px] bg-[#E2F2DF] text-[#0C150A] px-2 py-0.5 rounded-full font-bold">
                            Devnet Verified
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-mono text-[#276A3C] font-bold bg-white px-3 py-1.5 rounded-2xl border border-black/5">
                          <span>Tx: 5ayYk…2z21</span>
                          <span>Block #250,231</span>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <div className="h-1 rounded-full bg-[#35C46A]" />
                          <div className="h-1 rounded-full bg-[#35C46A]" />
                          <div className="h-1 rounded-full bg-[#35C46A]" />
                        </div>

                        {/* Certificate Card */}
                        <div className="bg-white text-[#0C150A] rounded-3xl p-4 border border-black/10 shadow-xs flex flex-col gap-2.5">
                          <div className="text-center border-b border-black/10 pb-2">
                            <span className="text-[9px] font-mono text-[#276A3C] uppercase tracking-wider block font-bold">
                              Permanent Climate Deed
                            </span>
                            <h2 className="text-sm font-black tracking-widest text-[#0C150A] mt-0.5">
                              CERTIFICATE OF CARBON RETIREMENT
                            </h2>
                            <span className="text-[8px] font-mono text-[#3F463E]">ATMOS-REC-2026-KL-00918</span>
                          </div>

                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between">
                              <span className="text-[#3F463E]">Beneficiary</span>
                              <b>Sample buyer (ESG)</b>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#3F463E]">Producer</span>
                              <b>{currentProjectConfig.projectName}</b>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#3F463E]">Asset & Batch</span>
                              <b>{currentProjectConfig.shortTitle} Batch #3 · {currentProjectConfig.location.split(',')[0]}</b>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#3F463E]">Volume Retired</span>
                              <b className="text-[#276A3C]">{purchaseTonnes.toFixed(3)} tCO₂e</b>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#3F463E]">Settled Value</span>
                              <b>₹{Math.round(purchaseTonnes * 11100).toLocaleString("en-IN")}</b>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#3F463E]">Date</span>
                              <b>12 Oct 2026 · 18:30 UTC</b>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#3F463E]">Solana Program</span>
                              <b>SPL Token Burn / Devnet</b>
                            </div>
                            <div className="flex justify-between items-center pt-1 border-t border-black/5">
                              <span className="text-[#3F463E]">Status</span>
                              <span className="text-[9px] bg-[#E2F2DF] text-[#276A3C] font-bold px-2 py-0.5 rounded-full">
                                Permanently Retired ✓
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2.5 pt-1.5 border-t border-black/5">
                            <div className="w-12 h-12 bg-black rounded-lg p-1 flex items-center justify-center shrink-0">
                              <div className="w-full h-full bg-white grid grid-cols-3 gap-0.5 p-0.5">
                                <div className="bg-black" />
                                <div className="bg-white" />
                                <div className="bg-black" />
                                <div className="bg-black" />
                                <div className="bg-black" />
                                <div className="bg-white" />
                                <div className="bg-white" />
                                <div className="bg-black" />
                                <div className="bg-black" />
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-[#0C150A]">Verify Certificate Deed</p>
                              <p className="text-[9px] text-[#3F463E] font-mono">atmos.network/verify/00918</p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => {
                              playHapticSound("tap");
                              setAuthToast("Downloading Deed: ATMOS-REC-2026-KL-00918.pdf ✓");
                              setTimeout(() => setAuthToast(null), 3000);
                            }}
                            className="h-10 rounded-2xl bg-white border border-black/10 text-[#0C150A] font-bold text-xs hover:bg-black/5 transition-colors flex items-center justify-center gap-1"
                          >
                            <Download size={12} />
                            <span>PDF</span>
                          </button>
                          <button
                            onClick={() => {
                              playHapticSound("tap");
                              setShowShareModal(true);
                            }}
                            className="h-10 rounded-2xl bg-white border border-black/10 text-[#0C150A] font-bold text-xs hover:bg-black/5 transition-colors flex items-center justify-center gap-1"
                          >
                            <Share2 size={12} />
                            <span>Share</span>
                          </button>
                          <button
                            onClick={() => {
                              playHapticSound("tap");
                              setShowSolanaTxModal(true);
                            }}
                            className="h-10 rounded-2xl bg-white border border-black/10 text-[#0C150A] font-bold text-xs hover:bg-black/5 transition-colors flex items-center justify-center gap-1"
                          >
                            <ExternalLink size={12} />
                            <span>Explorer</span>
                          </button>
                        </div>
                      </div>

                      <div className="pt-2 pb-2">
                        <button
                          onClick={() => {
                            playHapticSound("tap");
                            navigateTo("12_portfolio");
                          }}
                          className="w-full h-13 rounded-full bg-[#0C150A] text-white font-extrabold text-base shadow-md hover:bg-black transition-colors"
                        >
                          Done (View Portfolio)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* SCREEN 12: PORTFOLIO (Page 12 in Userflow) */}
                  {/* ============================================================== */}
                  {activeScreen === "12_portfolio" && (
                    <div className="flex-1 flex flex-col justify-between bg-[#F7F9F6] pb-20 overflow-y-auto">
                      <div className="p-5 pt-3 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <h1 className="text-2xl font-extrabold text-[#0C150A]">Portfolio</h1>
                          <span className="text-[9px] bg-[#E2F2DF] text-[#0C150A] px-2 py-0.5 rounded-full font-bold">
                            Devnet Ledger
                          </span>
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex items-center gap-1.5">
                          {(["holdings", "history", "impact"] as const).map((tab) => (
                            <button
                              key={tab}
                              onClick={() => {
                                playHapticSound("tap");
                                setPortfolioTab(tab);
                              }}
                              className={`px-3 py-1 rounded-full text-xs font-bold capitalize transition-colors ${
                                portfolioTab === tab
                                    ? "bg-[#0C150A] text-white"
                                    : "bg-white border border-black/5 text-[#3F463E] hover:bg-black/5"
                              }`}
                            >
                              {tab}
                            </button>
                          ))}
                        </div>

                        <div>
                          <span className="text-[11px] text-[#3F463E]">Total Atmospheric Units</span>
                          <p className="text-3xl font-black text-[#0C150A] leading-tight">8.000 tCO₂e</p>
                          <p className="text-xs text-[#3F463E]">5.000 retired · 3.000 held · ₹92,700 valuation</p>
                        </div>

                        {/* TAB 1: HOLDINGS */}
                        {portfolioTab === "holdings" && (
                          <div className="space-y-2 mt-1">
                            <h2 className="text-xs font-extrabold text-[#0C150A]">Carbon Holdings</h2>

                            <div
                              onClick={() => {
                                playHapticSound("tap");
                                setShowCertificateModal(true);
                              }}
                              className="cursor-pointer p-3 rounded-2xl bg-white border border-black/5 flex items-center justify-between shadow-xs hover:border-black/20 transition-all"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-[#0C150A] flex items-center justify-center text-white">
                                  <Leaf size={16} className="text-[#35C46A]" />
                                </div>
                                <div>
                                  <p className="text-xs font-extrabold text-[#0C150A]">Biochar · Kalol, Gujarat</p>
                                  <p className="text-[10px] text-[#3F463E]">Batch #3 · retired deed available</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-black text-[#0C150A]">5.000 t</p>
                                <span className="text-[9px] bg-[#E2F2DF] text-[#276A3C] font-bold px-2 py-0.5 rounded-full">
                                  Retired ✓
                                </span>
                              </div>
                            </div>

                            <div
                              onClick={() => {
                                playHapticSound("tap");
                                navigateTo("09_marketplace");
                              }}
                              className="cursor-pointer p-3 rounded-2xl bg-white border border-black/5 flex items-center justify-between shadow-xs hover:border-black/20 transition-all"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-[#0C150A] flex items-center justify-center text-white">
                                  <Leaf size={16} />
                                </div>
                                <div>
                                  <p className="text-xs font-extrabold text-[#0C150A]">Biochar · Jaipur, Rajasthan</p>
                                  <p className="text-[10px] text-[#3F463E]">Batch #7 · tradeable in orderbook</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-black text-[#0C150A]">3.000 t</p>
                                <span className="text-[9px] bg-black/5 text-[#3F463E] font-bold px-2 py-0.5 rounded-full">
                                  Held (Tradeable)
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-white border border-black/5 mt-2">
                              <div>
                                <span className="text-[10px] text-[#3F463E]">Total units</span>
                                <p className="text-sm font-black text-[#0C150A]">8.000 tCO₂e</p>
                              </div>
                              <div>
                                <span className="text-[10px] text-[#3F463E]">Total value</span>
                                <p className="text-sm font-black text-[#0C150A]">₹92,700</p>
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                playHapticSound("tap");
                                navigateTo("09_marketplace");
                              }}
                              className="w-full h-11 rounded-2xl bg-[#0C150A] text-white font-extrabold text-xs shadow-xs hover:bg-black transition-colors flex items-center justify-center gap-1.5"
                            >
                              <span>+ Browse More Units on Marketplace</span>
                            </button>
                          </div>
                        )}

                        {/* TAB 2: HISTORY */}
                        {portfolioTab === "history" && (
                          <div className="space-y-2 mt-1">
                            <h2 className="text-xs font-extrabold text-[#0C150A]">Solana Devnet History</h2>
                            {[
                              {
                                title: "Retired 5.000 tCO₂e",
                                batch: "Batch #3 · Kalol",
                                date: "12 Oct 2026",
                                hash: "5ayYk...2z21",
                                status: "Settled",
                              },
                              {
                                title: "Purchased 5.000 tCO₂e",
                                batch: "Dodo Payments ₹55,500",
                                date: "12 Oct 2026",
                                hash: "9xVq...78bL",
                                status: "Paid",
                              },
                              {
                                title: "Purchased 3.000 tCO₂e",
                                batch: "Batch #7 · Jaipur",
                                date: "09 Oct 2026",
                                hash: "3mnP...49wZ",
                                status: "Held",
                              },
                              {
                                title: "Producer Payout Received",
                                batch: "Batch #2 (₹22,000 via UPI)",
                                date: "04 Oct 2026",
                                hash: "UPI-4921-992",
                                status: "Credited",
                              },
                            ].map((item, idx) => (
                              <div
                                key={idx}
                                onClick={() => {
                                  playHapticSound("tap");
                                  setShowSolanaTxModal(true);
                                }}
                                className="cursor-pointer p-3 rounded-2xl bg-white border border-black/5 flex items-center justify-between text-xs shadow-xs hover:border-black/20 transition-all"
                              >
                                <div>
                                  <p className="font-extrabold text-[#0C150A]">{item.title}</p>
                                  <p className="text-[10px] text-[#3F463E]">{item.batch}</p>
                                  <p className="font-mono text-[9px] text-[#276A3C]">{item.hash}</p>
                                </div>
                                <div className="text-right">
                                  <span className="text-[9px] bg-[#E2F2DF] text-[#276A3C] font-bold px-2 py-0.5 rounded-full block mb-1">
                                    {item.status}
                                  </span>
                                  <span className="text-[9px] text-[#3F463E]">{item.date}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* TAB 3: IMPACT */}
                        {portfolioTab === "impact" && (
                          <div className="space-y-2 mt-1">
                            <h2 className="text-xs font-extrabold text-[#0C150A]">Verified Ecological Impact</h2>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="p-3.5 rounded-2xl bg-[#E2F2DF] border border-[#276A3C]/20 flex flex-col justify-between">
                                <span className="text-2xl font-black text-[#276A3C]">8.0 t</span>
                                <span className="text-[10px] font-bold text-[#0C150A]">CO₂ Sequestered 100y+</span>
                              </div>
                              <div className="p-3.5 rounded-2xl bg-white border border-black/5 flex flex-col justify-between shadow-xs">
                                <span className="text-2xl font-black text-[#0C150A]">34,400</span>
                                <span className="text-[10px] font-medium text-[#3F463E]">Km Car Travel Offset</span>
                              </div>
                              <div className="p-3.5 rounded-2xl bg-white border border-black/5 flex flex-col justify-between shadow-xs">
                                <span className="text-2xl font-black text-[#0C150A]">2,400 kg</span>
                                <span className="text-[10px] font-medium text-[#3F463E]">Pure Biochar in Soil</span>
                              </div>
                              <div className="p-3.5 rounded-2xl bg-[#E2F2DF] border border-[#276A3C]/20 flex flex-col justify-between">
                                <span className="text-2xl font-black text-[#276A3C]">+18%</span>
                                <span className="text-[10px] font-bold text-[#0C150A]">Water Retention Boost</span>
                              </div>
                            </div>
                            <div className="bg-white border border-black/5 rounded-2xl p-3 shadow-xs">
                              <p className="text-xs font-bold text-[#0C150A]">Rural Farmer Co-Benefit</p>
                              <p className="text-[10px] text-[#3F463E] mt-0.5 leading-relaxed">
                                14 cotton farmers in Kalol cluster benefited from biomass residue aggregation, eliminating crop burning pollution.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {renderBottomNav("portfolio")}
                    </div>
                  )}

                  {/* ============================================================== */}
                  {/* SCREEN 13: PROFILE (Page 13 in Userflow) */}
                  {/* ============================================================== */}
                  {activeScreen === "13_profile" && (
                    <div className="flex-1 flex flex-col justify-between bg-[#F7F9F6] pb-20 overflow-y-auto">
                      <div className="p-5 pt-3 flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          {currentUser?.photoURL ? (
                            <img
                              src={currentUser.photoURL}
                              alt={currentUser.displayName}
                              className="w-12 h-12 rounded-full border-2 border-[#0C150A] shadow-xs object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-[#0C150A] text-[#E2F2DF] flex items-center justify-center font-black text-base shadow-xs">
                              {currentUser?.displayName ? currentUser.displayName.slice(0, 2).toUpperCase() : "RP"}
                            </div>
                          )}
                          <div className="flex-1">
                            <h1 className="text-lg font-extrabold text-[#0C150A]">
                              {currentUser?.displayName || "Ramesh Patel"}
                            </h1>
                            <p className="text-xs text-[#3F463E]">
                              {currentUser?.email || "+91 98765 43210"}
                            </p>
                          </div>
                          <span className="text-[9px] bg-[#E2F2DF] text-[#276A3C] px-2 py-0.5 rounded-full font-bold">
                            Tier 1
                          </span>
                        </div>

                        {/* Verified Credentials Bar */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] bg-[#E2F2DF] text-[#0C150A] px-2.5 py-0.5 rounded-full font-bold">
                            Phone verified ✓
                          </span>
                          <span className="text-[10px] bg-[#E2F2DF] text-[#0C150A] px-2.5 py-0.5 rounded-full font-bold">
                            Aadhaar verified ✓
                          </span>
                          <span className="text-[10px] bg-black/5 text-[#0C150A] px-2.5 py-0.5 rounded-full font-bold">
                            Trust 98/100
                          </span>
                        </div>

                        {/* Producer Summary Matrix */}
                        <div className="grid grid-cols-3 gap-2 bg-white border border-black/5 rounded-2xl p-3 shadow-xs text-center">
                          <div>
                            <span className="text-[9px] text-[#3F463E] block">Batches</span>
                            <b className="text-sm text-[#0C150A]">3 Minted</b>
                          </div>
                          <div className="border-x border-black/5">
                            <span className="text-[9px] text-[#3F463E] block">Earnings</span>
                            <b className="text-sm text-[#276A3C]">₹1,12,000</b>
                          </div>
                          <div>
                            <span className="text-[9px] text-[#3F463E] block">CO₂ Net</span>
                            <b className="text-sm text-[#0C150A]">15.6 t</b>
                          </div>
                        </div>

                        {/* Menu Items */}
                        <div className="space-y-1.5 mt-1">
                          {[
                            { id: "account", icon: User, title: "Account settings", sub: "Kalol, Gujarat Facility" },
                            { id: "payouts", icon: Briefcase, title: "Payouts and payments", sub: "UPI · rameshp@upi" },
                            { id: "privacy", icon: Lock, title: "Privacy and security", sub: "Ed25519 Keystore Active" },
                            { id: "language", icon: Globe, title: "Language", sub: `Current: ${lang.toUpperCase()}` },
                            { id: "offline_queue", icon: RefreshCw, title: "Offline queue", sub: "0 photos waiting to upload" },
                            { id: "support", icon: HelpCircle, title: "Support & Helpline", sub: "Direct MRV Assistance" },
                          ].map((item, idx) => {
                            const IconComp = item.icon;
                            return (
                              <div
                                key={idx}
                                onClick={() => {
                                  playHapticSound("tap");
                                  setActiveProfileSheet(item.id);
                                }}
                                className="cursor-pointer p-3 rounded-2xl bg-white border border-black/5 hover:border-black/20 flex items-center justify-between transition-all shadow-xs"
                              >
                                <div className="flex items-center gap-2.5">
                                  <span className="w-7 h-7 rounded-full bg-[#E2F2DF] text-[#0C150A] flex items-center justify-center">
                                    <IconComp size={14} />
                                  </span>
                                  <div>
                                    <p className="text-xs font-extrabold text-[#0C150A]">{item.title}</p>
                                    {item.sub && <p className="text-[10px] text-[#3F463E]">{item.sub}</p>}
                                  </div>
                                </div>
                                <ChevronRight size={14} className="text-[#3F463E]" />
                              </div>
                            );
                          })}
                        </div>

                        {/* Sign Out / Account Switcher Button */}
                        <div className="pt-2">
                          <button
                            onClick={() => {
                              playHapticSound("tap");
                              if (currentUser) {
                                FirebaseAuthService.signOut();
                                setCurrentUser(sampleGoogleAccounts[0]);
                                setAuthToast("Switched user profile");
                              } else {
                                navigateTo("02_auth");
                              }
                            }}
                            className="w-full py-2.5 rounded-2xl border border-black/10 bg-white text-xs font-bold text-[#0C150A] hover:bg-black/5 transition-colors"
                          >
                            {currentUser ? `Switch User (${currentUser.email})` : "Sign In with Google / Phone"}
                          </button>
                        </div>
                      </div>

                      {renderBottomNav("profile")}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Apple Home Indicator Bar */}
            <div className="w-full h-5 flex items-center justify-center pb-2 select-none z-30">
              <div className="w-32 h-1 bg-black/20 rounded-full" />
            </div>
          </div>
        </div>

      {/* ============================================================== */}
      {/* MODALS & DRAWERS */}
      {/* ============================================================== */}

      {/* 1. Upload & In-App Camera Viewfinder Modal */}
      <AnimatePresence>
        {showCameraModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs font-['Inter',sans-serif]">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0C150A] text-white rounded-3xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-3.5 border border-white/15 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <Camera size={16} className="text-[#35C46A]" />
                  <div>
                    <h3 className="text-sm font-extrabold text-white">Upload & Verify Evidence</h3>
                    <p className="text-[9px] text-[#A6E3B8] font-mono">
                      {currentProjectConfig.shortTitle} · Enclave Lock
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCameraModal(false);
                    setPendingUploadPreview(null);
                  }}
                  className="p-1 text-white/60 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Mode Switcher */}
              <div className="grid grid-cols-2 gap-1 bg-white/5 p-1 rounded-2xl border border-white/10 text-xs font-bold">
                <button
                  onClick={() => {
                    setCameraCaptureMode("upload");
                    playHapticSound("tap");
                  }}
                  className={`py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    cameraCaptureMode === "upload"
                      ? "bg-[#35C46A] text-[#0C150A] shadow-md"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  <Upload size={13} />
                  <span>Upload File</span>
                </button>
                <button
                  onClick={() => {
                    setCameraCaptureMode("camera");
                    playHapticSound("tap");
                  }}
                  className={`py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    cameraCaptureMode === "camera"
                      ? "bg-[#35C46A] text-[#0C150A] shadow-md"
                      : "text-white/70 hover:text-white"
                  }`}
                >
                  <Camera size={13} />
                  <span>Sensor Camera</span>
                </button>
              </div>

              {isVerifyingPhoto ? (
                /* Active Verification Scanner */
                <div className="h-56 rounded-2xl bg-[#142213] border border-[#35C46A]/40 flex flex-col items-center justify-center p-4 text-center gap-3 relative overflow-hidden">
                  <div className="w-12 h-12 rounded-full border-3 border-[#35C46A]/20 border-t-[#35C46A] animate-spin flex items-center justify-center">
                    <Cpu size={18} className="text-[#35C46A] animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-white">AI + Algo Pipeline Running</h4>
                    <p className="text-[10px] text-[#A6E3B8] mt-1 font-mono">{verificationProgressStep}</p>
                  </div>
                  <div className="w-48 h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      initial={{ width: "10%" }}
                      animate={{ width: "95%" }}
                      transition={{ duration: 1.8, ease: "easeInOut" }}
                      className="h-full bg-[#35C46A] rounded-full"
                    />
                  </div>
                  <span className="text-[8px] font-mono text-white/50">Ed25519 Keystore Signature Pending</span>
                </div>
              ) : cameraCaptureMode === "upload" ? (
                /* Upload Mode View */
                <div className="space-y-3">
                  {pendingUploadPreview ? (
                    <div className="space-y-2">
                      <div className="relative aspect-4/3 rounded-2xl overflow-hidden border border-white/20 bg-black">
                        <img
                          src={pendingUploadPreview}
                          alt="Pending upload preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center text-[8px] font-mono text-white bg-black/75 px-2 py-1 rounded-lg backdrop-blur-xs">
                          <span>{currentProjectConfig.coords}</span>
                          <span className="text-[#35C46A]">Ready for AI Check</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 h-10 rounded-2xl bg-white/10 text-white font-bold text-xs hover:bg-white/15"
                        >
                          Change Photo
                        </button>
                        <button
                          onClick={() => handleCommitPhotoVerification()}
                          className="flex-2 h-10 rounded-2xl bg-[#35C46A] text-[#0C150A] font-extrabold text-xs shadow-md hover:bg-[#2eb05d] flex items-center justify-center gap-1.5"
                        >
                          <Cpu size={14} />
                          <span>Verify with AI + Algo</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-white/20 hover:border-[#35C46A]/60 bg-white/5 hover:bg-white/10 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
                      >
                        <div className="w-11 h-11 rounded-full bg-[#35C46A]/20 text-[#35C46A] flex items-center justify-center border border-[#35C46A]/40 group-hover:scale-110 transition-transform">
                          <Upload size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-white">Select image from your device</p>
                          <p className="text-[10px] text-white/50 mt-0.5">PNG, JPG, WEBP, HEIC up to 25MB</p>
                        </div>
                        <span className="text-[10px] font-bold text-[#35C46A] bg-[#35C46A]/20 px-3 py-1 rounded-full border border-[#35C46A]/30 mt-1">
                          Browse Files
                        </span>
                      </div>

                      {/* Quick Testing Preset Images */}
                      <div>
                        <span className="text-[10px] text-white/50 block mb-1 font-mono">
                          Or test with field sensor assets:
                        </span>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            onClick={() => {
                              // SVG Data URL for sample field photo
                              const svg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%231a3320"/><circle cx="200" cy="150" r="80" fill="%232d5a37"/><rect x="150" y="100" width="100" height="100" fill="%233e7b4c" rx="10"/><text x="200" y="155" font-family="monospace" font-size="14" fill="%23ffffff" text-anchor="middle font-weight="bold">${encodeURIComponent(currentProjectConfig.shortTitle.toUpperCase())} ASSET</text></svg>`;
                              setPendingUploadPreview(svg);
                              playHapticSound("tap");
                            }}
                            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-[#35C46A]/50 text-left text-[10px] font-bold text-white/80 hover:text-white"
                          >
                            <span className="block text-[#35C46A]">Asset Ground Truth</span>
                            <span className="text-[8px] text-white/50 font-normal">Physical site installation</span>
                          </button>
                          <button
                            onClick={() => {
                              const svg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23112211"/><rect x="60" y="60" width="280" height="180" fill="%231f4425" rx="12"/><line x1="60" y1="150" x2="340" y2="150" stroke="%2335C46A" stroke-width="2"/><text x="200" y="140" font-family="monospace" font-size="12" fill="%2335C46A" text-anchor="middle font-weight="bold">TELEMETRY SENSOR DIAL</text></svg>`;
                              setPendingUploadPreview(svg);
                              playHapticSound("tap");
                            }}
                            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-[#35C46A]/50 text-left text-[10px] font-bold text-white/80 hover:text-white"
                          >
                            <span className="block text-[#35C46A]">Sensor Hardware Log</span>
                            <span className="text-[8px] text-white/50 font-normal">Calibrated gauge dial</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Live Camera Mode View */
                <div className="space-y-3">
                  <div className="relative aspect-4/3 rounded-2xl bg-black border border-white/20 overflow-hidden flex flex-col justify-between p-3">
                    <div className="flex justify-between items-center text-[9px] text-white/70 font-mono">
                      <span>GPS: {currentProjectConfig.coords}</span>
                      <span className="text-[#35C46A] font-bold">LOCK 3D · ENCLAVE</span>
                    </div>

                    <div className="self-center border border-dashed border-[#35C46A] w-28 h-28 rounded-2xl flex items-center justify-center relative">
                      <div className="w-2.5 h-2.5 bg-[#35C46A] rounded-full animate-ping" />
                      <span className="absolute -top-3 text-[7px] font-mono bg-black/80 px-1 text-[#35C46A] rounded-xs">
                        AUTO-FOCUS
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[8px] text-[#A6E3B8] font-mono bg-black/60 px-2 py-0.5 rounded-md">
                      <span>Timestamp: 2026-10-13 09:36 UTC</span>
                      <span>Ed25519 Keystore</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      const svg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%230c1f10"/><circle cx="200" cy="150" r="90" fill="%231e4224"/><text x="200" y="155" font-family="monospace" font-size="14" fill="%23ffffff" text-anchor="middle" font-weight="bold">ENCLAVE CAPTURE: ${encodeURIComponent(currentProjectConfig.shortTitle.toUpperCase())}</text></svg>`;
                      handleCommitPhotoVerification(svg);
                    }}
                    className="w-full h-12 rounded-2xl bg-[#35C46A] text-[#0C150A] font-extrabold text-xs shadow-md hover:bg-[#2eb05d] transition-colors flex items-center justify-center gap-2"
                  >
                    <Camera size={16} />
                    <span>Capture & Verify with AI + Algo</span>
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Equipment Picker Modal */}
      <AnimatePresence>
        {showEquipmentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white text-[#0C150A] rounded-3xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-3 border border-black/10"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold">{currentProjectConfig.shortTitle} Instrumentation</h3>
                  <p className="text-[10px] text-[#3F463E]">Select verified equipment & sensor suite</p>
                </div>
                <button onClick={() => setShowEquipmentModal(false)} className="p-1">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2">
                {currentProjectConfig.equipmentOptions.map((eqOption, idx) => (
                  <div
                    key={eqOption}
                    onClick={() => {
                      setProjectMetricValues((prev) => ({
                        ...prev,
                        [selectedProjectId]: {
                          ...prev[selectedProjectId],
                          eq: eqOption,
                        },
                      }));
                      setEquipmentType(eqOption);
                      setShowEquipmentModal(false);
                      playHapticSound("tap");
                    }}
                    className={`cursor-pointer p-3 rounded-2xl border transition-all ${
                      currentEquipment === eqOption
                        ? "bg-[#E2F2DF] border-[#0C150A]"
                        : "bg-[#F7F9F6] border-black/10 hover:bg-black/5"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-extrabold text-[#0C150A]">{eqOption}</p>
                      {currentEquipment === eqOption && (
                        <span className="text-[9px] font-bold text-[#276A3C]">Selected ✓</span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#3F463E] mt-0.5 font-mono">
                      Hardware Enclave: SEC-HW-{selectedProjectId.toUpperCase()}-0{idx + 1}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. Evidence Audit Dossier Modal */}
      <AnimatePresence>
        {showEvidenceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white text-[#0C150A] rounded-3xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-3 border border-black/10 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-black/10 pb-2">
                <div>
                  <h3 className="text-sm font-extrabold text-[#0C150A]">Evidence Audit Dossier</h3>
                  <p className="text-[10px] text-[#276A3C]">Batch #3 · Kalol, Gujarat</p>
                </div>
                <button onClick={() => setShowEvidenceModal(false)} className="p-1">
                  <X size={16} />
                </button>
              </div>

              <div className="bg-[#F7F9F6] rounded-2xl p-3 border border-black/5">
                <span className="text-[10px] font-bold text-[#0C150A] block mb-1">
                  1. Geotagged Site Photos (3/6 Verified)
                </span>
                <div className="grid grid-cols-3 gap-1 mt-1">
                  <div className="h-12 rounded-lg bg-[#E2F2DF] border border-black/5 flex flex-col items-center justify-center text-[8px] text-center p-1">
                    <span>Feedstock Pile</span>
                    <span className="text-[#276A3C] font-bold">✓ Signed</span>
                  </div>
                  <div className="h-12 rounded-lg bg-[#E2F2DF] border border-black/5 flex flex-col items-center justify-center text-[8px] text-center p-1">
                    <span>Kiln Operation</span>
                    <span className="text-[#276A3C] font-bold">✓ Signed</span>
                  </div>
                  <div className="h-12 rounded-lg bg-[#E2F2DF] border border-black/5 flex flex-col items-center justify-center text-[8px] text-center p-1">
                    <span>Biochar Output</span>
                    <span className="text-[#276A3C] font-bold">✓ Signed</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#F7F9F6] rounded-2xl p-3 border border-black/5">
                <div className="flex justify-between items-center text-[10px] font-bold text-[#0C150A] mb-1">
                  <span>2. Reactor Thermocouple Log</span>
                  <span className="text-[#276A3C] font-mono text-[9px]">550°C (4.2h)</span>
                </div>
                <div className="h-10 w-full bg-[#E2F2DF] rounded-lg flex items-end px-2 py-1 gap-1">
                  {[20, 45, 75, 90, 92, 91, 88, 85, 60, 30].map((h, i) => (
                    <div key={i} style={{ height: `${h}%` }} className="flex-1 bg-[#0C150A] rounded-xs" />
                  ))}
                </div>
              </div>

              <div className="bg-[#F7F9F6] rounded-2xl p-3 border border-black/5 text-xs">
                <span className="text-[10px] font-bold text-[#0C150A] block mb-1">
                  3. Lab Assay · Carbon Fraction
                </span>
                <div className="flex justify-between text-[10px] text-[#3F463E] py-0.5">
                  <span>Elemental Carbon (Corg)</span>
                  <b className="text-[#0C150A]">78.4%</b>
                </div>
                <div className="flex justify-between text-[10px] text-[#3F463E] py-0.5">
                  <span>H:C Organic Ratio</span>
                  <b className="text-[#276A3C]">0.42 (&lt; 0.70 limit)</b>
                </div>
              </div>

              <div className="bg-[#F7F9F6] rounded-2xl p-3 border border-black/5 text-xs">
                <span className="text-[10px] font-bold text-[#0C150A] block mb-1">
                  4. Verifier Signatures
                </span>
                <div className="flex justify-between text-[10px] py-0.5 border-b border-black/5">
                  <span>Gujarat Carbon Audit Council</span>
                  <span className="text-[#276A3C] font-bold">✓ Approved</span>
                </div>
                <div className="flex justify-between text-[10px] py-0.5">
                  <span>Global MRV Alliance</span>
                  <span className="text-[#92400E] font-bold">● In Review</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowEvidenceModal(false);
                  navigateTo("07_zk_proof");
                }}
                className="w-full h-11 rounded-full bg-[#0C150A] text-white font-extrabold text-xs shadow-md"
              >
                Proceed to Zero-Knowledge Proof
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. High-Fidelity Retirement Certificate Modal */}
      <AnimatePresence>
        {showCertificateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#FBFDFB] text-[#0C150A] rounded-3xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-3 border-4 border-[#0C150A]"
            >
              <div className="flex justify-between items-center border-b border-black/10 pb-2">
                <div className="flex items-center gap-2">
                  <AtmosIcon name="mk" size={22} className="text-[#0C150A]" />
                  <span className="font-extrabold text-xs uppercase tracking-wider text-[#0C150A]">
                    Atmos Retirement Certificate
                  </span>
                </div>
                <button onClick={() => setShowCertificateModal(false)} className="text-black/60">
                  <X size={16} />
                </button>
              </div>

              <div className="text-center py-1">
                <p className="text-[9px] text-[#3F463E] uppercase font-bold tracking-widest">
                  Officially Retired On Solana Devnet
                </p>
                <p className="text-2xl font-black text-[#0C150A] mt-0.5">5.000 tCO₂e</p>
                <p className="text-xs text-[#276A3C] font-extrabold">Permanent Biochar Carbon Removal</p>
              </div>

              <div className="space-y-1 text-xs bg-[#F7F9F6] p-3 rounded-2xl border border-black/5">
                <div className="flex justify-between">
                  <span className="text-[#3F463E]">Batch</span>
                  <b>Biochar Batch #3 (Kalol)</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#3F463E]">Solana Tx</span>
                  <b className="font-mono text-[9px]">5ayYk…2z21</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#3F463E]">Methodology</span>
                  <b>ATMOS-BIOCHAR-PILOT-v1</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#3F463E]">Certificate ID</span>
                  <b className="font-mono text-[9px]">ATMOS-CERT-2026-003</b>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  onClick={() => alert("Retirement Certificate PDF downloaded to your device!")}
                  className="flex-1 h-10 rounded-full bg-[#0C150A] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Download size={13} /> Download PDF
                </button>
                <button
                  onClick={() => alert("Verification URL copied to clipboard: https://atmos.eco/verify/5ayYk2z21")}
                  className="h-10 px-3.5 rounded-full border border-black/10 font-bold text-xs flex items-center justify-center"
                >
                  <Share2 size={13} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Dodo Payments Checkout Gateway Modal */}
      <AnimatePresence>
        {showDodoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-['Inter',sans-serif]">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white text-[#0C150A] rounded-3xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-3.5 border border-black/10 max-h-[90vh] overflow-y-auto"
            >
              {/* Dodo Header */}
              <div className="flex items-center justify-between border-b border-black/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#0C150A] text-white flex items-center justify-center text-xs font-black shadow-xs">
                    D
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#0C150A] flex items-center gap-1.5">
                      <span>Dodo Payments Checkout</span>
                      <span className="text-[8px] bg-[#E2F2DF] text-[#276A3C] font-mono px-1 py-0.2 rounded-xs">MoR</span>
                    </h3>
                    <p className="text-[9px] text-[#3F463E]">
                      Global Merchant of Record · Smart Escrow
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDodoModal(false)}
                  className="w-7 h-7 rounded-full bg-black/5 flex items-center justify-center text-black/60 hover:text-black hover:bg-black/10 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Order Amount Card */}
              <div className="bg-[#F7F9F6] p-3 rounded-2xl border border-black/5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#3F463E] block">Amount to Settle</span>
                  <p className="text-2xl font-black text-[#0C150A]">
                    ₹{Math.round(purchaseTonnes * 11100).toLocaleString("en-IN")}
                  </p>
                  <span className="text-[9.5px] text-[#276A3C] font-mono font-bold">
                    {purchaseTonnes.toFixed(2)} tCO₂e · {currentProjectConfig.shortTitle}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-white bg-[#0C150A] px-2 py-0.5 rounded-full font-mono font-bold block mb-1">
                    ≈ ${DodoPaymentsService.inrToUsd(Math.round(purchaseTonnes * 11100))} USD
                  </span>
                  <span className="text-[8px] text-[#3F463E] font-mono">0% Forex Fee</span>
                </div>
              </div>

              {/* Dodo Checkout Tabs */}
              <div className="grid grid-cols-3 gap-1 bg-[#F1F1F1] p-1 rounded-2xl text-[10px] font-bold">
                <button
                  onClick={() => {
                    playHapticSound("tap");
                    setDodoCheckoutTab("upi");
                  }}
                  className={`py-1.5 rounded-xl transition-all flex items-center justify-center gap-1 ${
                    dodoCheckoutTab === "upi" ? "bg-white text-[#0C150A] shadow-xs" : "text-[#3F463E] hover:text-[#0C150A]"
                  }`}
                >
                  <QrCode size={11} />
                  <span>UPI QR</span>
                </button>
                <button
                  onClick={() => {
                    playHapticSound("tap");
                    setDodoCheckoutTab("card");
                  }}
                  className={`py-1.5 rounded-xl transition-all flex items-center justify-center gap-1 ${
                    dodoCheckoutTab === "card" ? "bg-white text-[#0C150A] shadow-xs" : "text-[#3F463E] hover:text-[#0C150A]"
                  }`}
                >
                  <CreditCard size={11} />
                  <span>Card</span>
                </button>
                <button
                  onClick={() => {
                    playHapticSound("tap");
                    setDodoCheckoutTab("netbanking");
                  }}
                  className={`py-1.5 rounded-xl transition-all flex items-center justify-center gap-1 ${
                    dodoCheckoutTab === "netbanking" ? "bg-white text-[#0C150A] shadow-xs" : "text-[#3F463E] hover:text-[#0C150A]"
                  }`}
                >
                  <DollarSign size={11} />
                  <span>NetBanking</span>
                </button>
              </div>

              {/* Tab 1: UPI QR */}
              {dodoCheckoutTab === "upi" && (
                <div className="space-y-2.5">
                  <div className="bg-[#F7F9F6] p-3 rounded-2xl border border-black/5 flex flex-col items-center text-center gap-2">
                    {/* Simulated Dodo UPI QR Code */}
                    <div className="w-32 h-32 bg-white rounded-2xl p-2 border-2 border-black/10 shadow-xs flex items-center justify-center relative">
                      <div className="w-full h-full bg-[#0C150A] rounded-xl p-1.5 flex items-center justify-center">
                        <div className="w-full h-full bg-white grid grid-cols-5 gap-0.5 p-1 rounded-lg">
                          <div className="bg-black col-span-2 row-span-2 rounded-xs" />
                          <div className="bg-black" />
                          <div className="bg-black col-span-2 row-span-2 rounded-xs" />
                          <div className="bg-black" />
                          <div className="bg-black" />
                          <div className="bg-white" />
                          <div className="bg-black" />
                          <div className="bg-black" />
                          <div className="bg-black col-span-2 row-span-2 rounded-xs" />
                          <div className="bg-black" />
                          <div className="bg-black" />
                          <div className="bg-black" />
                        </div>
                      </div>
                      <div className="absolute w-7 h-7 rounded-full bg-[#0C150A] text-white flex items-center justify-center text-[10px] font-black border-2 border-white shadow-xs">
                        D
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-[#0C150A]">
                        <span>VPA: atmos.carbon@dodoescrow</span>
                        <button
                          onClick={() => {
                            navigator.clipboard?.writeText("atmos.carbon@dodoescrow");
                            playHapticSound("tap");
                            setAuthToast("Copied Dodo Escrow UPI VPA ✓");
                            setTimeout(() => setAuthToast(null), 2500);
                          }}
                          className="text-[#276A3C] hover:underline"
                        >
                          <Copy size={10} />
                        </button>
                      </div>
                      <p className="text-[9.5px] text-[#3F463E] mt-0.5">
                        Scan with Google Pay, PhonePe, Paytm, or BHIM
                      </p>
                      <span className="text-[8.5px] font-mono text-[#D97706] bg-[#FEF3C7] px-2 py-0.5 rounded-full inline-block mt-1 font-bold">
                        Expires in 04:58 · Auto-Polling Active
                      </span>
                    </div>
                  </div>

                  <button
                    disabled={isDodoProcessing}
                    onClick={handleConfirmDodoPayment}
                    className="w-full h-11 rounded-full bg-[#0C150A] text-white font-extrabold text-xs shadow-md hover:bg-black transition-colors flex items-center justify-center gap-1.5"
                  >
                    {isDodoProcessing ? (
                      <>
                        <RefreshCw size={14} className="animate-spin text-[#35C46A]" />
                        <span>Verifying UPI Receipt via Svix...</span>
                      </>
                    ) : (
                      <>
                        <Check size={14} className="text-[#35C46A]" />
                        <span>Simulate App Approval & Release Escrow</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Tab 2: Credit / Debit Card */}
              {dodoCheckoutTab === "card" && (
                <div className="space-y-2">
                  <div className="space-y-1.5 text-[10px]">
                    <div>
                      <label className="text-[#3F463E] font-bold block mb-0.5">Card Number</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={dodoCardNumber}
                          onChange={(e) => setDodoCardNumber(e.target.value)}
                          className="w-full h-9 rounded-xl border border-black/15 px-3 font-mono text-xs text-[#0C150A] bg-[#F7F9F6] focus:outline-none focus:border-[#0C150A]"
                        />
                        <span className="absolute right-3 top-2.5 text-[8.5px] font-bold text-[#276A3C]">
                          VISA / MC
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <label className="text-[#3F463E] font-bold block mb-0.5">Expires (MM/YY)</label>
                        <input
                          type="text"
                          value={dodoCardExpiry}
                          onChange={(e) => setDodoCardExpiry(e.target.value)}
                          className="w-full h-9 rounded-xl border border-black/15 px-3 font-mono text-xs text-[#0C150A] bg-[#F7F9F6] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[#3F463E] font-bold block mb-0.5">CVV / CVC</label>
                        <input
                          type="password"
                          value={dodoCardCvv}
                          onChange={(e) => setDodoCardCvv(e.target.value)}
                          className="w-full h-9 rounded-xl border border-black/15 px-3 font-mono text-xs text-[#0C150A] bg-[#F7F9F6] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[#3F463E] font-bold block mb-0.5">Cardholder Name</label>
                      <input
                        type="text"
                        value={dodoCardHolder}
                        onChange={(e) => setDodoCardHolder(e.target.value)}
                        className="w-full h-9 rounded-xl border border-black/15 px-3 text-xs text-[#0C150A] bg-[#F7F9F6] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[8px] text-[#3F463E] px-1">
                    <span>3D Secure 2.0 Verified</span>
                    <span className="text-[#276A3C] font-bold">256-Bit SSL Encrypted</span>
                  </div>

                  <button
                    disabled={isDodoProcessing}
                    onClick={handleConfirmDodoPayment}
                    className="w-full h-11 rounded-full bg-[#0C150A] text-white font-extrabold text-xs shadow-md hover:bg-black transition-colors flex items-center justify-center gap-1.5"
                  >
                    {isDodoProcessing ? (
                      <>
                        <RefreshCw size={14} className="animate-spin text-[#35C46A]" />
                        <span>Processing with Dodo MoR...</span>
                      </>
                    ) : (
                      <span>Pay ₹{Math.round(purchaseTonnes * 11100).toLocaleString("en-IN")} via Dodo MoR</span>
                    )}
                  </button>
                </div>
              )}

              {/* Tab 3: NetBanking */}
              {dodoCheckoutTab === "netbanking" && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                    {["HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank", "Kotak Mahindra", "Punjab National"].map((b, i) => (
                      <button
                        key={b}
                        onClick={() => playHapticSound("tap")}
                        className={`p-2 rounded-xl border text-left font-bold transition-all ${
                          i === 0 ? "border-[#0C150A] bg-[#E2F2DF] text-[#0C150A]" : "border-black/10 bg-[#F7F9F6] text-[#3F463E]"
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>

                  <button
                    disabled={isDodoProcessing}
                    onClick={handleConfirmDodoPayment}
                    className="w-full h-11 rounded-full bg-[#0C150A] text-white font-extrabold text-xs shadow-md hover:bg-black transition-colors flex items-center justify-center gap-1.5"
                  >
                    {isDodoProcessing ? (
                      <>
                        <RefreshCw size={14} className="animate-spin text-[#35C46A]" />
                        <span>Authorizing Bank Portal...</span>
                      </>
                    ) : (
                      <span>Authorize via HDFC NetBanking</span>
                    )}
                  </button>
                </div>
              )}

              {/* Security Escrow Notice */}
              <div className="bg-[#E2F2DF] p-2 rounded-xl border border-[#276A3C]/20 text-[8.5px] text-[#276A3C] font-mono leading-relaxed text-center">
                Svix Webhook signature: HMAC-SHA256 · Funds held in Dodo Escrow until permanent retirement deed on Solana Devnet.
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5B. Phantom Solana Web3 Wallet Modal */}
      <AnimatePresence>
        {showWalletModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs font-['Inter',sans-serif]">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0C150A] text-white rounded-3xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-3.5 border border-white/15 max-h-[90vh] overflow-y-auto"
            >
              {/* Wallet Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#512da8] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Wallet size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                      <span>Phantom Wallet</span>
                      <span className="w-2 h-2 rounded-full bg-[#35C46A] animate-ping" />
                    </h3>
                    <p className="text-[9px] text-[#A6E3B8] font-mono">
                      Solana Devnet · Alt-bn128 Precompile Ready
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowWalletModal(false)}
                  className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Address Card */}
              <div className="bg-white/5 p-3 rounded-2xl border border-white/10 space-y-1.5 font-mono text-[10px]">
                <div className="flex justify-between items-center text-white/60">
                  <span>CONNECTED ADDRESS</span>
                  <span className="text-[#35C46A] font-bold">DEVNET (32/32)</span>
                </div>
                <div className="flex items-center justify-between bg-black/40 p-2 rounded-xl border border-white/5">
                  <span className="text-[#35C46A] truncate pr-2">
                    {walletState.publicKey || PhantomSolanaService.FALLBACK_PUBKEY}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(walletState.publicKey || PhantomSolanaService.FALLBACK_PUBKEY);
                      playHapticSound("tap");
                      setAuthToast("Copied Phantom Public Key to clipboard ✓");
                      setTimeout(() => setAuthToast(null), 2500);
                    }}
                    className="text-white/60 hover:text-white p-1"
                    title="Copy Address"
                  >
                    <Copy size={12} />
                  </button>
                </div>
              </div>

              {/* Balances Card */}
              <div className="grid grid-cols-2 gap-2 font-mono">
                <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                  <span className="text-[9px] text-white/50 block">SOL BALANCE</span>
                  <p className="text-base font-extrabold text-white mt-0.5">
                    {walletState.solBalance} SOL
                  </p>
                  <span className="text-[8px] text-[#35C46A]">
                    ≈ ${(walletState.solBalance * 142).toFixed(2)} USD
                  </span>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                  <span className="text-[9px] text-white/50 block">USDC BALANCE</span>
                  <p className="text-base font-extrabold text-[#35C46A] mt-0.5">
                    ${walletState.usdcBalance.toLocaleString()}
                  </p>
                  <span className="text-[8px] text-white/60 font-sans">
                    Solana Pay Ready
                  </span>
                </div>
              </div>

              {/* Wallet Actions */}
              <div className="space-y-1.5 pt-1">
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={handleAirdropDevnetSol}
                    className="h-10 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-[10px] transition-colors flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw size={12} />
                    <span>Airdrop +1.0 SOL</span>
                  </button>
                  <button
                    onClick={() => {
                      const url = `https://solscan.io/account/${walletState.publicKey || PhantomSolanaService.FALLBACK_PUBKEY}?cluster=devnet`;
                      navigator.clipboard?.writeText(url);
                      playHapticSound("tap");
                      setAuthToast("Copied Devnet Solscan Account URL ✓");
                      setTimeout(() => setAuthToast(null), 2500);
                    }}
                    className="h-10 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-[10px] transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink size={12} />
                    <span>View on Solscan</span>
                  </button>
                </div>

                <button
                  onClick={() => {
                    if (walletState.isConnected) {
                      handleDisconnectPhantom();
                    } else {
                      handleConnectPhantom();
                    }
                  }}
                  className={`w-full h-11 rounded-full font-extrabold text-xs shadow-md transition-colors ${
                    walletState.isConnected
                      ? "bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30"
                      : "bg-[#512da8] text-white hover:bg-[#4527a0]"
                  }`}
                >
                  {walletState.isConnected ? "Disconnect Phantom Wallet" : "Connect Phantom Wallet"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. Profile Sub-Sheets */}
      <AnimatePresence>
        {activeProfileSheet && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white text-[#0C150A] rounded-3xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-3 border border-black/10"
            >
              <div className="flex items-center justify-between border-b border-black/10 pb-2">
                <h3 className="text-sm font-extrabold text-[#0C150A] capitalize">
                  {activeProfileSheet.replace("_", " ")}
                </h3>
                <button onClick={() => setActiveProfileSheet(null)} className="p-1">
                  <X size={16} />
                </button>
              </div>

              {activeProfileSheet === "account" && (
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-2xl bg-[#F7F9F6] border border-black/5">
                    <span className="text-[#3F463E] block text-[10px]">Producer Name</span>
                    <b className="text-sm text-[#0C150A]">Ramesh Patel</b>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-[#F7F9F6] border border-black/5">
                    <span className="text-[#3F463E] block text-[10px]">Farm Site Coordinates</span>
                    <b>23.2798° N, 72.4922° E (Kalol, Gujarat)</b>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-[#F7F9F6] border border-black/5">
                    <span className="text-[#3F463E] block text-[10px]">Aadhaar XML Status</span>
                    <b className="text-[#276A3C]">✓ Verified Offline (No Storage)</b>
                  </div>
                </div>
              )}

              {activeProfileSheet === "payouts" && (
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-2xl bg-[#F7F9F6] border border-black/5">
                    <span className="text-[#3F463E] block text-[10px]">Active UPI VPA</span>
                    <b className="text-sm text-[#276A3C]">rameshp@upi</b>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-[#F7F9F6] border border-black/5">
                    <span className="text-[#3F463E] block text-[10px]">Total Payouts Received</span>
                    <b className="text-base text-[#0C150A]">₹22,000</b>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-[#F7F9F6] border border-black/5">
                    <span className="text-[#3F463E] block text-[10px]">Settlement Schedule</span>
                    <b>Instant on Solana Smart Contract Execution</b>
                  </div>
                </div>
              )}

              {activeProfileSheet === "privacy" && (
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-2xl bg-[#F7F9F6] border border-black/5">
                    <span className="text-[#3F463E] block text-[10px]">Device Ed25519 Public Key</span>
                    <b className="font-mono text-[9px] text-[#276A3C] break-all">
                      AtmoS7x89K2lm99QwLa771vM2kZ18bQs8XfVjC3982KLmN5v
                    </b>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-[#F7F9F6] border border-black/5">
                    <span className="text-[#3F463E] block text-[10px]">Zero-Knowledge Prover</span>
                    <b className="text-[#276A3C]">Local WebAssembly Circuit Active</b>
                  </div>
                </div>
              )}

              {activeProfileSheet === "language" && (
                <div className="space-y-1.5 text-xs">
                  {[
                    { code: "en", name: "English" },
                    { code: "hi", name: "हिन्दी (Hindi)" },
                    { code: "gu", name: "ગુજરાતી (Gujarati)" },
                  ].map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLang(l.code as any);
                        setActiveProfileSheet(null);
                        playHapticSound("tap");
                      }}
                      className={`w-full text-left p-2.5 rounded-2xl border transition-colors ${
                        lang === l.code
                          ? "bg-[#0C150A] text-white font-bold"
                          : "bg-[#F7F9F6] border-black/5 hover:bg-black/5"
                      }`}
                    >
                      {l.name}
                    </button>
                  ))}
                </div>
              )}

              {activeProfileSheet === "offline_queue" && (
                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-2xl bg-[#E2F2DF] text-[#0C150A] font-bold text-center">
                    ✓ All offline evidence photos have synced with Solana!
                  </div>
                  <p className="text-[10px] text-[#3F463E] leading-relaxed">
                    Photos captured without cellular data are saved in local encrypted SQLite and uploaded automatically upon reconnection.
                  </p>
                </div>
              )}

              {activeProfileSheet === "support" && (
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-2xl bg-[#F7F9F6] border border-black/5">
                    <span className="text-[#3F463E] block text-[10px]">MRV Methodology Documentation</span>
                    <b className="text-[#276A3C]">ATMOS-BIOCHAR-PILOT-v1 Specification</b>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-[#F7F9F6] border border-black/5">
                    <span className="text-[#3F463E] block text-[10px]">Verifier Helpline</span>
                    <b>support@atmos.eco · +91 79 4000 2300</b>
                  </div>
                </div>
              )}

              <button
                onClick={() => setActiveProfileSheet(null)}
                className="w-full h-10 rounded-full bg-[#F1F1F1] text-[#0C150A] font-bold text-xs hover:bg-[#E2F2DF] transition-colors"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. Comprehensive Solana ZK Tokenization Explorer Modal */}
      <AnimatePresence>
        {showSolanaTxModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs font-['Inter',sans-serif]">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0C150A] text-white rounded-3xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-3.5 border border-white/15 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#35C46A]/20 text-[#35C46A] flex items-center justify-center border border-[#35C46A]/40 shrink-0">
                    <Shield size={16} className="text-[#35C46A]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                      <span>Solana ZK Token Explorer</span>
                      <span className="w-2 h-2 rounded-full bg-[#35C46A] animate-ping" />
                    </h3>
                    <p className="text-[9px] text-[#A6E3B8] font-mono">
                      SPL Token-2022 · Devnet Slot #250,231
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSolanaTxModal(false)}
                  className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Status Banner */}
              <div className="bg-[#142213] border border-[#35C46A]/30 rounded-2xl p-2.5 flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <CheckCheck size={14} className="text-[#35C46A]" />
                  <span className="text-[#35C46A] font-extrabold text-[10px]">FINALIZED (32/32)</span>
                </div>
                <span className="text-white/60 text-[9px]">124,820 CU · $0.0007 Fee</span>
              </div>

              {/* Section 1: Transaction & Token Record */}
              <div className="bg-white/5 rounded-2xl p-3 font-mono text-[10px] space-y-2 border border-white/10">
                <div className="flex justify-between items-center text-[#35C46A] font-bold text-[10px] border-b border-white/10 pb-1">
                  <span>ON-CHAIN TRANSACTION RECORD</span>
                  <span>DEVNET</span>
                </div>

                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/50 text-[9px]">Tx Signature:</span>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(activeSolanaTxSig);
                        playHapticSound("tap");
                        setAuthToast("Copied Solana Transaction Signature ✓");
                        setTimeout(() => setAuthToast(null), 2500);
                      }}
                      className="text-[#35C46A] hover:underline flex items-center gap-0.5 text-[8.5px]"
                    >
                      <Copy size={9} /> Copy
                    </button>
                  </div>
                  <p className="text-white text-[9.5px] break-all bg-black/40 p-1.5 rounded-lg border border-white/5 mt-0.5 select-all">
                    {activeSolanaTxSig}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                  <div>
                    <span className="text-white/50 text-[9px] block">Token Standard:</span>
                    <span className="text-white font-bold text-[9px]">SPL Token-2022</span>
                  </div>
                  <div>
                    <span className="text-white/50 text-[9px] block">Extension:</span>
                    <span className="text-[#35C46A] font-bold text-[9px]">Confidential Transfer</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/50 text-[9px]">Token Mint:</span>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(`AtmoS_${currentProjectConfig.shortTitle.toUpperCase().replace(/\s+/g, '')}_DEVNET_MINT`);
                        playHapticSound("tap");
                        setAuthToast("Copied Token Mint Address ✓");
                        setTimeout(() => setAuthToast(null), 2500);
                      }}
                      className="text-[#35C46A] hover:underline flex items-center gap-0.5 text-[8.5px]"
                    >
                      <Copy size={9} /> Copy
                    </button>
                  </div>
                  <p className="text-[#35C46A] text-[9px] break-all">
                    AtmoS_{currentProjectConfig.shortTitle.toUpperCase().replace(/\s+/g, '')}_DEVNET_MINT
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-0.5 border-t border-white/5">
                  <div>
                    <span className="text-white/50 text-[9px] block">Shielded Mint (90%):</span>
                    <span className="text-emerald-400 font-bold text-[10px]">
                      {(parseFloat(currentProjectConfig.co2Estimated) * 0.9).toFixed(3)} tCO₂e
                    </span>
                  </div>
                  <div>
                    <span className="text-white/50 text-[9px] block">Reserve Pool (10%):</span>
                    <span className="text-white font-bold text-[10px]">
                      {(parseFloat(currentProjectConfig.co2Estimated) * 0.1).toFixed(3)} tCO₂e
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Zero-Knowledge Groth16 Details */}
              <div className="bg-white/5 rounded-2xl p-3 font-mono text-[10px] space-y-1.5 border border-white/10">
                <div className="flex justify-between items-center text-[#35C46A] font-bold text-[10px] border-b border-white/10 pb-1">
                  <span className="flex items-center gap-1">
                    <Cpu size={11} />
                    <span>ZERO-KNOWLEDGE WITNESS & PROOF</span>
                  </span>
                  <span>GROTH16 BN254</span>
                </div>

                <div className="flex justify-between items-center text-[9px]">
                  <span className="text-white/50">Circom Circuit:</span>
                  <span className="text-white">{currentProjectConfig.shortTitle.replace(/\s+/g, '')}Sequestration.circom</span>
                </div>

                <div>
                  <div className="flex justify-between items-center text-[9px]">
                    <span className="text-white/50">Proof Commitment:</span>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(activeZKCommitment);
                        playHapticSound("tap");
                        setAuthToast("Copied ZK Proof Commitment ✓");
                        setTimeout(() => setAuthToast(null), 2500);
                      }}
                      className="text-[#35C46A] hover:underline flex items-center gap-0.5 text-[8.5px]"
                    >
                      <Copy size={9} /> Copy
                    </button>
                  </div>
                  <p className="text-[#35C46A] text-[9px] break-all bg-black/40 p-1 rounded-md border border-white/5 mt-0.5">
                    {activeZKCommitment}
                  </p>
                </div>

                <div className="flex justify-between items-center text-[9px]">
                  <span className="text-white/50">Nullifier Hash:</span>
                  <span className="text-white/90">nullifier_{selectedProjectId}_{activeZKCommitment.slice(-8)}</span>
                </div>

                <div className="flex justify-between items-center text-[9px]">
                  <span className="text-white/50">Solana Syscall:</span>
                  <span className="text-[#35C46A] font-bold">alt_bn128 paired curve (PASSED)</span>
                </div>

                <div className="flex justify-between items-center text-[9px]">
                  <span className="text-white/50">Satellite Orbit Match:</span>
                  <span className="text-white">{currentProjectConfig.satelliteBadge} (Sentinel-2)</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-1.5 pt-1">
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => {
                      const url = `https://solscan.io/tx/${activeSolanaTxSig}?cluster=devnet`;
                      navigator.clipboard?.writeText(url);
                      playHapticSound("tap");
                      setAuthToast("Copied Solscan Devnet Explorer URL ✓");
                      setTimeout(() => setAuthToast(null), 2500);
                    }}
                    className="h-10 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-[10px] transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink size={12} />
                    <span>Copy Solscan URL</span>
                  </button>
                  <button
                    onClick={() => {
                      playHapticSound("success");
                      setAuthToast("alt_bn128 Groth16 Precompile Syscall: 0 errors, 4,892 constraints OK ✓");
                      setTimeout(() => setAuthToast(null), 3000);
                    }}
                    className="h-10 rounded-2xl bg-white/10 hover:bg-white/15 text-[#35C46A] font-bold text-[10px] transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ShieldCheck size={12} />
                    <span>Re-verify Syscall</span>
                  </button>
                </div>

                <button
                  onClick={() => setShowSolanaTxModal(false)}
                  className="w-full h-11 rounded-full bg-[#35C46A] text-[#0C150A] font-extrabold text-xs shadow-md hover:bg-[#2eb05d] transition-colors"
                >
                  Close Solana Explorer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. Notification Modal */}
      <AnimatePresence>
        {showNotificationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white text-[#0C150A] rounded-3xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-3 border border-black/10"
            >
              <div className="flex items-center justify-between border-b border-black/10 pb-2">
                <div className="flex items-center gap-2">
                  <AtmosIcon name="bl" size={16} />
                  <h3 className="text-sm font-extrabold">Notifications</h3>
                </div>
                <button onClick={() => setShowNotificationModal(false)} className="p-1">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-2xl bg-[#E2F2DF] border border-black/5">
                  <p className="font-extrabold text-[#0C150A]">Batch #2 Credits Issued</p>
                  <p className="text-[10px] text-[#3F463E]">18.000 tCO₂e minted on Solana Devnet</p>
                </div>
                <div className="p-3 rounded-2xl bg-[#F7F9F6] border border-black/5">
                  <p className="font-extrabold text-[#0C150A]">UPI Payout Received</p>
                  <p className="text-[10px] text-[#3F463E]">₹22,000 credited to rameshp@upi</p>
                </div>
                <div className="p-3 rounded-2xl bg-[#F7F9F6] border border-black/5">
                  <p className="font-extrabold text-[#0C150A]">Batch #3 Auditor Assigned</p>
                  <p className="text-[10px] text-[#3F463E]">Gujarat Carbon Audit Council in review</p>
                </div>
              </div>

              <button
                onClick={() => setShowNotificationModal(false)}
                className="w-full h-10 rounded-full bg-[#0C150A] text-white font-extrabold text-xs"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 9. Google Firebase Account Picker Modal */}
      <AnimatePresence>
        {showGoogleAccountPicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white text-[#0C150A] rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4 border border-black/10 font-['Inter',sans-serif]"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#0C150A]">Sign in with Google</h3>
                    <p className="text-[10px] text-[#3F463E]">Firebase Authentication</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowGoogleAccountPicker(false)}
                  className="p-1 rounded-full hover:bg-black/5 text-[#3F463E]"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="text-xs text-[#3F463E]">
                Choose a verified producer or developer account to sign in to Atmos:
              </div>

              <div className="space-y-2">
                {sampleGoogleAccounts.map((account) => (
                  <motion.div
                    key={account.uid}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleGoogleSignIn(account)}
                    className="p-3 rounded-2xl border border-black/10 hover:border-[#0C150A] hover:bg-[#F7F9F6] transition-all cursor-pointer flex items-center justify-between shadow-2xs group"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={account.photoURL}
                        alt={account.displayName}
                        className="w-9 h-9 rounded-full object-cover ring-2 ring-black/5"
                      />
                      <div>
                        <b className="text-xs text-[#0C150A] block group-hover:text-[#276A3C] transition-colors">
                          {account.displayName}
                        </b>
                        <span className="text-[10px] text-[#3F463E] font-mono">{account.email}</span>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-[#3F463E] group-hover:translate-x-0.5 transition-transform" />
                  </motion.div>
                ))}
              </div>

              <div className="pt-1 border-t border-black/5 text-[10px] text-[#3F463E] flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Shield size={11} className="text-[#276A3C]" />
                  Firebase Identity Platform Secure OAuth
                </span>
                <span className="font-mono text-[#276A3C]">v12.4</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 10. Apple ID Sign-In Simulation Modal */}
      <AnimatePresence>
        {showAppleAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white text-[#0C150A] rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col gap-4 border border-black/10 text-center"
            >
              <div className="w-12 h-12 rounded-full bg-[#0C150A] text-white flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 fill-current" viewBox="0 0 170 170">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.08-7.73-7.98-12.13-14.7-6.53-9.98-11.75-21.57-15.66-34.78-3.91-13.2-5.86-25.56-5.86-37.08 0-14.74 3.59-27.12 10.78-37.13 7.18-10.02 16.33-15.14 27.46-15.37 5.09 0 10.72 1.34 16.89 4.02 6.18 2.68 10.23 4.08 12.15 4.2 2.11-.12 6.38-1.58 12.82-4.38 6.44-2.8 11.97-4.08 16.6-3.85 13.08.68 23.51 5.39 31.3 14.13-11.43 6.94-17.02 16.33-16.76 28.17.26 9.4 3.91 17.3 10.96 23.7 7.05 6.4 15.42 10.09 25.1 11.07-2.3 7.05-5.35 14.53-9.16 22.44zm-30.8-103.35c.12 3.45-.63 6.94-2.25 10.48-1.63 3.53-3.85 6.64-6.66 9.32-2.93 2.81-6.17 4.95-9.72 6.42-2.02.8-4.02 1.3-6.01 1.5-.12-3.45.69-6.91 2.44-10.38 1.74-3.47 3.97-6.52 6.69-9.15 2.85-2.73 6.11-4.83 9.77-6.31 1.95-.78 3.86-1.29 5.74-1.53z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#0C150A]">Sign in with Apple</h3>
                <p className="text-xs text-[#3F463E] mt-1">Use Face ID & Passkey to authenticate securely</p>
              </div>
              <div className="bg-[#F7F9F6] p-3 rounded-2xl border border-black/5 text-xs text-left space-y-1">
                <span className="text-[#3F463E] block text-[10px]">Apple ID</span>
                <b className="text-[#0C150A]">ramesh.patel@icloud.com</b>
                <span className="text-[10px] text-[#276A3C] block">✓ Hide My Email Active</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAppleAuthModal(false)}
                  className="flex-1 h-11 rounded-full bg-[#F1F1F1] text-xs font-bold text-[#0C150A]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    playHapticSound("success");
                    setShowAppleAuthModal(false);
                    setAuthToast("Signed in with Apple ID");
                    setTimeout(() => setAuthToast(null), 3000);
                    navigateTo("03_home");
                  }}
                  className="flex-1 h-11 rounded-full bg-[#0C150A] text-white text-xs font-bold shadow-md hover:bg-black"
                >
                  Authenticate
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 11. Interactive Carbon Goal Adjuster Modal */}
      <AnimatePresence>
        {showGoalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white text-[#0C150A] rounded-3xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-4 border border-black/10"
            >
              <div className="flex items-center justify-between border-b border-black/10 pb-2">
                <div className="flex items-center gap-2">
                  <Target size={16} className="text-[#276A3C]" />
                  <h3 className="text-sm font-extrabold text-[#0C150A]">Monthly Carbon Goal</h3>
                </div>
                <button onClick={() => setShowGoalModal(false)} className="p-1">
                  <X size={16} />
                </button>
              </div>

              <div>
                <span className="text-xs text-[#3F463E]">Adjust your target removal volume:</span>
                <div className="flex items-baseline justify-between mt-1 mb-2">
                  <b className="text-2xl font-black text-[#0C150A]">{carbonGoal} tCO₂e</b>
                  <span className="text-xs font-bold text-[#276A3C]">
                    Est. ₹{(carbonGoal * 1222).toLocaleString()} / month
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={carbonGoal}
                  onChange={(e) => {
                    setCarbonGoal(parseInt(e.target.value));
                    playHapticSound("tap");
                  }}
                  className="w-full accent-[#0C150A]"
                />
                <div className="flex justify-between text-[10px] text-[#3F463E] mt-1 font-mono">
                  <span>10 t (Smallholder)</span>
                  <span>50 t (Commercial)</span>
                  <span>100 t (Industrial)</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#E2F2DF] border border-[#276A3C]/20 text-xs">
                <b className="text-[#0C150A] block">Registry Progress Tracking</b>
                <p className="text-[10px] text-[#3F463E] mt-0.5 leading-relaxed">
                  Your current verified volume of 18.000 t is {((18 / carbonGoal) * 100).toFixed(0)}% of your monthly goal.
                </p>
              </div>

              <button
                onClick={() => {
                  playHapticSound("success");
                  setShowGoalModal(false);
                  setAuthToast(`Monthly carbon goal updated to ${carbonGoal} tCO₂e`);
                  setTimeout(() => setAuthToast(null), 3000);
                }}
                className="w-full h-11 rounded-full bg-[#0C150A] text-white font-extrabold text-xs shadow-md hover:bg-black transition-colors"
              >
                Save Carbon Target
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 12. Producer Setup 80% Verification Details Sheet */}
      <AnimatePresence>
        {showSetupModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white text-[#0C150A] rounded-3xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-3.5 border border-black/10"
            >
              <div className="flex items-center justify-between border-b border-black/10 pb-2">
                <div className="flex items-center gap-2">
                  <CheckCheck size={16} className="text-[#276A3C]" />
                  <h3 className="text-sm font-extrabold text-[#0C150A]">Producer Setup Checklist (80%)</h3>
                </div>
                <button onClick={() => setShowSetupModal(false)} className="p-1">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-2xl bg-[#E2F2DF] border border-black/5 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#276A3C] text-white text-[10px] flex items-center justify-center shrink-0">
                    ✓
                  </span>
                  <div>
                    <b className="text-[#0C150A] block">1. Government Aadhaar ZK Proof</b>
                    <p className="text-[10px] text-[#3F463E]">Offline XML hash validated on-device. Zero PII stored.</p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#E2F2DF] border border-black/5 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#276A3C] text-white text-[10px] flex items-center justify-center shrink-0">
                    ✓
                  </span>
                  <div>
                    <b className="text-[#0C150A] block">2. Site Geo-Boundary Polygon</b>
                    <p className="text-[10px] text-[#3F463E]">Kalol Field #402 (23.2798° N, 72.4984° E) mapped.</p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#E2F2DF] border border-black/5 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#276A3C] text-white text-[10px] flex items-center justify-center shrink-0">
                    ✓
                  </span>
                  <div>
                    <b className="text-[#0C150A] block">3. Ed25519 Mobile Device Enclave</b>
                    <p className="text-[10px] text-[#3F463E]">Private key secured in iPhone Secure Enclave chip.</p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-[#F7F9F6] border border-black/10 flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full border border-black/30 text-[10px] flex items-center justify-center shrink-0">
                    4
                  </span>
                  <div>
                    <b className="text-[#0C150A] block">4. Retort Thermocouple IoT Pairing (Pending)</b>
                    <p className="text-[10px] text-[#3F463E]">Pair Bluetooth datalogger for continuous 580°C telemetry.</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowSetupModal(false)}
                className="w-full h-11 rounded-full bg-[#0C150A] text-white font-extrabold text-xs shadow-md hover:bg-black transition-colors"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 13. Full Activity Ledger Drawer */}
      <AnimatePresence>
        {showActivityDrawer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white text-[#0C150A] rounded-3xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-3.5 border border-black/10 max-h-[600px] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-black/10 pb-2">
                <div>
                  <h3 className="text-sm font-extrabold text-[#0C150A]">Complete Activity Ledger</h3>
                  <p className="text-[10px] text-[#3F463E]">On-chain Solana events & UPI settlements</p>
                </div>
                <button onClick={() => setShowActivityDrawer(false)} className="p-1">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div
                  onClick={() => {
                    setShowActivityDrawer(false);
                    navigateTo("11_certificate");
                  }}
                  className="p-3 rounded-2xl bg-[#F7F9F6] border border-black/5 hover:border-black/20 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div>
                    <b className="text-[#0C150A] block">Batch #2 Credits Issued</b>
                    <span className="text-[10px] text-[#3F463E]">18.000 tCO₂e · Oct 12, 2026</span>
                  </div>
                  <span className="text-xs font-black text-[#276A3C] font-mono">CONFIRMED</span>
                </div>

                <div
                  onClick={() => {
                    setShowActivityDrawer(false);
                    navigateTo("10_payment");
                  }}
                  className="p-3 rounded-2xl bg-[#F7F9F6] border border-black/5 hover:border-black/20 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div>
                    <b className="text-[#0C150A] block">Payment Received (UPI)</b>
                    <span className="text-[10px] text-[#3F463E]">₹22,000 · Oct 10, 2026</span>
                  </div>
                  <span className="text-xs font-black text-[#0C150A] font-mono">SETTLED</span>
                </div>

                <div
                  onClick={() => {
                    setShowActivityDrawer(false);
                    navigateTo("06_verification");
                  }}
                  className="p-3 rounded-2xl bg-[#F7F9F6] border border-black/5 hover:border-black/20 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div>
                    <b className="text-[#0C150A] block">Batch #3 Auditor Assigned</b>
                    <span className="text-[10px] text-[#3F463E]">Gujarat Carbon Council · In review</span>
                  </div>
                  <span className="text-xs font-bold text-[#3F463E] font-mono">PHASE 2</span>
                </div>

                <div
                  onClick={() => {
                    setShowActivityDrawer(false);
                    setShowSatelliteGodsEyeModal(true);
                  }}
                  className="p-3 rounded-2xl bg-[#E2F2DF] border border-[#276A3C]/20 hover:border-[#276A3C] cursor-pointer transition-all flex items-center justify-between"
                >
                  <div>
                    <b className="text-[#0C150A] block">🛰️ Satellite Cross-Verification</b>
                    <span className="text-[10px] text-[#3F463E]">Sentinel-2B & PlanetScope · 98.7%</span>
                  </div>
                  <span className="text-xs font-bold text-[#276A3C] font-mono">VERIFIED</span>
                </div>
              </div>

              <button
                onClick={() => setShowActivityDrawer(false)}
                className="w-full h-11 rounded-full bg-[#0C150A] text-white font-extrabold text-xs shadow-md hover:bg-black transition-colors"
              >
                Close Ledger
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 14. Methodology Preview Modal (For upcoming project types) */}
      <AnimatePresence>
        {showMethodologyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white text-[#0C150A] rounded-3xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-3.5 border border-black/10"
            >
              <div className="flex items-center justify-between border-b border-black/10 pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-[#276A3C]" />
                  <h3 className="text-sm font-extrabold text-[#0C150A]">{showMethodologyModal} Methodology</h3>
                </div>
                <button onClick={() => setShowMethodologyModal(null)} className="p-1">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-2xl bg-[#F7F9F6] border border-black/5">
                  <span className="text-[#3F463E] block text-[10px]">Methodology Standard</span>
                  <b className="text-[#0C150A]">ATMOS-{showMethodologyModal.toUpperCase().replace(/\s+/g, "-")}-v1.0</b>
                </div>

                <div className="p-3 rounded-2xl bg-[#F7F9F6] border border-black/5">
                  <span className="text-[#3F463E] block text-[10px]">Registry Roadmap</span>
                  <b className="text-[#276A3C]">Public dMRV Beta unlocking Q1 2027</b>
                </div>

                <div className="p-3 rounded-2xl bg-[#E2F2DF] border border-[#276A3C]/20 text-[11px] leading-relaxed">
                  Join 1,420+ early producers preparing pilot acreage for {showMethodologyModal.toLowerCase()} carbon tokenization.
                </div>
              </div>

              <button
                onClick={() => {
                  playHapticSound("success");
                  setShowMethodologyModal(null);
                  setAuthToast(`Registered for ${showMethodologyModal} early pilot access!`);
                  setTimeout(() => setAuthToast(null), 3000);
                }}
                className="w-full h-11 rounded-full bg-[#0C150A] text-white font-extrabold text-xs shadow-md hover:bg-black transition-colors"
              >
                Join Early Access Waitlist
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 15. AI + Algo Multi-Modal Cross-Verification Suite Modal */}
      <AnimatePresence>
        {showAiVisionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs font-['Inter',sans-serif]">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0C150A] text-white rounded-3xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-3 border border-white/15 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#35C46A]/20 text-[#35C46A] flex items-center justify-center border border-[#35C46A]/40 shrink-0">
                    <Cpu size={16} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                      <span>AI + Algo Cross-Verification</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[#35C46A] animate-ping" />
                    </h3>
                    <p className="text-[9px] text-[#A6E3B8]">
                      Photo Evidence {activeInspectedPhoto.label} · {currentProjectConfig.shortTitle}
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowAiVisionModal(false)} className="p-1 text-white/60 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              {/* Photo Inspection Canvas with AI Bounding Boxes */}
              <div className="relative h-44 w-full rounded-2xl bg-[#142213] border border-white/15 overflow-hidden flex items-center justify-center">
                {activeInspectedPhoto.url ? (
                  <img
                    src={activeInspectedPhoto.url}
                    alt={activeInspectedPhoto.desc}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-[#162a1b]/60 to-black/40" />
                )}

                {/* Dark gradient vignette for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

                {/* AI Computer Vision Bounding Box 1 */}
                <div className="absolute top-3 left-4 right-14 border-2 border-[#35C46A] rounded-lg p-1.5 bg-[#35C46A]/15 pointer-events-none">
                  <span className="text-[8px] font-mono font-bold bg-[#35C46A] text-[#0C150A] px-1 rounded-xs inline-block truncate max-w-full">
                    {activeInspectedPhoto.desc} · 99.4% MATCH
                  </span>
                </div>

                {/* AI Bounding Box 2: Thermodynamic / Telemetry Tag */}
                <div className="absolute bottom-5 left-4 right-20 border-2 border-emerald-400 rounded-lg p-1 bg-emerald-950/40 pointer-events-none">
                  <span className="text-[7.5px] font-mono font-bold bg-emerald-500 text-[#0C150A] px-1 rounded-xs inline-block truncate max-w-full">
                    ALGO: {currentProjectConfig.calcBadge}
                  </span>
                </div>

                {/* AI Crosshairs */}
                <div className="w-8 h-8 rounded-full border border-white/40 flex items-center justify-center relative pointer-events-none">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#35C46A] animate-ping" />
                </div>

                <div className="absolute bottom-1.5 right-2 text-[7.5px] font-mono text-[#A6E3B8] bg-black/75 px-1.5 py-0.5 rounded-md backdrop-blur-xs">
                  Synthetic: 0.00% · Ed25519 Sealed
                </div>
              </div>

              {/* Photo Selector Tabs */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {currentProjectPhotos.map((photo, i) => (
                  <button
                    key={photo.id || i}
                    onClick={() => {
                      setActivePhotoInspectionIndex(i);
                      playHapticSound("tap");
                    }}
                    className={`py-1.5 px-2.5 rounded-xl text-[10px] font-bold transition-all shrink-0 flex items-center gap-1 ${
                      activePhotoInspectionIndex === i
                        ? "bg-[#35C46A] text-[#0C150A] shadow-md"
                        : "bg-white/10 text-white/70 hover:bg-white/15"
                    }`}
                  >
                    <span>{photo.label}</span>
                    <span className="text-[8px]">✓</span>
                  </button>
                ))}
              </div>

              {/* Comprehensive Dual Verification Telemetry Table */}
              <div className="space-y-2 text-xs">
                {/* 1. AI Vision Model Verification */}
                <div className="bg-white/5 rounded-2xl p-2.5 border border-white/10 space-y-1.5 font-mono text-[10px]">
                  <div className="flex items-center justify-between text-[#35C46A] font-bold">
                    <span className="flex items-center gap-1">
                      <Cpu size={12} />
                      <span>1. Gemini 2.5 Multi-Modal Vision Model</span>
                    </span>
                    <span>99.4% CONFIDENCE</span>
                  </div>
                  <div className="flex justify-between items-center text-white/80">
                    <span className="text-white/50">Asset Detection:</span>
                    <b className="text-white">{currentProjectConfig.shortTitle.toUpperCase()} GROUND TRUTH</b>
                  </div>
                  <div className="flex justify-between items-center text-white/80">
                    <span className="text-white/50">Synthetic / Deepfake Risk:</span>
                    <b className="text-[#35C46A]">0.00% (AUTHENTIC PHYSICAL SENSOR)</b>
                  </div>
                  <div className="flex justify-between items-center text-white/80">
                    <span className="text-white/50">Optical Spectrometry:</span>
                    <span className="text-white">{activeInspectedPhoto.badge}</span>
                  </div>
                </div>

                {/* 2. Algorithmic Math & Telemetry Verification */}
                <div className="bg-white/5 rounded-2xl p-2.5 border border-white/10 space-y-1.5 font-mono text-[10px]">
                  <div className="flex items-center justify-between text-[#35C46A] font-bold">
                    <span className="flex items-center gap-1">
                      <Satellite size={12} />
                      <span>2. Algorithmic Orbital & IoT Cross-Check</span>
                    </span>
                    <span>{currentProjectConfig.satelliteBadge}</span>
                  </div>
                  <div className="flex justify-between items-center text-white/80">
                    <span className="text-white/50">God's Eye Orbit Match:</span>
                    <span className="text-[#35C46A] font-bold">{currentProjectConfig.satellitePill1}</span>
                  </div>
                  <div className="flex justify-between items-center text-white/80">
                    <span className="text-white/50">Thermodynamic Bounds:</span>
                    <span className="text-white">{currentProjectConfig.calcLimit}</span>
                  </div>
                  <div className="flex justify-between items-center text-white/80">
                    <span className="text-white/50">Hardware Enclave GPS:</span>
                    <span className="text-white">{activeInspectedPhoto.gps}</span>
                  </div>
                </div>

                {/* 3. Solana ZK Witness Formulator */}
                <div className="bg-[#E2F2DF]/10 rounded-2xl p-2.5 border border-[#35C46A]/30 space-y-1 font-mono text-[10px]">
                  <div className="flex items-center justify-between text-[#35C46A] font-bold">
                    <span className="flex items-center gap-1">
                      <Shield size={12} />
                      <span>3. Solana ZK Tokenization Formulator</span>
                    </span>
                    <span>READY FOR DEVNET</span>
                  </div>
                  <p className="text-white/70 text-[9px] leading-relaxed">
                    Witness signals formulated: {currentProjectConfig.co2Estimated} certified net CO₂ sequestered. Public proof anchor ready.
                  </p>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    playHapticSound("tap");
                    setAuthToast("AI + Algo Cross-Verification Re-confirmed: 99.4% Match! ✓");
                    setTimeout(() => setAuthToast(null), 2500);
                  }}
                  className="flex-1 h-11 rounded-2xl bg-white/10 text-white font-bold text-xs hover:bg-white/15 transition-colors flex items-center justify-center gap-1"
                >
                  <RefreshCw size={12} />
                  <span>Re-run Scan</span>
                </button>
                <button
                  onClick={() => {
                    setShowAiVisionModal(false);
                    setShowSatelliteGodsEyeModal(true);
                  }}
                  className="flex-1 h-11 rounded-2xl bg-[#35C46A] text-[#0C150A] font-extrabold text-xs shadow-md hover:bg-[#2eb05d] transition-colors flex items-center justify-center gap-1.5"
                >
                  <Satellite size={13} />
                  <span>Check Orbit</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 16. "God's Eye View" Satellite Cross-Verification Suite Modal */}
      {/* (Referencing Bilawal Sidhu's God's Eye View: github.com/bilawalsidhu/gods-eye-view) */}
      <AnimatePresence>
        {showSatelliteGodsEyeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm font-['Inter',sans-serif]">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0C150A] text-white rounded-3xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-3.5 border border-white/20 max-h-[660px] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#35C46A]/20 text-[#35C46A] flex items-center justify-center border border-[#35C46A]/40">
                    <Satellite size={16} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                      God's Eye View · Satellite dMRV
                      <span className="w-2 h-2 rounded-full bg-[#35C46A] animate-ping" />
                    </h3>
                    <p className="text-[9px] text-[#A6E3B8]">
                      Bilawal Sidhu Geospatial Multi-Spectral Telemetry
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSatelliteGodsEyeModal(false)}
                  className="p-1 rounded-full text-white/60 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Constellation Header Pill */}
              <div className="flex items-center justify-between bg-white/5 rounded-2xl px-3 py-2 border border-white/10 text-[10px]">
                <div>
                  <span className="text-white/50 block text-[8px] uppercase">Orbit Target</span>
                  <b className="text-white">{currentProjectConfig.projectName} ({currentProjectConfig.coords})</b>
                </div>
                <div className="text-right">
                  <span className="text-white/50 block text-[8px] uppercase">Ground Match</span>
                  <b className="text-[#35C46A] font-mono text-xs">{currentProjectConfig.satelliteBadge} CONFIRMED</b>
                </div>
              </div>

              {/* 4 Multi-Spectral Layer Toggles */}
              <div className="grid grid-cols-4 gap-1 text-[9px] font-bold">
                {[
                  { id: "optical", label: "Optical RGB" },
                  { id: "thermal", label: "SWIR Heat" },
                  { id: "ndvi", label: "NDVI Delta" },
                  { id: "sar", label: "SAR Radar" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setSatelliteActiveLayer(tab.id as any);
                      playHapticSound("tap");
                    }}
                    className={`py-1.5 rounded-xl transition-all ${
                      satelliteActiveLayer === tab.id
                        ? "bg-[#35C46A] text-[#0C150A] shadow-md"
                        : "bg-white/5 text-white/70 hover:bg-white/10"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Simulated Orbital Earth Observation Canvas */}
              <div className="relative h-48 w-full rounded-2xl overflow-hidden border border-white/20 shadow-inner flex items-center justify-center bg-black">
                {/* Background visual based on layer */}
                {satelliteActiveLayer === "optical" && (
                  <div className="absolute inset-0 bg-[#1A3320] flex items-center justify-center">
                    {/* Simulated Farm plots & Kiln */}
                    <div className="w-full h-full opacity-60 grid grid-cols-4 grid-rows-3 gap-1 p-2">
                      <div className="bg-[#2D4F33] rounded-sm" />
                      <div className="bg-[#3A5D41] rounded-sm col-span-2" />
                      <div className="bg-[#223B26] rounded-sm" />
                      <div className="bg-[#325338] rounded-sm col-span-2" />
                      <div className="bg-[#41694A] rounded-sm" />
                      <div className="bg-[#25402A] rounded-sm" />
                    </div>
                  </div>
                )}

                {satelliteActiveLayer === "thermal" && (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#120524] via-[#350A2E] to-[#120524] flex items-center justify-center">
                    {/* Glowing 582°C Thermal Hotspot */}
                    <div className="w-24 h-24 rounded-full bg-gradient-to-r from-yellow-400 via-red-500 to-purple-600 blur-xl opacity-75 animate-pulse" />
                    <div className="w-10 h-10 rounded-full bg-yellow-200 blur-xs" />
                  </div>
                )}

                {satelliteActiveLayer === "ndvi" && (
                  <div className="absolute inset-0 bg-gradient-to-tr from-[#14361B] via-[#488B49] to-[#0D2412] flex items-center justify-center">
                    {/* Harvest Delta - Diverted Cotton Residue Overlay */}
                    <div className="w-full h-full opacity-70 p-4 flex flex-col justify-between">
                      <div className="bg-red-500/40 border border-red-500 rounded p-1 text-[8px] font-mono text-white">
                        HARVESTED: -0.28 NDVI (13.7t Residue)
                      </div>
                      <div className="bg-green-500/30 border border-green-500 rounded p-1 text-[8px] font-mono text-white text-right">
                        CONTROL PARCEL: 0.72 NDVI
                      </div>
                    </div>
                  </div>
                )}

                {satelliteActiveLayer === "sar" && (
                  <div className="absolute inset-0 bg-[#16181B] flex items-center justify-center">
                    {/* Radar Backscatter Speckle */}
                    <div className="w-full h-full opacity-50 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:8px_8px]" />
                    <div className="w-16 h-16 border border-white/60 rounded-md rotate-45 flex items-center justify-center text-[8px] font-mono text-white">
                      KILN METAL ECHO
                    </div>
                  </div>
                )}

                {/* Radar Sweep Scanning Beam Animation */}
                {satelliteScanActive && (
                  <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "200%" }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-[#35C46A]/40 to-transparent pointer-events-none"
                  />
                )}

                {/* Reticle / Target Crosshairs */}
                <div className="relative z-10 w-20 h-20 rounded-full border border-dashed border-[#35C46A] flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-[#35C46A] animate-ping" />
                  <span className="absolute -top-3 text-[7px] font-mono font-bold bg-black/80 px-1 text-[#35C46A] rounded-xs whitespace-nowrap">
                    {currentProjectConfig.coords}
                  </span>
                </div>

                {/* Satellite Overpass Stamp */}
                <div className="absolute bottom-2 left-2 text-[8px] font-mono text-white/80 bg-black/70 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Radio size={9} className="text-[#35C46A]" />
                  <span>Sentinel-2B Overpass · 14:18 UTC</span>
                </div>
              </div>

              {/* Layer Telemetry Details */}
              {(() => {
                const layer = GODS_EYE_KALOL_OBSERVATION.layers.find((l) => l.id === satelliteActiveLayer)!;
                return (
                  <div className="bg-white/5 rounded-2xl p-3 border border-white/10 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <b className="text-white text-xs">{layer.name}</b>
                      <span className="text-[10px] font-mono text-[#35C46A] font-bold">
                        {layer.confidence}% CONFIDENCE
                      </span>
                    </div>
                    <p className="text-[10px] text-white/70 leading-relaxed">{layer.description}</p>
                    <div className="grid grid-cols-2 gap-1 pt-1 border-t border-white/10 text-[9px] font-mono">
                      <div>
                        <span className="text-white/40 block">Source & Resolution:</span>
                        <span className="text-white">{layer.source} ({layer.resolution})</span>
                      </div>
                      <div>
                        <span className="text-white/40 block">Spectral Band:</span>
                        <span className="text-[#35C46A]">{layer.spectralBand}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Interactive Radar Sweep Trigger & Solana Oracle Signature */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSatelliteScanActive(!satelliteScanActive);
                    playHapticSound("tap");
                  }}
                  className={`flex-1 h-11 rounded-full text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
                    satelliteScanActive
                      ? "bg-red-500/20 text-red-400 border border-red-500/40"
                      : "bg-white/10 text-white hover:bg-white/15"
                  }`}
                >
                  <Scan size={14} />
                  <span>{satelliteScanActive ? "Stop Sweep" : "Trigger Radar Sweep"}</span>
                </button>
                <button
                  onClick={() => {
                    playHapticSound("success");
                    setShowSatelliteGodsEyeModal(false);
                    setAuthToast("Orbital Cross-Verification proof attached to Batch #3");
                    setTimeout(() => setAuthToast(null), 3000);
                  }}
                  className="flex-1 h-11 rounded-full bg-[#35C46A] text-[#0C150A] font-extrabold text-xs shadow-md hover:bg-[#2eb05d] transition-colors"
                >
                  Confirm Orbit Match
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 17. Biochar dMRV Calculation Breakdown Formula Modal */}
      <AnimatePresence>
        {showCalculationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs font-['Inter',sans-serif]">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white text-[#0C150A] rounded-3xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-3.5 border border-black/10 max-h-[620px] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-black/10 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#E2F2DF] text-[#276A3C] flex items-center justify-center">
                    <Activity size={15} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#0C150A]">dMRV Calculation Engine</h3>
                    <p className="text-[9px] text-[#3F463E]">ATMOS-BIOCHAR-PILOT-v1 (IPCC Tier 3)</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCalculationModal(false)}
                  className="p-1 text-black/60 hover:text-black"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Master Formula Card */}
              <div className="bg-[#0C150A] text-white p-3.5 rounded-2xl space-y-1">
                <span className="text-[9px] text-[#A6E3B8] font-mono uppercase block font-bold">
                  Certified Sequestration Formula
                </span>
                <p className="font-mono text-xs font-bold text-white leading-relaxed">
                  CO₂e = (M_char × C_org × F_perm × 3.667) - E_logistics
                </p>
                <p className="text-[9px] text-white/70 font-mono">
                  = (3,200 × 0.784 × 0.74 × 3.667) / 1000 - 0.370 = 6.439 tCO₂e
                </p>
              </div>

              {/* Step-by-Step Breakdown */}
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-2xl bg-[#F7F9F6] border border-black/5 flex justify-between items-center">
                  <div>
                    <b className="text-[#0C150A] block">1. Raw Cotton Residue Diverted</b>
                    <span className="text-[10px] text-[#3F463E]">13,200 kg field agricultural waste</span>
                  </div>
                  <span className="font-mono font-bold text-xs text-[#0C150A]">13,200 kg</span>
                </div>

                <div className="p-2.5 rounded-2xl bg-[#F7F9F6] border border-black/5 flex justify-between items-center">
                  <div>
                    <b className="text-[#0C150A] block">2. Pyrolysis Biochar Yield (M_char)</b>
                    <span className="text-[10px] text-[#3F463E]">582°C oxygen-depleted retort</span>
                  </div>
                  <span className="font-mono font-bold text-xs text-[#276A3C]">3,200 kg (24.2%)</span>
                </div>

                <div className="p-2.5 rounded-2xl bg-[#F7F9F6] border border-black/5 flex justify-between items-center">
                  <div>
                    <b className="text-[#0C150A] block">3. Fixed Organic Carbon (C_org)</b>
                    <span className="text-[10px] text-[#3F463E]">NIARSS elemental lab test</span>
                  </div>
                  <span className="font-mono font-bold text-xs text-[#0C150A]">78.4% C</span>
                </div>

                <div className="p-2.5 rounded-2xl bg-[#F7F9F6] border border-black/5 flex justify-between items-center">
                  <div>
                    <b className="text-[#0C150A] block">4. Permanence Factor (F_perm)</b>
                    <span className="text-[10px] text-[#3F463E]">H:C ratio 0.34 &gt; 100yr permanence</span>
                  </div>
                  <span className="font-mono font-bold text-xs text-[#276A3C]">0.74 (74%)</span>
                </div>

                <div className="p-2.5 rounded-2xl bg-[#F7F9F6] border border-black/5 flex justify-between items-center">
                  <div>
                    <b className="text-[#0C150A] block">5. Stoichiometric Ratio</b>
                    <span className="text-[10px] text-[#3F463E]">Molecular mass 44/12 (CO₂/C)</span>
                  </div>
                  <span className="font-mono font-bold text-xs text-[#0C150A]">3.667</span>
                </div>

                <div className="p-2.5 rounded-2xl bg-[#F7F9F6] border border-black/5 flex justify-between items-center">
                  <div>
                    <b className="text-[#0C150A] block">6. Logistics Deduction (E_logistics)</b>
                    <span className="text-[10px] text-[#3F463E]">Tractor transport + auxiliary</span>
                  </div>
                  <span className="font-mono font-bold text-xs text-red-600">-0.370 tCO₂e</span>
                </div>
              </div>

              <div className="bg-[#E2F2DF] p-3 rounded-2xl border border-[#276A3C]/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#3F463E] block font-bold">Net Certified Sequestration</span>
                  <span className="text-xl font-black text-[#0C150A]">6.439 tCO₂e</span>
                </div>
                <span className="text-[9px] bg-[#276A3C] text-white px-2 py-0.5 rounded-full font-bold">
                  Audited Quorum ✓
                </span>
              </div>

              <button
                onClick={() => setShowCalculationModal(false)}
                className="w-full h-11 rounded-full bg-[#0C150A] text-white font-extrabold text-xs shadow-md hover:bg-black transition-colors"
              >
                Close Calculation Breakdown
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 18. NIARSS Official Elemental Lab Certificate Modal */}
      <AnimatePresence>
        {showLabReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs font-['Inter',sans-serif]">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white text-[#0C150A] rounded-3xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-3.5 border border-black/10 max-h-[620px] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-black/10 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#0C150A] text-white flex items-center justify-center">
                    <Flame size={15} className="text-[#35C46A]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#0C150A]">Elemental Analysis Certificate</h3>
                    <p className="text-[9px] text-[#3F463E]">NIARSS Accreditation · ISO/IEC 17025</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLabReportModal(false)}
                  className="p-1 text-black/60 hover:text-black"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Lab Header Box */}
              <div className="bg-[#F7F9F6] border border-black/10 rounded-2xl p-3 text-xs space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#3F463E]">Laboratory:</span>
                  <b className="text-[#0C150A]">National Inst. of Agricultural Residue</b>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#3F463E]">Sample ID:</span>
                  <b className="font-mono text-[#0C150A]">BIO-KL-2026-B3</b>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#3F463E]">Test Date:</span>
                  <b>11 Oct 2026 · 14:15 IST</b>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-[#3F463E]">Standard:</span>
                  <b>ASTM D5373 / ISO 29541 Elemental</b>
                </div>
              </div>

              {/* Chemical Matrix Table */}
              <div className="space-y-1.5 text-xs">
                <h4 className="font-extrabold text-[#0C150A] text-xs">Elemental Composition</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-white border border-black/5 shadow-xs">
                    <span className="text-[9px] text-[#3F463E] block">Fixed Carbon (C_org)</span>
                    <b className="text-base text-[#0C150A]">78.4%</b>
                    <span className="text-[8px] text-[#276A3C] font-bold block">✓ Exceeds 60% standard</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#E2F2DF] border border-[#276A3C]/20 shadow-xs">
                    <span className="text-[9px] text-[#3F463E] block">H:C Molar Ratio</span>
                    <b className="text-base text-[#276A3C]">0.34</b>
                    <span className="text-[8px] text-[#276A3C] font-bold block">✓ Pass (&lt;0.40 Permanence)</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-black/5 shadow-xs">
                    <span className="text-[9px] text-[#3F463E] block">Ash Content</span>
                    <b className="text-sm text-[#0C150A]">4.2%</b>
                    <span className="text-[8px] text-[#3F463E] block">Within 10% limit</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white border border-black/5 shadow-xs">
                    <span className="text-[9px] text-[#3F463E] block">Moisture</span>
                    <b className="text-sm text-[#0C150A]">3.8%</b>
                    <span className="text-[8px] text-[#3F463E] block">Dry biochar standard</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#F7F9F6] border border-black/5 rounded-2xl p-2.5 text-[10px] text-[#3F463E] flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#0C150A] block">Lead Analyst Sign-off</span>
                  <span>Dr. Rameshwar Varma, Chief Geochemist</span>
                </div>
                <span className="bg-[#E2F2DF] text-[#276A3C] font-mono text-[9px] font-bold px-2 py-0.5 rounded-md">
                  SEALED ✓
                </span>
              </div>

              <button
                onClick={() => setShowLabReportModal(false)}
                className="w-full h-11 rounded-full bg-[#0C150A] text-white font-extrabold text-xs shadow-md hover:bg-black transition-colors"
              >
                Close Lab Certificate
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 19. List Credits on Marketplace Modal */}
      <AnimatePresence>
        {showListCreditsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs font-['Inter',sans-serif]">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white text-[#0C150A] rounded-3xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-3.5 border border-black/10"
            >
              <div className="flex items-center justify-between border-b border-black/10 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#E2F2DF] text-[#276A3C] flex items-center justify-center">
                    <Leaf size={15} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#0C150A]">List Batch on Marketplace</h3>
                    <p className="text-[9px] text-[#3F463E]">Biochar Batch #3 · Kalol, Gujarat</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowListCreditsModal(false)}
                  className="p-1 text-black/60 hover:text-black"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Volume to list */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-[#0C150A]">Volume to List (tCO₂e)</span>
                  <span className="text-[10px] text-[#276A3C] font-bold">Available: 5.796 t</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="5.796"
                    step="0.1"
                    value={listTonnes}
                    onChange={(e) => setListTonnes(parseFloat(e.target.value))}
                    className="w-full accent-[#0C150A]"
                  />
                  <span className="font-black text-sm text-[#0C150A] min-w-14 text-right">
                    {listTonnes.toFixed(1)} t
                  </span>
                </div>
              </div>

              {/* Asking Price */}
              <div className="space-y-1.5 text-xs">
                <span className="font-bold text-[#0C150A]">Asking Price per Tonne (₹)</span>
                <div className="flex items-center gap-2 bg-[#F7F9F6] border border-black/10 px-3 py-2 rounded-2xl">
                  <span className="text-[#3F463E] font-bold">₹</span>
                  <input
                    type="number"
                    value={listPrice}
                    onChange={(e) => setListPrice(Math.max(1000, parseInt(e.target.value) || 0))}
                    className="bg-transparent text-sm font-black text-[#0C150A] outline-none flex-1"
                  />
                  <span className="text-[10px] text-[#3F463E]">Market: ₹11,100</span>
                </div>
              </div>

              {/* Settlement Payout Preview */}
              <div className="bg-[#E2F2DF] p-3 rounded-2xl border border-[#276A3C]/20 text-xs space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#3F463E]">Gross Listing Value:</span>
                  <b>₹{Math.round(listTonnes * listPrice).toLocaleString("en-IN")}</b>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-[#3F463E]">5% MRV Validator Escrow:</span>
                  <span className="text-red-700">-₹{Math.round(listTonnes * listPrice * 0.05).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-[#276A3C]/30 text-sm font-black text-[#0C150A]">
                  <span>Your Net Payout (UPI):</span>
                  <span className="text-[#276A3C]">
                    ₹{Math.round(listTonnes * listPrice * 0.95).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  playHapticSound("success");
                  setShowListCreditsModal(false);
                  setAuthToast(`Listed ${listTonnes.toFixed(1)} tCO₂e on market at ₹${listPrice.toLocaleString("en-IN")}/t ✓`);
                  setTimeout(() => setAuthToast(null), 3000);
                  navigateTo("09_marketplace");
                }}
                className="w-full h-12 rounded-full bg-[#0C150A] text-white font-extrabold text-xs shadow-md hover:bg-black transition-colors"
              >
                Submit Listing to Orderbook
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 20. Share Certificate Modal */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs font-['Inter',sans-serif]">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white text-[#0C150A] rounded-3xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-3.5 border border-black/10"
            >
              <div className="flex items-center justify-between border-b border-black/10 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#E2F2DF] text-[#276A3C] flex items-center justify-center">
                    <Share2 size={15} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#0C150A]">Share Retirement Deed</h3>
                    <p className="text-[9px] text-[#3F463E]">ATMOS-REC-2026-KL-00918</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="p-1 text-black/60 hover:text-black"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <button
                  onClick={() => {
                    playHapticSound("tap");
                    window.open(
                      `https://wa.me/?text=Verified%20Carbon%20Retirement%20Deed%20ATMOS-REC-2026-KL-00918%20on%20Solana%20Devnet:%20https://atmos.network/verify/00918`,
                      "_blank"
                    );
                  }}
                  className="w-full p-3 rounded-2xl bg-[#E2F2DF] text-[#0C150A] font-bold flex items-center justify-between hover:bg-[#d4edd0] transition-colors"
                >
                  <span>Share on WhatsApp</span>
                  <ChevronRight size={14} />
                </button>

                <button
                  onClick={() => {
                    playHapticSound("tap");
                    window.open(
                      `https://twitter.com/intent/tweet?text=Just%20retired%205.0%20tCO2e%20verified%20Biochar%20on%20@AtmosNetwork%20with%20zero-knowledge%20proofs%20on%20Solana!%20%23ClimateMRV`,
                      "_blank"
                    );
                  }}
                  className="w-full p-3 rounded-2xl bg-[#F7F9F6] border border-black/10 text-[#0C150A] font-bold flex items-center justify-between hover:bg-black/5 transition-colors"
                >
                  <span>Share on X / Twitter</span>
                  <ChevronRight size={14} />
                </button>

                <button
                  onClick={() => {
                    playHapticSound("tap");
                    navigator.clipboard?.writeText("https://atmos.network/verify/ATMOS-REC-2026-KL-00918");
                    setAuthToast("Certificate verification link copied to clipboard ✓");
                    setTimeout(() => setAuthToast(null), 3000);
                  }}
                  className="w-full p-3 rounded-2xl bg-[#F7F9F6] border border-black/10 text-[#0C150A] font-bold flex items-center justify-between hover:bg-black/5 transition-colors"
                >
                  <span>Copy Verification URL</span>
                  <Copy size={14} />
                </button>
              </div>

              <button
                onClick={() => setShowShareModal(false)}
                className="w-full h-11 rounded-full bg-[#0C150A] text-white font-extrabold text-xs shadow-md hover:bg-black transition-colors"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
