import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import React, { useRef, useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAtmos } from "@/context/AtmosContext";
import { AtmosButton } from "@/components/AtmosButton";

type FieldType = "text" | "number" | "chips" | "slider";

interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  unit?: string;
  options?: string[];
  hint?: string;
  min?: number;
  max?: number;
}

interface ProjectSchema {
  metricsTitle: string;
  fields: FieldDef[];
  methodology: string;
  carbonNote: string;
}

const PROJECT_SCHEMAS: Record<string, ProjectSchema> = {
  biochar: {
    metricsTitle: "Production Metrics",
    methodology: "VM0044 (Biochar)",
    carbonNote: "Carbon sequestered = biochar output × 60% C × 80% stability × 44/12",
    fields: [
      { key: "biomassInput", label: "Biomass Input", type: "number", placeholder: "12500", unit: "kg/month", hint: "Total feedstock processed per month" },
      { key: "biocharOutput", label: "Biochar Output", type: "number", placeholder: "3200", unit: "kg/month", hint: "Final biochar produced per month" },
      { key: "equipmentType", label: "Equipment Type", type: "chips", options: ["Retort Kiln", "TLUD", "Flash Carbonizer", "Gasifier"] },
      { key: "feedstockType", label: "Feedstock Type", type: "chips", options: ["Rice Husk", "Wood Chips", "Sugarcane Bagasse", "Bamboo", "Crop Residue"] },
    ],
  },
  agroforestry: {
    metricsTitle: "Forest Metrics",
    methodology: "ACM0003 / VM0033",
    carbonNote: "Sequestration = forest area × species growth rate × carbon fraction",
    fields: [
      { key: "forestArea", label: "Forest / Land Area", type: "number", placeholder: "8500", unit: "hectares", hint: "Total area under cultivation" },
      { key: "treeCount", label: "Number of Trees", type: "number", placeholder: "2400", unit: "trees", hint: "Total trees planted / managed" },
      { key: "speciesMix", label: "Primary Species", type: "chips", options: ["Teak", "Bamboo", "Eucalyptus", "Mangrove", "Mixed Native", "Acacia"] },
      { key: "yearsActive", label: "Project Duration", type: "number", placeholder: "5", unit: "years", hint: "Years since project started" },
      { key: "canopyCover", label: "Canopy Cover", type: "number", placeholder: "65", unit: "%", hint: "Estimated canopy coverage" },
    ],
  },
  solar: {
    metricsTitle: "Solar System Data",
    methodology: "AMS-I.D (Solar PV)",
    carbonNote: "CO₂ avoided = annual generation (kWh) × 0.82 kgCO₂/kWh (Indian grid factor)",
    fields: [
      { key: "ownerName", label: "System Owner Name", type: "text", placeholder: "Rajesh Kumar", hint: "Name of the solar installation owner" },
      { key: "systemCapacity", label: "System Capacity", type: "number", placeholder: "3.2", unit: "kW", hint: "Installed peak power capacity" },
      { key: "panelCount", label: "Number of Panels", type: "number", placeholder: "8", unit: "panels", hint: "Total solar panels installed" },
      { key: "annualGeneration", label: "Annual Generation", type: "number", placeholder: "4800", unit: "kWh/year", hint: "Measured or estimated annual output" },
      { key: "gridType", label: "System Type", type: "chips", options: ["Grid-tied", "Off-grid", "Hybrid", "Community"] },
      { key: "installYear", label: "Installation Year", type: "number", placeholder: "2023", unit: "year", hint: "Year system was commissioned" },
    ],
  },
  ev: {
    metricsTitle: "Fleet Metrics",
    methodology: "AMS-III.C (EV Displacement)",
    carbonNote: "CO₂ avoided = km displaced × emission factor difference vs fossil fuel vehicles",
    fields: [
      { key: "fleetSize", label: "Fleet Size", type: "number", placeholder: "50", unit: "vehicles", hint: "Number of EVs in the fleet" },
      { key: "annualDistance", label: "Annual Distance per Vehicle", type: "number", placeholder: "25000", unit: "km/year", hint: "Average km driven per vehicle" },
      { key: "vehicleType", label: "Vehicle Type", type: "chips", options: ["2-Wheeler", "3-Wheeler (Auto)", "Car / SUV", "Bus", "Truck / LCV", "E-Rickshaw"] },
      { key: "fuelDisplaced", label: "Fuel Displaced", type: "number", placeholder: "45000", unit: "litres/year", hint: "Total fossil fuel avoided by fleet" },
      { key: "chargerType", label: "Charging Source", type: "chips", options: ["Grid Power", "Solar Charging", "Mixed Renewables", "Diesel Genset (Hybrid)"] },
    ],
  },
  building: {
    metricsTitle: "Building Data",
    methodology: "AMS-II.C (Energy Efficiency)",
    carbonNote: "CO₂ reduced = (pre-retrofit − post-retrofit) kWh × 0.82 kgCO₂/kWh",
    fields: [
      { key: "buildingArea", label: "Building Floor Area", type: "number", placeholder: "1200", unit: "m²", hint: "Total conditioned area" },
      { key: "buildingType", label: "Building Type", type: "chips", options: ["Residential", "Commercial Office", "Retail / Mall", "Industrial", "Hospital", "School"] },
      { key: "retrofitType", label: "Retrofit Measures", type: "chips", options: ["LED Lighting", "HVAC Upgrade", "Insulation", "Solar Rooftop", "Smart Controls", "Full Deep-Retrofit"] },
      { key: "preEnergy", label: "Pre-Retrofit Energy Use", type: "number", placeholder: "85000", unit: "kWh/year", hint: "Baseline annual consumption" },
      { key: "postEnergy", label: "Post-Retrofit Energy Use", type: "number", placeholder: "52000", unit: "kWh/year", hint: "Current annual consumption after upgrades" },
      { key: "retrofitYear", label: "Retrofit Year", type: "number", placeholder: "2023", unit: "year" },
    ],
  },
  shipping: {
    metricsTitle: "Vessel & Route Data",
    methodology: "AMS-III.R (Maritime)",
    carbonNote: "CO₂ reduced = fuel saved (tonnes) × 3.2 CO₂ factor (HFO equivalent)",
    fields: [
      { key: "vesselName", label: "Vessel / Fleet Name", type: "text", placeholder: "MV Green Carrier", hint: "Name of vessel or fleet" },
      { key: "vesselType", label: "Vessel Type", type: "chips", options: ["Container Ship", "Bulk Carrier", "Tanker", "Ro-Ro", "Coastal Ferry", "River Barge"] },
      { key: "routesPerYear", label: "Routes per Year", type: "number", placeholder: "24", unit: "voyages", hint: "Number of voyages annually" },
      { key: "distancePerRoute", label: "Distance per Voyage", type: "number", placeholder: "800", unit: "km", hint: "Average voyage distance" },
      { key: "fuelSaved", label: "Fuel Saved", type: "number", placeholder: "120", unit: "tonnes/year", hint: "Fuel reduced via efficiency measures / LNG" },
      { key: "fuelType", label: "Current Fuel Type", type: "chips", options: ["HFO", "MGO / Diesel", "LNG", "Methanol", "Biofuel Blend"] },
    ],
  },
  aviation: {
    metricsTitle: "Flight Operations Data",
    methodology: "AMS-III.GG (Aviation SAF)",
    carbonNote: "CO₂ avoided = SAF blend % × fuel consumed × lifecycle emission factor",
    fields: [
      { key: "operatorName", label: "Operator / Airline Name", type: "text", placeholder: "Green Wings Aviation", hint: "Name of airline or operator" },
      { key: "annualFlights", label: "Annual Flights", type: "number", placeholder: "1200", unit: "flights/year", hint: "Total number of flights" },
      { key: "safBlend", label: "SAF Blend Percentage", type: "number", placeholder: "20", unit: "%", hint: "Sustainable Aviation Fuel blend ratio" },
      { key: "passengersPerFlight", label: "Average Passengers", type: "number", placeholder: "150", unit: "pax/flight", hint: "Average load factor" },
      { key: "routeType", label: "Route Type", type: "chips", options: ["Domestic Short-Haul", "Domestic Long-Haul", "International Short-Haul", "International Long-Haul"] },
      { key: "aircraftType", label: "Aircraft Type", type: "chips", options: ["Narrow-body (A320/737)", "Wide-body (A350/787)", "Regional Jet", "Turboprop"] },
    ],
  },
  city: {
    metricsTitle: "Initiative Metrics",
    methodology: "AM0064 (Municipal)",
    carbonNote: "Total city-level CO₂ reduced across all covered households / systems",
    fields: [
      { key: "initiativeName", label: "Initiative / Program Name", type: "text", placeholder: "Pune Green City 2025", hint: "Official program name" },
      { key: "populationCovered", label: "Population Covered", type: "number", placeholder: "500000", unit: "residents", hint: "Number of residents benefiting" },
      { key: "initiativeType", label: "Initiative Type", type: "chips", options: ["Solar Street Lights", "EV Bus Fleet", "Urban Forest", "Waste-to-Energy", "District Cooling", "Metro / Rail"] },
      { key: "implementationArea", label: "Implementation Area", type: "number", placeholder: "45", unit: "km²", hint: "Geographic coverage" },
      { key: "reductionTarget", label: "Annual CO₂ Target", type: "number", placeholder: "50000", unit: "tonnes/year", hint: "Official carbon reduction target" },
    ],
  },
  individual: {
    metricsTitle: "Your Action Data",
    methodology: "GS-VER (Individual Actions)",
    carbonNote: "Personal carbon footprint reduction calculated from lifestyle changes",
    fields: [
      { key: "actionType", label: "Primary Action", type: "chips", options: ["Solar Home System", "Switch to EV", "Tree Planting", "Diet Change (Vegan)", "Flight Offset", "Reduced Energy Use"] },
      { key: "duration", label: "Duration of Action", type: "number", placeholder: "12", unit: "months", hint: "How long you have been doing this" },
      { key: "carbonGoal", label: "Monthly Reduction Goal", type: "number", placeholder: "50", unit: "kg CO₂/month", hint: "Your estimated monthly offset" },
      { key: "lifestyleScore", label: "Green Lifestyle Score", type: "chips", options: ["Beginner (< 10%)", "Intermediate (10-30%)", "Advanced (30-50%)", "Expert (> 50% reduction)"] },
    ],
  },
};

