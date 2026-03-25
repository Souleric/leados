// Demo hardcoded data — solar/renewable energy business, Malaysian context
// All dates relative to 2026-03-25

export type DemoStatus = "new" | "contacted" | "proposal_sent" | "converted" | "inactive";
export type DemoLifecycle = "active_lead" | "client" | "inactive_lead";
export type DemoSource = "Facebook" | "Instagram" | "Referral" | "Website" | "Walk-in";

export interface DemoContact {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  source: DemoSource;
  status: DemoStatus;
  lifecycle_stage: DemoLifecycle;
  assigned_to: string | null;
  created_at: string;
  proposal_sent_at: string | null;
  client_since: string | null;
  tier_id: string | null;
  notes: string | null;
}

export interface DemoTier {
  id: string;
  name: string;
  color: string;
}

export interface DemoMember {
  id: string;
  name: string;
  email: string;
  role: "agent" | "admin";
  color: string;
}

export interface DemoCampaign {
  id: string;
  name: string;
  platform: "Facebook" | "Instagram";
  status: "active" | "paused" | "ended";
  objective: string;
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  leads_count: number;
  cpl: number;
  cpm: number;
  cpc: number;
  start_date: string;
  end_date: string | null;
}

// ── Tiers ───────────────────────────────────────────────────────────────────

export const DEMO_TIERS: DemoTier[] = [
  { id: "tier-1", name: "Basic Member",   color: "#6366f1" },
  { id: "tier-2", name: "Premium Member", color: "#0891b2" },
  { id: "tier-3", name: "VIP Member",     color: "#d97706" },
];

// ── Team ────────────────────────────────────────────────────────────────────

export const DEMO_MEMBERS: DemoMember[] = [
  { id: "m1", name: "Ahmad Razif",  email: "razif@solareco.my",   role: "agent", color: "#7c3aed" },
  { id: "m2", name: "Sarah Lim",    email: "sarah@solareco.my",   role: "agent", color: "#2563eb" },
  { id: "m3", name: "Kevin Tan",    email: "kevin@solareco.my",   role: "agent", color: "#059669" },
  { id: "m4", name: "Nurul Ain",    email: "nurul@solareco.my",   role: "agent", color: "#d97706" },
];

// ── Contacts ─────────────────────────────────────────────────────────────────

