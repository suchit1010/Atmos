import { AIVerificationResult } from '../services/ai';
import { ZKProofOutput } from '../services/zk';

export interface MockProject {
  id: string;
  user_id: string;
  entity_type: string;
  name: string;
  location: { lat: number; lng: number };
  area_ha: number;
  metadata: any;
  status: 'submitted' | 'analyzing' | 'ai_complete' | 'zk_generated' | 'verified' | 'listed' | 'retired' | 'rejected';
  created_at: string;
  updated_at: string;
  farmer_name: string;
}

export const mockProjects = new Map<string, MockProject>();
export const mockVerifications = new Map<string, AIVerificationResult>();
export const mockProofs = new Map<string, ZKProofOutput>();
export const mockCredits = new Map<string, any>();
export const mockListings = new Map<string, any>();