type MetadataValues = Record<string, string>;

interface BoundaryPoint {
  lat: number;
  lng: number;
}

interface CapturedImage {
  uri: string;
  base64?: string;
  mimeType?: string;
}

function getApiBase(): string {
  const apiUrl = typeof process !== "undefined" ? process.env["EXPO_PUBLIC_API_URL"] : undefined;
  if (apiUrl) return apiUrl;
  const domain = typeof process !== "undefined" ? process.env["EXPO_PUBLIC_DOMAIN"] : undefined;
  if (domain) return domain.startsWith("http://") || domain.startsWith("https://") ? domain : `https://${domain}`;
  return "http://localhost:9001";
}

const API_BASE = getApiBase();

function parseBoundaryPoints(input: string): BoundaryPoint[] {
  if (!input.trim()) return [];
  return input
    .split(";")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((pair) => {
      const [latRaw, lngRaw] = pair.split(",").map((v) => v.trim());
      const lat = Number(latRaw);
      const lng = Number(lngRaw);
      return { lat, lng };
    })
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
    .filter((p) => p.lat >= -90 && p.lat <= 90 && p.lng >= -180 && p.lng <= 180)
    .map((p) => ({ lat: Number(p.lat.toFixed(6)), lng: Number(p.lng.toFixed(6)) }));
}