export const DEMO_CONTACTS: DemoContact[] = [
  // ── Active Leads: New ──
  {
    id: "c01", name: "Ahmad Firdaus bin Kamal", phone: "+60 11-2345 6789", email: "firdaus@gmail.com",
    source: "Facebook", status: "new", lifecycle_stage: "active_lead",
    assigned_to: "Ahmad Razif", created_at: "2026-03-05T08:30:00Z",
    proposal_sent_at: null, client_since: null, tier_id: null,
    notes: "Interested in 8kW system. Has double-storey house in Subang.",
  },
  {
    id: "c02", name: "Nurul Hidayah binti Aziz", phone: "+60 12-3456 7890", email: null,
    source: "Instagram", status: "new", lifecycle_stage: "active_lead",
    assigned_to: "Sarah Lim", created_at: "2026-03-10T10:15:00Z",
    proposal_sent_at: null, client_since: null, tier_id: null,
    notes: "Saw IG ad. Average TNB bill RM 380/month.",
  },
  {
    id: "c03", name: "Tan Wei Liang", phone: "+60 16-4567 8901", email: "weilian@yahoo.com",
    source: "Facebook", status: "new", lifecycle_stage: "active_lead",
    assigned_to: "Kevin Tan", created_at: "2026-03-15T14:00:00Z",
    proposal_sent_at: null, client_since: null, tier_id: null,
    notes: "Factory owner. Interested in commercial solar.",
  },
  {
    id: "c04", name: "Siti Aminah Mohd Yusof", phone: "+60 19-5678 9012", email: null,
    source: "Referral", status: "new", lifecycle_stage: "active_lead",
    assigned_to: "Nurul Ain", created_at: "2026-03-18T09:00:00Z",
    proposal_sent_at: null, client_since: null, tier_id: null,
    notes: "Referred by Rosman. Bungalow in Damansara.",
  },
  {
    id: "c05", name: "Mohd Haziq Zulkifli", phone: "+60 17-6789 0123", email: "haziq@hotmail.com",
    source: "Website", status: "new", lifecycle_stage: "active_lead",
    assigned_to: null, created_at: "2026-03-20T11:00:00Z",
    proposal_sent_at: null, client_since: null, tier_id: null,
    notes: "Filled web form. TNB bill RM 460/month.",
  },
  {
    id: "c06", name: "Priya Ramasamy", phone: "+60 11-7890 1234", email: "priya.r@gmail.com",
    source: "Walk-in", status: "new", lifecycle_stage: "active_lead",
    assigned_to: "Ahmad Razif", created_at: "2026-03-22T15:30:00Z",
    proposal_sent_at: null, client_since: null, tier_id: null,
    notes: "Walked into showroom. Wants 6kW system.",
  },
  // ── Active Leads: Contacted ──
  {
    id: "c07", name: "Lee Choon Seng", phone: "+60 12-8901 2345", email: null,
    source: "Facebook", status: "contacted", lifecycle_stage: "active_lead",
    assigned_to: "Ahmad Razif", created_at: "2026-03-01T08:00:00Z",
    proposal_sent_at: null, client_since: null, tier_id: null,
    notes: "Spoke on phone. Needs to confirm roof orientation.",
  },
  {
    id: "c08", name: "Zainab Ibrahim", phone: "+60 13-9012 3456", email: "zainab88@gmail.com",
    source: "Instagram", status: "contacted", lifecycle_stage: "active_lead",
    assigned_to: "Sarah Lim", created_at: "2026-03-05T09:30:00Z",
    proposal_sent_at: null, client_since: null, tier_id: null,
    notes: "Interested in 10kW. Waiting for husband to decide.",
  },
  {
    id: "c09", name: "Raj Kumar Krishnan", phone: "+60 16-0123 4567", email: null,
    source: "Referral", status: "contacted", lifecycle_stage: "active_lead",
    assigned_to: "Kevin Tan", created_at: "2026-03-08T11:00:00Z",
    proposal_sent_at: null, client_since: null, tier_id: null,
    notes: "Site visit scheduled for next week.",
  },
  {
    id: "c10", name: "Farah Nadia Che Hassan", phone: "+60 19-1234 5678", email: "farahnadia@gmail.com",
    source: "Facebook", status: "contacted", lifecycle_stage: "active_lead",
    assigned_to: "Ahmad Razif", created_at: "2026-03-12T13:00:00Z",
    proposal_sent_at: null, client_since: null, tier_id: null,
    notes: "Terrace house. Bill RM 290/month.",
  },
  {
    id: "c11", name: "David Ong Boon Huat", phone: "+60 17-2345 6789", email: "davidong@hotmail.com",
    source: "Website", status: "contacted", lifecycle_stage: "active_lead",
    assigned_to: "Nurul Ain", created_at: "2026-03-14T10:00:00Z",
    proposal_sent_at: null, client_since: null, tier_id: null,
    notes: "SME owner. 3-phase connection.",
  },
  // ── Active Leads: Proposal Sent ──
  {
    id: "c12", name: "Hafizuddin Malik", phone: "+60 11-3456 7890", email: "hafiz.malik@gmail.com",
    source: "Facebook", status: "proposal_sent", lifecycle_stage: "active_lead",
    assigned_to: "Ahmad Razif", created_at: "2026-02-18T08:00:00Z",
    proposal_sent_at: "2026-03-22T10:00:00Z", client_since: null, tier_id: null,
    notes: "Proposal for 12kW system at RM 28,400. Awaiting decision.",
  },
  {
    id: "c13", name: "Chua Mei Ling", phone: "+60 12-4567 8901", email: "meiling@yahoo.com",
    source: "Instagram", status: "proposal_sent", lifecycle_stage: "active_lead",
    assigned_to: "Sarah Lim", created_at: "2026-02-01T09:00:00Z",
    proposal_sent_at: "2026-03-15T09:00:00Z", client_since: null, tier_id: null,
    notes: "8kW proposal RM 19,200. Following up this week.",
  },
  {
    id: "c14", name: "Norzaidi bin Hassan", phone: "+60 16-5678 9012", email: null,
    source: "Referral", status: "proposal_sent", lifecycle_stage: "active_lead",
    assigned_to: "Kevin Tan", created_at: "2026-02-10T10:00:00Z",
    proposal_sent_at: "2026-03-06T08:00:00Z", client_since: null, tier_id: null,
    notes: "No response after proposal. Third follow-up sent.",
  },
  {
    id: "c15", name: "Kavitha Selvan", phone: "+60 19-6789 0123", email: "kavitha.s@gmail.com",
    source: "Facebook", status: "proposal_sent", lifecycle_stage: "active_lead",
    assigned_to: "Ahmad Razif", created_at: "2026-02-15T14:00:00Z",
    proposal_sent_at: "2026-03-12T14:00:00Z", client_since: null, tier_id: null,
    notes: "10kW system. Comparing with one other vendor.",
  },
  {
    id: "c16", name: "Jeffery Yap Chee Mun", phone: "+60 17-7890 1234", email: "jeffery.yap@gmail.com",
    source: "Walk-in", status: "proposal_sent", lifecycle_stage: "active_lead",
    assigned_to: "Nurul Ain", created_at: "2026-02-12T11:00:00Z",
    proposal_sent_at: "2026-03-20T11:00:00Z", client_since: null, tier_id: null,
    notes: "6kW terrace house. Very interested.",
  },
  // ── Clients ──
  {
    id: "c17", name: "Rosman Abd Ghani", phone: "+60 12-9012 3456", email: "rosman@gmail.com",
    source: "Referral", status: "converted", lifecycle_stage: "client",
    assigned_to: "Ahmad Razif", created_at: "2025-12-10T08:00:00Z",
    proposal_sent_at: "2025-12-20T08:00:00Z", client_since: "2026-01-10T08:00:00Z", tier_id: "tier-3",
    notes: "12kW bungalow install. Happy customer — gave 3 referrals.",
  },
  {
    id: "c18", name: "Liew Sow Kim", phone: "+60 13-0123 4567", email: "sowkim@yahoo.com",
    source: "Facebook", status: "converted", lifecycle_stage: "client",
    assigned_to: "Sarah Lim", created_at: "2025-12-15T10:00:00Z",
    proposal_sent_at: "2025-12-28T10:00:00Z", client_since: "2026-01-15T10:00:00Z", tier_id: "tier-2",
    notes: "8kW semi-D. System installed and commissioned.",
  },
  {
    id: "c19", name: "Suresh Pillai", phone: "+60 16-1234 5678", email: "suresh.p@gmail.com",
    source: "Website", status: "converted", lifecycle_stage: "client",
    assigned_to: "Kevin Tan", created_at: "2025-12-20T09:00:00Z",
    proposal_sent_at: "2026-01-05T09:00:00Z", client_since: "2026-01-20T09:00:00Z", tier_id: "tier-1",
    notes: "6kW terrace. First bill savings: RM 340.",
  },
  {
    id: "c20", name: "Norhaslina Yusof", phone: "+60 19-2345 6789", email: null,
    source: "Referral", status: "converted", lifecycle_stage: "client",
    assigned_to: "Ahmad Razif", created_at: "2025-12-28T11:00:00Z",
    proposal_sent_at: "2026-01-15T11:00:00Z", client_since: "2026-01-28T11:00:00Z", tier_id: "tier-3",
    notes: "15kW bungalow. TNB export earnings of RM 190/month.",
  },
  {
    id: "c21", name: "Henry Chin Wei Sheng", phone: "+60 17-3456 7890", email: "henry.chin@gmail.com",
    source: "Instagram", status: "converted", lifecycle_stage: "client",
    assigned_to: "Nurul Ain", created_at: "2026-01-05T10:00:00Z",
    proposal_sent_at: "2026-01-20T10:00:00Z", client_since: "2026-02-05T10:00:00Z", tier_id: "tier-1",
    notes: "8kW semi-D. Very satisfied. Left 5-star Google review.",
  },
  {
    id: "c22", name: "Amirah Zulkifli", phone: "+60 11-4567 8901", email: "amirah.z@gmail.com",
    source: "Facebook", status: "converted", lifecycle_stage: "client",
    assigned_to: "Sarah Lim", created_at: "2026-01-10T08:00:00Z",
    proposal_sent_at: "2026-01-28T08:00:00Z", client_since: "2026-02-15T08:00:00Z", tier_id: "tier-2",
    notes: "10kW commercial shophouse. Reducing energy costs by 60%.",
  },
  // ── Inactive ──
  {
    id: "c23", name: "Khairul Anuar Baharom", phone: "+60 12-5678 9012", email: null,
    source: "Facebook", status: "inactive", lifecycle_stage: "inactive_lead",
    assigned_to: "Sarah Lim", created_at: "2026-01-15T09:00:00Z",
    proposal_sent_at: "2026-01-25T09:00:00Z", client_since: null, tier_id: null,
    notes: "No response after 3 follow-ups. Went with competitor.",
  },
  {
    id: "c24", name: "Betty Chong Hui Ying", phone: "+60 13-6789 0123", email: "bettychong@hotmail.com",
    source: "Instagram", status: "inactive", lifecycle_stage: "inactive_lead",
    assigned_to: "Kevin Tan", created_at: "2026-01-20T10:00:00Z",
    proposal_sent_at: null, client_since: null, tier_id: null,
    notes: "Budget constraint. May revisit later.",
  },
  {
    id: "c25", name: "Mohan Rajan", phone: "+60 16-7890 1234", email: null,
    source: "Website", status: "inactive", lifecycle_stage: "inactive_lead",
    assigned_to: "Nurul Ain", created_at: "2026-01-25T11:00:00Z",
    proposal_sent_at: null, client_since: null, tier_id: null,
    notes: "Rented property — landlord did not approve.",
  },
];

