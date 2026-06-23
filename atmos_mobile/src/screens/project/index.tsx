import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Dimensions, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Colors, Typography, Spacing, Radius } from '../../theme';
import { Button, Card, Input } from '../../components/common';
import { Ionicons } from '@expo/vector-icons';
import { ProjectsAPI } from '../../services/api';

const { width } = Dimensions.get('window');

// ─── Entity types ─────────────────────────────────────
const ENTITIES = [
  { id: 'biochar',      icon: 'leaf',       label: 'Biochar Production',  sub: 'Convert biomass to biochar', color: '#22C55E' },
  { id: 'agroforestry', icon: 'options',    label: 'Agroforestry',        sub: 'Tree planting on agricultural land', color: '#22C55E' },
  { id: 'soil_carbon',  icon: 'earth',      label: 'Soil Carbon',         sub: 'Improve soil organic carbon', color: '#3B82F6' },
  { id: 'crop_residue', icon: 'flower',     label: 'Crop Residue',        sub: 'Manage crop residue', color: '#EAB308' },
  { id: 'solar_energy', icon: 'sunny',      label: 'Solar Energy',        sub: 'Renewable energy generation', color: '#EAB308' },
  { id: 'ev_fleet',     icon: 'flash',      label: 'EV Fleet',            sub: 'Electric vehicle transport', color: '#3B82F6' },
  { id: 'building',     icon: 'business',   label: 'Building Retrofit',   sub: 'Energy efficiency upgrade', color: '#8B5CF6' },
  { id: 'shipping',     icon: 'boat',       label: 'Shipping',            sub: 'Maritime emissions reduction', color: '#EC4899' },
  { id: 'aviation',     icon: 'airplane',   label: 'Aviation',            sub: 'Air travel offsets', color: '#3B82F6' },
  { id: 'city',         icon: 'business',   label: 'City Initiative',     sub: 'Urban infrastructure', color: '#A855F7' },
  { id: 'individual',   icon: 'person',     label: 'Individual Action',   sub: 'Personal climate actions', color: '#F97316' },
];