function centroid(points: BoundaryPoint[]): BoundaryPoint | null {
  if (!points.length) return null;
  const sum = points.reduce(
    (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
    { lat: 0, lng: 0 },
  );
  return {
    lat: Number((sum.lat / points.length).toFixed(6)),
    lng: Number((sum.lng / points.length).toFixed(6)),
  };
}

export default function CaptureDataScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { type } = useLocalSearchParams<{ type: string }>();
  const { addProject } = useAtmos();

  const schema = PROJECT_SCHEMAS[type ?? "biochar"] ?? PROJECT_SCHEMAS.biochar;

  const [step, setStep] = useState(1);
  const [projectName, setProjectName] = useState("");
  const [location, setLocation] = useState("");
  const [metadata, setMetadata] = useState<MetadataValues>({});
  const [gps, setGps] = useState<{ latitude: number; longitude: number; accuracy: number | null } | null>(null);
  const [boundaryInput, setBoundaryInput] = useState("");
  const [capturingGps, setCapturingGps] = useState(false);
  const [images, setImages] = useState<CapturedImage[]>([]);
  const [loading, setLoading] = useState(false);

  const topPad = Platform.OS === "web" ? insets.top + 67 : insets.top;

  const STEPS = [
    { label: "Project Info", icon: "info" as const },
    { label: schema.metricsTitle, icon: "bar-chart-2" as const },
    { label: "Media Upload", icon: "camera" as const },
  ];

  function setField(key: string, value: string) {
    setMetadata((prev) => ({ ...prev, [key]: value }));
  }

  async function requestCameraPermission() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Camera Permission", "Camera access is needed to capture project photos.");
      return false;
    }
    return true;
  }

  async function requestGalleryPermission() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Gallery Permission", "Gallery access is needed to select photos.");
      return false;
    }
    return true;
  }

  const webFileInputRef = useRef<HTMLInputElement | null>(null);

  async function readWebFile(file: File): Promise<CapturedImage> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Unable to read selected image."));
      reader.onload = () => {
        const result = typeof reader.result === "string" ? reader.result : "";
        if (!result) {
          reject(new Error("Unable to read selected image."));
          return;
        }

        const match = result.match(/^data:([^;]+);base64,(.+)$/);
        resolve({
          uri: result,
          base64: match?.[2],
          mimeType: match?.[1] ?? file.type ?? "image/jpeg",
        });
      };
      reader.readAsDataURL(file);
    });
  }

  function toEvidencePayload(image: CapturedImage) {
    if (image.base64) {
      return { data: image.base64, mimeType: image.mimeType ?? "image/jpeg" };
    }

    const match = image.uri.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      return { data: match[2], mimeType: match[1] };
    }

    return { data: image.uri, mimeType: image.mimeType ?? "image/jpeg" };
  }

  async function handleAddImage() {
    if (images.length >= 4) return;

    if (Platform.OS === "web") {
      if (!webFileInputRef.current) {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            const image = await readWebFile(file);
            setImages((prev) => [...prev, image]);
          }
        };
        webFileInputRef.current = input;
      }
      webFileInputRef.current.value = "";
      webFileInputRef.current.click();
      return;
    }

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ["Cancel", "Take Photo", "Choose from Gallery"], cancelButtonIndex: 0 },
        async (idx) => {
          if (idx === 1) await launchCamera();
          if (idx === 2) await launchGallery();
        }
      );
    } else {
      Alert.alert("Add Photo", "Choose a source", [
        { text: "Cancel", style: "cancel" },
        { text: "Take Photo", onPress: launchCamera },
        { text: "Choose from Gallery", onPress: launchGallery },
      ]);
    }
  }

  async function launchCamera() {
    const ok = await requestCameraPermission();
    if (!ok) return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImages((prev) => [
        ...prev,
        {
          uri: asset.uri,
          base64: asset.base64 ?? undefined,
          mimeType: asset.mimeType ?? "image/jpeg",
        },
      ]);
    }
  }

  async function launchGallery() {
    const ok = await requestGalleryPermission();
    if (!ok) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setImages((prev) => [
        ...prev,
        {
          uri: asset.uri,
          base64: asset.base64 ?? undefined,
          mimeType: asset.mimeType ?? "image/jpeg",
        },
      ]);
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function canProceedStep1() {
    return projectName.trim().length > 0;
  }

  async function captureLandCoordinates() {
    try {
      setCapturingGps(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Location Permission", "Location access is required to capture land coordinates.");
        return;
      }

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const lat = Number(pos.coords.latitude.toFixed(6));
      const lng = Number(pos.coords.longitude.toFixed(6));
      const acc = pos.coords.accuracy ? Number(pos.coords.accuracy.toFixed(1)) : null;

      setGps({ latitude: lat, longitude: lng, accuracy: acc });
      if (!location.trim()) {
        setLocation(`${lat}, ${lng}`);
      }
    } catch {
      Alert.alert("Location Error", "Unable to capture coordinates right now.");
    } finally {
      setCapturingGps(false);
    }
  }

  async function openLandMap() {
    const points = parseBoundaryPoints(boundaryInput);
    const center = centroid(points);
    const mapQuery = center
      ? `${center.lat},${center.lng}`
      : gps
        ? `${gps.latitude},${gps.longitude}`
        : location.trim();
    if (!mapQuery) {
      Alert.alert("Map Preview", "Add location text, boundary points, or capture GPS first.");
      return;
    }
    const mapUrl = Platform.OS === "ios"
      ? center || gps
        ? `http://maps.apple.com/?ll=${encodeURIComponent(mapQuery)}`
        : `http://maps.apple.com/?q=${encodeURIComponent(mapQuery)}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;

    try {
      await Linking.openURL(mapUrl);
    } catch {
      Alert.alert("Map Preview", `Coordinates: ${mapQuery}`);
    }
  }

  function useGpsAsBoundaryPoint() {
    if (!gps) return;
    const point = `${gps.latitude},${gps.longitude}`;
    setBoundaryInput((prev) => (prev.trim().length ? `${prev.trim()}; ${point}` : point));
  }

  function canProceedStep2() {
    const requiredKeys = schema.fields
      .filter((f) => f.type === "number" || f.type === "text")
      .slice(0, 2)
      .map((f) => f.key);
    return requiredKeys.every((k) => metadata[k] && metadata[k].trim().length > 0);
  }

  async function handleSubmit() {
    if (!projectName) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    const numericMeta: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(metadata)) {
      const n = Number(v);
      numericMeta[k] = isNaN(n) || v === "" ? v : n;
    }
    const boundaryPoints = parseBoundaryPoints(boundaryInput);
    if (gps) {
      numericMeta.landLatitude = gps.latitude;
      numericMeta.landLongitude = gps.longitude;
      numericMeta.landAccuracyMeters = gps.accuracy ?? "unknown";
    }
    if (boundaryPoints.length) {
      numericMeta.landBoundaryPolygon = JSON.stringify(boundaryPoints);
      numericMeta.landBoundaryPointCount = boundaryPoints.length;
    }

    // DEV MODE: Use mock evidence for instant testing (disable in production)
    const useMockEvidence = __DEV__;

    let evidence: any = null;

    if (useMockEvidence) {
      // eslint-disable-next-line no-console
      console.log("🎭 Using mocked evidence response for faster dev iteration");
      await new Promise((r) => setTimeout(r, 300));
      evidence = {
        verdict: "pass",
        confidence: 95,
        reasons: [],
        signals: [
          "high_image_clarity",
          "solar_panel_detected",
          "geolocation_consistent",
          "satellite_match_positive",
        ],
      };
    } else {
      // PRODUCTION: Try multiple API endpoints with retry and timeout
      const endpoint = "/api/verify/evidence";
      const candidateBases = [API_BASE, "http://localhost:8080", "http://localhost:9001"].filter(Boolean);
      const overallTimeoutMs = 30000;
      const overallController = new AbortController();
      const overallTimer = setTimeout(() => overallController.abort(), overallTimeoutMs);

      let evidenceResponse: Response | null = null;
      let lastError: any = null;

      for (const base of candidateBases) {
        try {
          // eslint-disable-next-line no-console
          console.log("Trying evidence endpoint:", base + endpoint);
          const res = await fetch(`${base}${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: type ?? "biochar",
              metadata: numericMeta,
              location: location || "India",
              images: images.map(toEvidencePayload),
            }),
            signal: overallController.signal,
          });

          evidenceResponse = res;
          break;
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn(`Evidence request failed for ${base}:`, err);
          lastError = err;
          if ((overallController as any).signal?.aborted) break;
          continue;
        }
      }

      clearTimeout(overallTimer);

      if (!evidenceResponse) {
        setLoading(false);
        if ((overallController as any).signal?.aborted) {
          Alert.alert(
            "Verification pending",
            "AI verification is taking longer than expected. We've submitted the project for background review — results will appear on the project page when ready.",
          );
          const project = addProject({
            name: projectName,
            type: type as any,
            location,
            status: "verifying",
            metadata: {
              ...numericMeta,
              imageEvidenceVerdict: "pending",
              imageEvidenceConfidence: 0,
              imageEvidenceSignals: "",
            },
            mediaCount: images.length,
            mediaUris: images.map((image) => image.uri),
          });
          router.push({ pathname: "/verify/[id]", params: { id: project.id } });
          return;
        }
        Alert.alert("Network Error", "Unable to reach the verification service. Check that the API server is running and try again.");
        // eslint-disable-next-line no-console
        console.error("Evidence request failed (all candidates):", lastError);
        return;
      }

      evidence = await evidenceResponse.json().catch((err) => {
        // eslint-disable-next-line no-console
        console.error("Failed to parse evidence response JSON:", err);
        return null;
      });

      if (!evidenceResponse.ok) {
        setLoading(false);
        const reason =
          evidence?.error || evidence?.message || "The uploaded images look fake, duplicated, or unrelated to this project.";
        Alert.alert("Image validation failed", reason);
        return;
      }
    }

    // Handle evidence result (mock or real)
    if (evidence?.verdict !== "pass") {
      setLoading(false);
      const reason =
        Array.isArray(evidence?.reasons) && evidence.reasons.length
          ? evidence.reasons[0]
          : "The uploaded images look fake, duplicated, or unrelated to this project.";
      Alert.alert("Image validation failed", reason);
      return;
    }

    const project = addProject({
      name: projectName,
      type: type as any,
      location,
      status: "verifying",
      metadata: {
        ...numericMeta,
        imageEvidenceVerdict: evidence.verdict,
        imageEvidenceConfidence: Number(evidence.confidence) || 0,
        imageEvidenceSignals: Array.isArray(evidence.signals) ? evidence.signals.join(",") : "",
      },
      mediaCount: images.length,
      // Don't store full image URIs locally (they exceed storage quota) — keep in router params instead
      mediaUris: [],
    });
    setLoading(false);
    // Pass image URIs via router params so they're available in verify page without storage overhead
    router.push({
      pathname: "/verify/[id]",
      params: {
        id: project.id,
        mediaUris: JSON.stringify(images.map((img) => img.uri)),
      },
    });
  }

  const progress = (step / 3) * 100;

  const typeLabels: Record<string, string> = {
    biochar: "Biochar Production",
    agroforestry: "Agroforestry",
    solar: "Solar Energy",
    ev: "EV Fleet",
    building: "Building Retrofit",
    shipping: "Shipping",
    aviation: "Aviation",
    city: "City Initiative",
    individual: "Individual Action",
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <Pressable onPress={() => (step > 1 ? setStep(step - 1) : router.back())} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>Capture Data</Text>
          <Text style={[styles.typeLabel, { color: colors.primary }]}>{typeLabels[type ?? "biochar"] ?? type}</Text>
          <View style={styles.stepRow}>
            {STEPS.map((s, i) => (
              <View key={s.label} style={styles.stepItem}>
                <View style={[styles.stepDot, { backgroundColor: i + 1 <= step ? colors.primary : colors.muted }]}>
                  {i + 1 < step ? (
                    <Feather name="check" size={10} color={colors.primaryForeground} />
                  ) : (
                    <Text style={[styles.stepNum, { color: i + 1 === step ? colors.primaryForeground : colors.mutedForeground }]}>
                      {i + 1}
                    </Text>
                  )}
                </View>
                {i < STEPS.length - 1 && (
                  <View style={[styles.stepLine, { backgroundColor: i + 1 < step ? colors.primary : colors.muted }]} />
                )}
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
        <View style={[styles.progressFill, { width: `${progress}%` as any, backgroundColor: colors.primary }]} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + 100 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>Project Information</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>Basic details about your project</Text>

            <FormField label="Project Name *" colors={colors}>
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={projectName}
                onChangeText={setProjectName}
                placeholder={`e.g. ${typeLabels[type ?? "biochar"]} — ${new Date().getFullYear()}`}
                placeholderTextColor={colors.mutedForeground}
              />
            </FormField>

            <FormField label="Location" colors={colors}>
              <View style={styles.locationRow}>
                <Feather name="map-pin" size={16} color={colors.primary} />
                <TextInput
                  style={[styles.input, { color: colors.foreground, flex: 1 }]}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="City, State, Country"
                  placeholderTextColor={colors.mutedForeground}
                />
              </View>
            </FormField>

            <View style={styles.landActionsRow}>
              <Pressable
                onPress={captureLandCoordinates}
                style={[styles.landActionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Feather name={capturingGps ? "loader" : "crosshair"} size={14} color={colors.secondary} />
                <Text style={[styles.landActionText, { color: colors.foreground }]}>
                  {capturingGps ? "Capturing..." : "Capture Land Coordinates"}
                </Text>
              </Pressable>

              <Pressable
                onPress={openLandMap}
                disabled={!gps}
                style={[
                  styles.landActionBtn,
                  {
                    backgroundColor: gps ? colors.primary + "22" : colors.muted,
                    borderColor: gps ? colors.primary : colors.border,
                    opacity: gps ? 1 : 0.6,
                  },
                ]}
              >
                <Feather name="map" size={14} color={gps ? colors.primary : colors.mutedForeground} />
                <Text style={[styles.landActionText, { color: gps ? colors.primary : colors.mutedForeground }]}>Preview Map</Text>
              </Pressable>
            </View>

            {gps ? (
              <View style={[styles.gpsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.gpsTitle, { color: colors.secondary }]}>Land Coordinates Captured</Text>
                <Text style={[styles.gpsText, { color: colors.foreground }]}>Lat {gps.latitude} | Lng {gps.longitude}</Text>
                <Text style={[styles.gpsText, { color: colors.mutedForeground }]}>
                  Accuracy: {gps.accuracy ?? "unknown"} m
                </Text>
              </View>
            ) : null}

            <FormField
              label="Land Boundary Polygon (lat,lng; lat,lng; ...)"
              hint="Use at least 3 points for a closed area. Example: 28.6139,77.2090; 28.6142,77.2101; 28.6133,77.2105"
              colors={colors}
            >
              <TextInput
                style={[styles.input, { color: colors.foreground, minHeight: 68 }]}
                value={boundaryInput}
                onChangeText={setBoundaryInput}
                multiline
                placeholder="28.6139,77.2090; 28.6142,77.2101; 28.6133,77.2105"
                placeholderTextColor={colors.mutedForeground}
              />
            </FormField>

            <View style={styles.landActionsRow}>
              <Pressable
                onPress={useGpsAsBoundaryPoint}
                disabled={!gps}
                style={[
                  styles.landActionBtn,
                  {
                    backgroundColor: gps ? colors.secondary + "22" : colors.muted,
                    borderColor: gps ? colors.secondary : colors.border,
                    opacity: gps ? 1 : 0.6,
                  },
                ]}
              >
                <Feather name="plus-circle" size={14} color={gps ? colors.secondary : colors.mutedForeground} />
                <Text style={[styles.landActionText, { color: gps ? colors.secondary : colors.mutedForeground }]}>Add GPS Point</Text>
              </Pressable>
              <View style={[styles.boundaryBadge, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <Text style={[styles.boundaryBadgeText, { color: colors.mutedForeground }]}>
                  {parseBoundaryPoints(boundaryInput).length} boundary points
                </Text>
              </View>
            </View>

            <View style={[styles.methodologyBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.methodologyRow}>
                <Feather name="shield" size={14} color={colors.secondary} />
                <Text style={[styles.methodologyLabel, { color: colors.secondary }]}>Methodology</Text>
              </View>
              <Text style={[styles.methodologyValue, { color: colors.foreground }]}>{schema.methodology}</Text>
              <Text style={[styles.methodologyNote, { color: colors.mutedForeground }]}>{schema.carbonNote}</Text>
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>{schema.metricsTitle}</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>Enter your project data for AI analysis</Text>

            {schema.fields.map((field) => (
              <DynamicField
                key={field.key}
                field={field}
                value={metadata[field.key] ?? ""}
                onChange={(v) => setField(field.key, v)}
                colors={colors}
              />
            ))}
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>Media Upload</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>{images.length}/4 photos added</Text>

            <View style={styles.mediaGrid}>
              {[0, 1, 2, 3].map((i) => {
                const uri = images[i];
                const filled = !!uri;
                return (
                  <Pressable
                    key={i}
                    onPress={filled ? () => removeImage(i) : handleAddImage}
                    style={[
                      styles.mediaBox,
                      {
                        backgroundColor: filled ? "transparent" : colors.card,
                        borderColor: filled ? colors.primary : colors.border,
                        borderStyle: filled ? "solid" : "dashed",
                        overflow: "hidden",
                      },
                    ]}
                  >
                    {filled ? (
                      <>
                        <Image source={{ uri: uri.uri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
                        <View style={styles.removeOverlay}>
                          <Feather name="x" size={16} color="#fff" />
                        </View>
                      </>
                    ) : (
                      <View style={styles.addPlaceholder}>
                        <Feather name="camera" size={26} color={colors.mutedForeground} />
                        <Text style={[styles.addLabel, { color: colors.mutedForeground }]}>Add Photo</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>

            <View style={[styles.infoBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Feather name="info" size={14} color={colors.secondary} />
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                Photos are analyzed by our AI + satellite system. Tap a photo to remove it. At least 1 photo is recommended.
              </Text>
            </View>

            <View style={[styles.infoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="shield" size={14} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                Your images are kept private. Only metadata is used for ZK proof generation — your raw coordinates are never exposed.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16, borderTopColor: colors.border }]}>
        {step === 1 && (
          <Pressable
            style={[styles.nextBtn, { backgroundColor: canProceedStep1() ? colors.primary : colors.muted }]}
            onPress={() => canProceedStep1() && setStep(2)}
            disabled={!canProceedStep1()}
          >
            <Text style={[styles.nextBtnText, { color: canProceedStep1() ? colors.primaryForeground : colors.mutedForeground }]}>
              Next: {schema.metricsTitle}
            </Text>
            <Feather name="arrow-right" size={18} color={canProceedStep1() ? colors.primaryForeground : colors.mutedForeground} />
          </Pressable>
        )}
        {step === 2 && (
          <Pressable
            style={[styles.nextBtn, { backgroundColor: colors.primary }]}
            onPress={() => setStep(3)}
          >
            <Text style={[styles.nextBtnText, { color: colors.primaryForeground }]}>Next: Upload Media</Text>
            <Feather name="arrow-right" size={18} color={colors.primaryForeground} />
          </Pressable>
        )}
        {step === 3 && (
          <AtmosButton
            label="Submit for AI Verification"
            onPress={handleSubmit}
            loading={loading}
          />
        )}
      </View>
    </View>
  );
}

function DynamicField({
  field,
  value,
  onChange,
  colors,
}: {
  field: FieldDef;
  value: string;
  onChange: (v: string) => void;
  colors: ReturnType<typeof useColors>;
}) {
  if (field.type === "chips") {
    return (
      <View style={styles.field}>
        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{field.label}</Text>
        <View style={styles.chipsRow}>
          {(field.options ?? []).map((opt) => {
            const selected = value === opt;
            return (
              <Pressable
                key={opt}
                onPress={() => onChange(opt)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selected ? colors.primary : colors.muted,
                    borderColor: selected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[styles.chipText, { color: selected ? colors.primaryForeground : colors.mutedForeground }]}>
                  {opt}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  const labelText = field.unit
    ? `${field.label} (${field.unit})${value ? ": " + Number(value).toLocaleString() : ""}`
    : field.label;

  return (
    <FormField label={labelText} hint={field.hint} colors={colors}>
      <TextInput
        style={[styles.input, { color: colors.foreground }]}
        value={value}
        onChangeText={onChange}
        placeholder={field.placeholder ?? ""}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={field.type === "number" ? "decimal-pad" : "default"}
      />
    </FormField>
  );
}

function FormField({
  label,
  hint,
  colors,
  children,
}: {
  label: string;
  hint?: string;
  colors: ReturnType<typeof useColors>;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={[styles.fieldInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {children}
      </View>
      {hint ? <Text style={[styles.fieldHint, { color: colors.mutedForeground }]}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
  },
  typeLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    marginTop: 1,
    marginBottom: 4,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNum: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
  },
  stepLine: {
    width: 20,
    height: 2,
  },
  progressBar: {
    height: 3,
    marginHorizontal: 20,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  form: {
    padding: 20,
  },
  stepContent: {
    gap: 16,
  },
  stepTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  stepSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    marginTop: -8,
  },
  methodologyBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  methodologyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  methodologyLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  methodologyValue: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  methodologyNote: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 17,
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
  },
  fieldHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    marginTop: -2,
  },
  fieldInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  landActionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  landActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  landActionText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  boundaryBadge: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  boundaryBadgeText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  gpsCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  gpsTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  gpsText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  chipsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
  },
  mediaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  mediaBox: {
    width: "47%",
    aspectRatio: 1,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  addPlaceholder: {
    alignItems: "center",
    gap: 6,
  },
  addLabel: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
  },
  removeOverlay: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  infoBox: {
    flexDirection: "row",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  infoText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  nextBtnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
});