// ── Campaigns ────────────────────────────────────────────────────────────────

export const DEMO_CAMPAIGNS: DemoCampaign[] = [
  {
    id: "camp1",
    name: "Spring Solar Drive 2026",
    platform: "Facebook",
    status: "active",
    objective: "OUTCOME_LEADS",
    spend: 4200,
    impressions: 148000,
    reach: 98400,
    clicks: 3120,
    leads_count: 38,
    cpl: 110.53,
    cpm: 28.38,
    cpc: 1.35,
    start_date: "2026-03-01",
    end_date: null,
  },
  {
    id: "camp2",
    name: "IG Home Makeover — March",
    platform: "Instagram",
    status: "active",
    objective: "OUTCOME_LEADS",
    spend: 2800,
    impressions: 92000,
    reach: 67000,
    clicks: 2240,
    leads_count: 24,
    cpl: 116.67,
    cpm: 30.43,
    cpc: 1.25,
    start_date: "2026-03-08",
    end_date: null,
  },
  {
    id: "camp3",
    name: "Q4 Property Owners Campaign",
    platform: "Facebook",
    status: "ended",
    objective: "OUTCOME_LEADS",
    spend: 6500,
    impressions: 240000,
    reach: 160000,
    clicks: 5400,
    leads_count: 62,
    cpl: 104.84,
    cpm: 27.08,
    cpc: 1.20,
    start_date: "2025-10-01",
    end_date: "2025-12-31",
  },
  {
    id: "camp4",
    name: "Referral Boost — Feb",
    platform: "Instagram",
    status: "paused",
    objective: "OUTCOME_LEADS",
    spend: 1900,
    impressions: 58000,
    reach: 42000,
    clicks: 1480,
    leads_count: 16,
    cpl: 118.75,
    cpm: 32.76,
    cpc: 1.28,
    start_date: "2026-02-01",
    end_date: "2026-02-28",
  },
];