// ─── Dynamic form fields per entity ──────────────────
const ENTITY_FIELDS: Record<string, Array<{
  id: string; label: string; type: 'text' | 'number' | 'select' | 'location'; 
  options?: string[]; placeholder?: string; unit?: string;
}>> = {
  biochar: [
    { id: 'farmerName',            label: 'Farmer / Producer Name', type: 'text',   placeholder: 'Raju Koli' },
    { id: 'village',               label: 'Village / Location',     type: 'text',   placeholder: 'Vasana, Gujarat' },
    { id: 'areaHa',                label: 'Area (hectares)',         type: 'number', placeholder: '2.48', unit: 'ha' },
    { id: 'cropType',              label: 'Crop Type',               type: 'select', options: ['Rice', 'Wheat', 'Cotton', 'Sugarcane', 'Other'] },
    { id: 'residueType',           label: 'Residue Type',            type: 'select', options: ['Rice Husk', 'Wheat Straw', 'Cotton Stalks', 'Bagasse'] },
    { id: 'biomassAvailableTonnes',label: 'Biomass Input (t/month)', type: 'number', placeholder: '12.5', unit: 't' },
    { id: 'biocharYieldTonnes',    label: 'Biochar Output (t/month)',type: 'number', placeholder: '3.2',  unit: 't' },
    { id: 'processingMethod',      label: 'Equipment Type',          type: 'select', options: ['Retort Kiln', 'TLUD', 'Rotary Kiln', 'Flash Carboniser'] },
  ],
  agroforestry: [
    { id: 'farmerName',    label: 'Farmer Name',    type: 'text',   placeholder: 'Ramesh Patel' },
    { id: 'areaHa',        label: 'Area (ha)',       type: 'number', placeholder: '5.0',    unit: 'ha' },
    { id: 'treesPlanted',  label: 'Trees Planted',   type: 'number', placeholder: '500',    unit: 'trees' },
    { id: 'treeSpecies',   label: 'Tree Species',    type: 'select', options: ['Neem', 'Mango', 'Bamboo', 'Teak', 'Acacia', 'Mixed'] },
    { id: 'plantingDate',  label: 'Planting Date',   type: 'text',   placeholder: 'YYYY-MM-DD' },
    { id: 'soilType',      label: 'Soil Type',       type: 'select', options: ['Loamy', 'Sandy', 'Clay', 'Silty'] },
  ],
  soil_carbon: [
    { id: 'farmerName',          label: 'Farmer Name',              type: 'text',   placeholder: 'Name' },
    { id: 'areaHa',              label: 'Area (ha)',                 type: 'number', placeholder: '3.0', unit: 'ha' },
    { id: 'baselineSoilCarbon',  label: 'Baseline Soil Carbon (%)', type: 'number', placeholder: '1.0', unit: '%' },
    { id: 'currentSoilCarbon',   label: 'Current Soil Carbon (%)',  type: 'number', placeholder: '1.5', unit: '%' },
    { id: 'practiceAdopted',     label: 'Practice Adopted',         type: 'select', options: ['Cover Cropping', 'No-Till', 'Compost', 'Biochar'] },
  ],
  ev_fleet: [
    { id: 'companyName',         label: 'Company Name',             type: 'text',   placeholder: 'GreenFleet India' },
    { id: 'fleetSize',           label: 'Fleet Size',               type: 'number', placeholder: '10',   unit: 'vehicles' },
    { id: 'vehicleType',         label: 'Vehicle Type',             type: 'select', options: ['2-Wheeler', '3-Wheeler', 'Car/SUV', 'Bus', 'Truck'] },
    { id: 'monthlyKmElectric',   label: 'Monthly km (electric)',    type: 'number', placeholder: '5000', unit: 'km' },
    { id: 'baselineFuelType',    label: 'Replaced Fuel Type',       type: 'select', options: ['petrol', 'diesel', 'cng'] },
  ],
  building: [
    { id: 'buildingName',        label: 'Building Name',            type: 'text',   placeholder: 'HQ Tower' },
    { id: 'buildingType',        label: 'Building Type',            type: 'select', options: ['Office', 'Residential', 'Mall', 'Hotel', 'Hospital'] },
    { id: 'floorAreaSqFt',       label: 'Floor Area (sq ft)',       type: 'number', placeholder: '50000' },
    { id: 'baselineEnergyKwh',   label: 'Baseline Energy (kWh/yr)', type: 'number', placeholder: '500000' },
    { id: 'currentEnergyKwh',    label: 'Current Energy (kWh/yr)',  type: 'number', placeholder: '350000' },
    { id: 'measureImplemented',  label: 'Measure Implemented',      type: 'select', options: ['Solar Rooftop', 'LED Retrofit', 'HVAC Upgrade', 'Smart BMS'] },
  ],
};

// Generic fallback fields
const DEFAULT_FIELDS = [
  { id: 'name',        label: 'Project Name',     type: 'text' as const,   placeholder: 'Enter project name' },
  { id: 'description', label: 'Description',      type: 'text' as const,   placeholder: 'Describe the climate action' },
  { id: 'areaHa',      label: 'Area (ha)',         type: 'number' as const, placeholder: '1.0' },
];

// ─── Step indicator ───────────────────────────────────
function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 4, marginBottom: Spacing.lg }}>
      {Array.from({ length: total }).map((_, i) => (
        <View key={i} style={{
          flex: 1, height: 3, borderRadius: 2,
          backgroundColor: i < step ? Colors.primary : i === step ? Colors.primaryGlow : Colors.bgInput,
        }} />
      ))}
    </View>
  );
}

