export type AccountType = "Client" | "Channel Partner";
export type AccountStatus = "Active" | "Inactive";
export type OpportunityStatus = "Need Analysis" | "Negotiation" | "In Progress" | "On Hold" | "Completed" | "Cancelled";
export type UpdateType = "General" | "Call" | "Meeting" | "Email";
export type LeadStatus = "New" | "Contacted" | "Qualified" | "Proposal Sent" | "Converted to Account" | "Lost";

export interface Account {
  id: string;
  name: string; // Company Name for the account
  type: AccountType;
  status: AccountStatus;
  description: string;
  opportunityIds: string[];
  createdAt: string;
  updatedAt: string;
  contactEmail?: string;
  industry?: string;
  contactPersonName?: string; // Added from lead conversion
  contactPhone?: string; // Added from lead conversion
  convertedFromLeadId?: string; // Track original lead
}

export interface Lead {
  id: string;
  companyName: string;
  personName: string;
  phone?: string;
  email: string;
  linkedinProfileUrl?: string;
  country?: string;
  status: LeadStatus;
  opportunityIds: string[]; // Opportunities that might be associated before conversion
  updateIds?: string[]; // Direct updates to this lead
  createdAt: string;
  updatedAt: string;
}

// API response interface for Supabase leads (snake_case)
export interface LeadApiResponse {
  id: string;
  company_name: string;
  person_name: string;
  phone?: string;
  email: string;
  linkedin_profile_url?: string;
  country?: string;
  status: LeadStatus;
  created_at: string;
  updated_at: string;
}

export interface Opportunity {
  id: string;
  name: string;
  associated_account_id: string;
  description: string;
  amount: number;
  status: string;
  probability?: number;
  expected_close_date?: string;
  created_at: string;
  updated_at: string;
  // Add any other fields from your Supabase table as needed
}

export interface Update {
  id: string;
  opportunityId?: string; // Optional: if update is for an opportunity
  leadId?: string;        // Optional: if update is directly for a lead
  accountId?: string;     // Optional: context if opportunityId is present
  date: string;
  content: string;
  type: UpdateType;
  createdAt: string;
  updatedByUserId?: string;
}

// For AI Generated Content
export interface DailyAccountSummary {
  summary: string;
  relationshipHealth: string;
}

export interface OpportunityForecast {
  timelinePrediction: string;
  completionDateEstimate: string;
  revenueForecast: number;
  bottleneckIdentification: string;
}

export interface UpdateInsights {
  categorization?: string;
  summary?: string;
  actionItems?: string[];
  followUpSuggestions?: string[];
  sentiment?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  pin: string;
  createdAt: string;
  role?: string;
  isActive?: boolean;
  lastLoginAt?: string;
}

export interface ApiSettings {
  deepSeekApiKey?: string;
  deepSeekModel?: string;
  openRouterApiKey?: string;
  openRouterModel?: string;
}

// For Business Card OCR
export interface ExtractedLeadInfo {
    personName?: string;
    companyName?: string;
    email?: string;
    phone?: string;
}

// API response interface for Supabase users (snake_case)
export interface UserApiResponse {
  id: string;
  name: string;
  email: string;
  pin: string;
  role?: string;
  is_active?: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}