// ── Dashboard Analytics ───────────────────────────────────────────────────────

export const DEMO_KPIS = {
  totalLeads:     96,
  newLeads:       18,
  inProgress:     42,
  closedWon:      29,
  lost:            7,
  unassigned:      5,
  thisMonth:      18,
  lastMonth:      16,
  monthChange:    12,
  conversionRate: 30,
};

export const DEMO_PER_DAY = [
  { date: "2026-03-25", total: 4, qualified: 1 },
  { date: "2026-03-24", total: 3, qualified: 1 },
  { date: "2026-03-23", total: 5, qualified: 2 },
  { date: "2026-03-22", total: 2, qualified: 0 },
  { date: "2026-03-21", total: 6, qualified: 2 },
  { date: "2026-03-20", total: 4, qualified: 1 },
  { date: "2026-03-19", total: 3, qualified: 1 },
  { date: "2026-03-18", total: 7, qualified: 3 },
  { date: "2026-03-17", total: 5, qualified: 2 },
  { date: "2026-03-16", total: 4, qualified: 1 },
  { date: "2026-03-15", total: 6, qualified: 2 },
  { date: "2026-03-14", total: 8, qualified: 3 },
  { date: "2026-03-13", total: 4, qualified: 1 },
  { date: "2026-03-12", total: 5, qualified: 2 },
  { date: "2026-03-11", total: 3, qualified: 1 },
  { date: "2026-03-10", total: 6, qualified: 2 },
  { date: "2026-03-09", total: 4, qualified: 2 },
  { date: "2026-03-08", total: 7, qualified: 3 },
  { date: "2026-03-07", total: 3, qualified: 1 },
  { date: "2026-03-06", total: 5, qualified: 2 },
  { date: "2026-03-05", total: 4, qualified: 1 },
  { date: "2026-03-04", total: 6, qualified: 2 },
  { date: "2026-03-03", total: 5, qualified: 2 },
  { date: "2026-03-02", total: 4, qualified: 1 },
  { date: "2026-03-01", total: 7, qualified: 3 },
  { date: "2026-02-28", total: 5, qualified: 2 },
  { date: "2026-02-27", total: 3, qualified: 1 },
  { date: "2026-02-26", total: 4, qualified: 1 },
  { date: "2026-02-25", total: 6, qualified: 2 },
  { date: "2026-02-24", total: 5, qualified: 2 },
];

export const DEMO_PER_SOURCE = [
  { source: "Facebook",  total: 38 },
  { source: "Instagram", total: 27 },
  { source: "Referral",  total: 18 },
  { source: "Website",   total: 9  },
  { source: "Walk-in",   total: 4  },
];

// Per-member stats for the charts
export const DEMO_PER_MEMBER = [
  { name: "Ahmad Razif", total: 35, closed_won: 12, in_progress: 14 },
  { name: "Sarah Lim",   total: 28, closed_won: 8,  in_progress: 10 },
  { name: "Kevin Tan",   total: 22, closed_won: 5,  in_progress: 9  },
  { name: "Nurul Ain",   total: 18, closed_won: 4,  in_progress: 7  },
];
