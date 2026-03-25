export type LeadStatus = "new" | "contacted" | "proposal_sent" | "converted" | "inactive";
export type LifecycleStage = "active_lead" | "client" | "inactive_lead";
export type LeadSource = "Facebook" | "Instagram" | "TikTok" | "Referral" | "Website" | "Walk-in" | "WhatsApp" | "Manual";
export type MessageDirection = "inbound" | "outbound";
export type MessageType = "text" | "image" | "audio" | "document" | "template" | "interactive" | "unknown";

export interface DbWorkspace {
  id: string;
  name: string;
  slug: string | null;
  owner_email: string | null;
  logo_url: string | null;
  timezone: string;
  meta_app_id: string | null;
  meta_phone_number_id: string | null;
  meta_waba_id: string | null;
  meta_access_token: string | null;
  meta_webhook_verify_token: string | null;
  meta_phone_display: string | null;
  meta_business_name: string | null;
  meta_connected: boolean;
  meta_connected_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbLead {
  id: string;
  workspace_id?: string | null;
  phone: string;
  name: string | null;
  source: string;
  campaign: string | null;
  status: LeadStatus;
  lifecycle_stage: LifecycleStage;
  assigned_to: string | null;
  tags: string[];
  notes: string;
  tier_id: string | null;
  proposal_sent_at: string | null;
  inactivity_reason: string | null;
  client_since: string | null;
  wa_contact_id: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbMembershipTier {
  id: string;
  workspace_id: string;
  name: string;
  color: string;
  sort_order: number;
  created_at: string;
}

export interface DbMessage {
  id: string;
  lead_id: string;
  workspace_id?: string | null;
  wa_message_id: string | null;
  direction: MessageDirection;
  type: MessageType;
  content: string;
  media_url: string | null;
  status: string;
  sender_name: string | null;
  timestamp: string;
  created_at: string;
}

export interface DbCampaign {
  id: string;
  workspace_id: string | null;
  name: string;
  platform: string;
  spend: number;
  status: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export interface DbTeamMember {
  id: string;
  workspace_id: string;
  name: string;
  email: string | null;
  role: "admin" | "agent" | "viewer";
  avatar_color: string;
  status: "online" | "offline" | "busy";
  created_at: string;
}