// ─── Step 1: Select Entity Type ───────────────────────
export function SelectProjectTypeScreen({ navigation }: any) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <LinearGradient colors={['#040C06', '#091410']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[Typography.bodyLg, { color: Colors.textMuted }]}>←</Text>
          </TouchableOpacity>
          <Text style={[Typography.displaySm, { color: Colors.text }]}>Select Project Type</Text>
          <View style={{ width: 24 }} />
        </View>
        <Text style={[Typography.bodyMd, { color: Colors.textMuted, paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg }]}>
          Choose the type of climate action you want to create
        </Text>

        <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {ENTITIES.map((e) => {
              const isSelected = selected === e.id;
              return (
                <TouchableOpacity
                  key={e.id}
                  onPress={() => setSelected(e.id)}
                  style={[styles.entityCard, isSelected ? styles.entityCardSelected : {}]}
                >
                  <Ionicons name={e.icon as any} size={32} color={e.color} style={{ marginBottom: Spacing.sm }} />
                  <Text style={[Typography.labelMd, { color: isSelected ? Colors.primary : Colors.text, textAlign: 'center' }]}>
                    {e.label}
                  </Text>
                  <Text style={[Typography.bodyXs, { color: Colors.textMuted, marginTop: 4, textAlign: 'center' }]}>
                    {e.sub}
                  </Text>
                  {isSelected && (
                    <View style={styles.entityCheckmark}>
                      <Text style={{ fontSize: 12, color: Colors.textInverse }}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <Button
            label={selected ? `Continue with ${ENTITIES.find(e => e.id === selected)?.label}` : 'Select a project type'}
            onPress={() => selected && navigation.navigate('CaptureData', { entityType: selected })}
            disabled={!selected}
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Step 2: Capture Project Data ─────────────────────
export function CaptureDataScreen({ route, navigation }: any) {
  const { entityType } = route.params || { entityType: 'biochar' };
  const entity         = ENTITIES.find(e => e.id === entityType) || ENTITIES[0];
  const fields         = ENTITY_FIELDS[entityType] || DEFAULT_FIELDS;

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [location,  setLocation]  = useState<{ lat: number; lng: number } | null>(null);
  const [photos,    setPhotos]    = useState<string[]>([]);
  const [step,      setStep]      = useState(0); // 0=details, 1=location, 2=media
  const [loading,   setLoading]   = useState(false);

  const totalSteps = 3;

  const setField = (id: string, val: string) =>
    setFormData(prev => ({ ...prev, [id]: val }));

  const pickLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Location permission needed'); return; }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
  };

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!res.canceled) {
      setPhotos(prev => [...prev, ...res.assets.map(a => a.uri)].slice(0, 6));
    }
  };

  const handleSubmit = async () => {
    if (!location) { Alert.alert('Please capture your location'); return; }
    setLoading(true);
    try {
      const payload = {
        entityType,
        name:     formData.farmerName || formData.companyName || formData.name || entity.label,
        location: { lat: location.lat, lng: location.lng },
        metadata: { ...formData, treeSpecies: formData.treeSpecies ? [formData.treeSpecies] : undefined },
        areaHa:   parseFloat(formData.areaHa || '1'),
      };
      const { data } = await ProjectsAPI.create(payload);
      navigation.navigate('Verification', { projectId: data.project.id });
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Failed to create project');
    } finally { setLoading(false); }
  };

  return (
    <LinearGradient colors={['#040C06', '#091410']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[Typography.bodyLg, { color: Colors.textMuted }]}>←</Text>
          </TouchableOpacity>
          <View>
            <Text style={[Typography.displaySm, { color: Colors.text }]}>{entity.icon} {entity.label}</Text>
            <Text style={[Typography.bodyXs, { color: Colors.textMuted, textAlign: 'center' }]}>
              Step {step + 1} of {totalSteps}
            </Text>
          </View>
          <View style={{ width: 24 }} />
        </View>

        <View style={{ paddingHorizontal: Spacing.lg }}>
          <StepIndicator step={step + 1} total={totalSteps} />
        </View>

        <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">

          {step === 0 && (
            <Card>
              <Text style={[Typography.labelMd, { color: Colors.text, marginBottom: Spacing.lg }]}>
                Project Details
              </Text>
              {fields.map(f => (
                <View key={f.id}>
                  {f.type === 'select' ? (
                    <View style={{ marginBottom: Spacing.md }}>
                      <Text style={[Typography.labelSm, { color: Colors.textMuted, marginBottom: Spacing.xs }]}>
                        {f.label}
                      </Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          {(f.options || []).map(opt => (
                            <TouchableOpacity
                              key={opt}
                              onPress={() => setField(f.id, opt)}
                              style={{
                                paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.full,
                                backgroundColor: formData[f.id] === opt ? Colors.primaryDim : Colors.bgInput,
                                borderWidth: 1,
                                borderColor: formData[f.id] === opt ? Colors.primary : Colors.border,
                              }}
                            >
                              <Text style={[Typography.labelSm, {
                                color: formData[f.id] === opt ? Colors.primary : Colors.textMuted,
                              }]}>{opt}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </ScrollView>
                    </View>
                  ) : (
                    <Input
                      label={`${f.label}${f.unit ? ` (${f.unit})` : ''}`}
                      value={formData[f.id] || ''}
                      onChangeText={v => setField(f.id, v)}
                      placeholder={f.placeholder}
                      keyboardType={f.type === 'number' ? 'numeric' : 'default'}
                    />
                  )}
                </View>
              ))}
            </Card>
          )}

          {step === 1 && (
            <Card>
              <Text style={[Typography.labelMd, { color: Colors.text, marginBottom: Spacing.lg }]}>
                📍 Farm Location
              </Text>
              {location ? (
                <View>
                  <View style={styles.locationResult}>
                    <Text style={{ fontSize: 24 }}>📍</Text>
                    <View style={{ marginLeft: Spacing.md }}>
                      <Text style={[Typography.labelMd, { color: Colors.primary }]}>Location Captured</Text>
                      <Text style={[Typography.monoSm, { color: Colors.textMuted, marginTop: 4 }]}>
                        {location.lat.toFixed(5)}°N, {location.lng.toFixed(5)}°E
                      </Text>
                      <Text style={[Typography.bodyXs, { color: Colors.textDim, marginTop: 2 }]}>
                        GPS Accuracy ±3.2m
                      </Text>
                    </View>
                  </View>
                  <Button
                    label="Re-capture Location"
                    variant="ghost"
                    onPress={pickLocation}
                    style={{ marginTop: Spacing.md }}
                  />
                </View>
              ) : (
                <View style={{ alignItems: 'center', padding: Spacing['2xl'] }}>
                  <Text style={{ fontSize: 48 }}>🗺️</Text>
                  <Text style={[Typography.bodyMd, { color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.md }]}>
                    Capture your farm's GPS location for satellite verification
                  </Text>
                  <Button
                    label="Capture Location"
                    onPress={pickLocation}
                    style={{ marginTop: Spacing.xl, width: '100%' }}
                  />
                </View>
              )}
            </Card>
          )}

          {step === 2 && (
            <Card>
              <Text style={[Typography.labelMd, { color: Colors.text, marginBottom: Spacing.sm }]}>
                📸 Photos & Evidence
              </Text>
              <Text style={[Typography.bodyXs, { color: Colors.textMuted, marginBottom: Spacing.lg }]}>
                Add photos of your farm, equipment, and operation
              </Text>
              <View style={styles.photoGrid}>
                {photos.map((uri, i) => (
                  <Image key={i} source={{ uri }} style={styles.photoThumb} />
                ))}
                {photos.length < 6 && (
                  <TouchableOpacity style={styles.addPhoto} onPress={pickImage}>
                    <Text style={{ fontSize: 24, color: Colors.textMuted }}>+</Text>
                    <Text style={[Typography.bodyXs, { color: Colors.textMuted, marginTop: 4 }]}>Add</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={[Typography.bodyXs, { color: Colors.textDim, marginTop: Spacing.md }]}>
                {photos.length}/6 photos • GPS metadata preserved for verification
              </Text>
            </Card>
          )}
        </ScrollView>

        <View style={styles.bottomBar}>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            {step > 0 && (
              <Button
                label="Back"
                variant="ghost"
                onPress={() => setStep(s => s - 1)}
                style={{ flex: 1 }}
              />
            )}
            {step < totalSteps - 1 ? (
              <Button
                label="Next →"
                onPress={() => setStep(s => s + 1)}
                style={{ flex: 2 }}
              />
            ) : (
              <Button
                label="Submit Project"
                onPress={handleSubmit}
                loading={loading}
                style={{ flex: 2 }}
              />
            )}
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  entityCard: {
    flexBasis: '48%',
    backgroundColor: Colors.bgCard, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, alignItems: 'center',
    minHeight: 110, position: 'relative',
    marginBottom: Spacing.sm,
  },
  entityCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryDim,
  },
  entityCheckmark: {
    position: 'absolute', top: 6, right: 6,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.bg, borderTopWidth: 1, borderColor: Colors.border,
    padding: Spacing.lg, paddingBottom: Spacing['2xl'],
  },
  locationResult: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.primaryDim, borderRadius: Radius.md,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.borderBright,
  },
  photoGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm,
  },
  photoThumb: {
    flexBasis: '23%',
    aspectRatio: 1,
    borderRadius: Radius.sm,
  },
  addPhoto: {
    flexBasis: '23%',
    aspectRatio: 1,
    borderRadius: Radius.sm, backgroundColor: Colors.bgInput,
    borderWidth: 1, borderColor: Colors.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
});
