export type LeadStatus = "new" | "contacted" | "quotation_sent" | "closed_won" | "lost";
export type LeadSource = "Facebook" | "Instagram" | "TikTok" | "Referral" | "Website" | "Walk-in";
export type InquiryType = "Roofing" | "Acrylic" | "Waterproofing" | "Renovation" | "Consultation";

export interface Lead {
  id: string;
  name: string;
  phone: string;
  source: LeadSource;
  inquiryType: InquiryType;
  status: LeadStatus;
  assignedTo: string;
  createdAt: string;
  tags: string[];
  notes: string;
  budget?: string;
  location?: string;
  messages: Message[];
}

export interface Message {
  id: string;
  type: "incoming" | "outgoing";
  content: string;
  timestamp: string;
  sender?: string;
}

export interface Campaign {
  id: string;
  name: string;
  platform: "Facebook" | "Instagram" | "TikTok";
  spend: number;
  leadsGenerated: number;
  conversions: number;
  startDate: string;
  endDate: string;
  status: "active" | "paused" | "ended";
}

export interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  role: string;
  leadsHandled: number;
  avgResponseTime: string;
  closeRate: number;
  revenue: number;
  status: "online" | "offline" | "busy";
}

export const leads: Lead[] = [
  {
    id: "lead-001",
    name: "Ahmad Faizal bin Mohd Noor",
    phone: "+60123456789",
    source: "Facebook",
    inquiryType: "Roofing",
    status: "quotation_sent",
    assignedTo: "Hafiz Azman",
    createdAt: "2024-03-10T09:23:00Z",
    tags: ["urgent", "high-value"],
    budget: "RM 15,000 - RM 20,000",
    location: "Shah Alam, Selangor",
    notes: "Customer has a double-storey terrace. Wants full roof replacement. Prefers zinc material. Follow up scheduled for next week.",
    messages: [
      { id: "m1", type: "incoming", content: "Assalamualaikum, saya ada masalah bumbung bocor. Boleh buat quotation?", timestamp: "2024-03-10T09:23:00Z" },
      { id: "m2", type: "outgoing", content: "Waalaikumsalam! Boleh, kami akan bantu. Boleh share alamat rumah dan gambar bumbung?", timestamp: "2024-03-10T09:25:00Z", sender: "Hafiz Azman" },
      { id: "m3", type: "incoming", content: "Shah Alam, Seksyen 7. Ini gambarnya.", timestamp: "2024-03-10T09:30:00Z" },
      { id: "m4", type: "outgoing", content: "Terima kasih! Kami akan lawat site pada hari Khamis pukul 10am. Boleh?", timestamp: "2024-03-10T09:35:00Z", sender: "Hafiz Azman" },
      { id: "m5", type: "incoming", content: "Boleh! Terima kasih.", timestamp: "2024-03-10T09:36:00Z" },
      { id: "m6", type: "outgoing", content: "Ini quotation untuk kerja bumbung rumah encik. Total RM 17,500 termasuk material dan pemasangan.", timestamp: "2024-03-12T14:00:00Z", sender: "Hafiz Azman" },
    ],
  },
  {
    id: "lead-002",
    name: "Nurul Aini binti Zulkifli",
    phone: "+60198765432",
    source: "Instagram",
    inquiryType: "Acrylic",
    status: "contacted",
    assignedTo: "Siti Rahayu",
    createdAt: "2024-03-11T11:45:00Z",
    tags: ["acrylic", "bulk"],
    budget: "RM 5,000 - RM 8,000",
    location: "Petaling Jaya, Selangor",
    notes: "Running a cafe, needs acrylic signage and display boards. Wants samples first.",
    messages: [
      { id: "m1", type: "incoming", content: "Hi, I saw your Instagram post about acrylic. Can you do custom sizes?", timestamp: "2024-03-11T11:45:00Z" },
      { id: "m2", type: "outgoing", content: "Yes absolutely! We do all custom sizes. What are your requirements?", timestamp: "2024-03-11T11:50:00Z", sender: "Siti Rahayu" },
      { id: "m3", type: "incoming", content: "I need signage for my cafe, maybe 10-15 pieces different sizes", timestamp: "2024-03-11T11:52:00Z" },
      { id: "m4", type: "outgoing", content: "Great! Can you share more details or any reference designs?", timestamp: "2024-03-11T11:55:00Z", sender: "Siti Rahayu" },
    ],
  },
  {
    id: "lead-003",
    name: "Tan Wei Ming",
    phone: "+60112223334",
    source: "Facebook",
    inquiryType: "Waterproofing",
    status: "closed_won",
    assignedTo: "Hafiz Azman",
    createdAt: "2024-03-05T08:00:00Z",
    tags: ["completed", "repeat-customer"],
    budget: "RM 8,000",
    location: "Subang Jaya, Selangor",
    notes: "Basement waterproofing done. Happy with the result. Potential for roofing next quarter.",
    messages: [
      { id: "m1", type: "incoming", content: "My basement keeps flooding during heavy rain. Can you help?", timestamp: "2024-03-05T08:00:00Z" },
      { id: "m2", type: "outgoing", content: "Yes! We specialize in waterproofing solutions. Can we arrange a site visit?", timestamp: "2024-03-05T08:05:00Z", sender: "Hafiz Azman" },
      { id: "m3", type: "incoming", content: "Sure, when can you come?", timestamp: "2024-03-05T08:10:00Z" },
      { id: "m4", type: "outgoing", content: "We can come this Saturday at 10am. Does that work?", timestamp: "2024-03-05T08:12:00Z", sender: "Hafiz Azman" },
      { id: "m5", type: "incoming", content: "Perfect! See you then.", timestamp: "2024-03-05T08:15:00Z" },
      { id: "m6", type: "outgoing", content: "Job completed! Thank you for choosing us. Please leave us a review 😊", timestamp: "2024-03-14T16:00:00Z", sender: "Hafiz Azman" },
      { id: "m7", type: "incoming", content: "Will do! Very satisfied with the work.", timestamp: "2024-03-14T16:30:00Z" },
    ],
  },
  {
    id: "lead-004",
    name: "Rajesh Kumar Pillai",
    phone: "+60167778889",
    source: "Referral",
    inquiryType: "Renovation",
    status: "new",
    assignedTo: "Unassigned",
    createdAt: "2024-03-14T15:30:00Z",
    tags: ["new", "referral"],
    budget: "RM 30,000+",
    location: "Damansara Heights, KL",
    notes: "Referred by Tan Wei Ming. Looking for full kitchen + bathroom renovation.",
    messages: [
      { id: "m1", type: "incoming", content: "Hi, my friend Tan Wei Ming recommended you. I need full home renovation.", timestamp: "2024-03-14T15:30:00Z" },
    ],
  },
  {
    id: "lead-005",
    name: "Siti Fatimah binti Hassan",
    phone: "+60134445556",
    source: "TikTok",
    inquiryType: "Acrylic",
    status: "lost",
    assignedTo: "Siti Rahayu",
    createdAt: "2024-03-08T10:00:00Z",
    tags: ["price-sensitive", "lost"],
    budget: "RM 1,000",
    location: "Klang, Selangor",
    notes: "Lost to competitor on price. Budget was too low for the scope requested.",
    messages: [
      { id: "m1", type: "incoming", content: "How much for acrylic photo frame 20x30?", timestamp: "2024-03-08T10:00:00Z" },
      { id: "m2", type: "outgoing", content: "For that size, starting from RM 150 per piece. How many do you need?", timestamp: "2024-03-08T10:05:00Z", sender: "Siti Rahayu" },
      { id: "m3", type: "incoming", content: "50 pieces. Boleh dapat harga special?", timestamp: "2024-03-08T10:10:00Z" },
      { id: "m4", type: "outgoing", content: "For 50 pcs, we can offer RM 120 per piece = RM 6,000", timestamp: "2024-03-08T10:15:00Z", sender: "Siti Rahayu" },
      { id: "m5", type: "incoming", content: "Too expensive. I found cheaper elsewhere. Thanks anyway.", timestamp: "2024-03-08T10:30:00Z" },
    ],
  },
  {
    id: "lead-006",
    name: "Mohd Rizal bin Abd Rahman",
    phone: "+60145556667",
    source: "Website",
    inquiryType: "Roofing",
    status: "contacted",
    assignedTo: "Hafiz Azman",
    createdAt: "2024-03-13T14:20:00Z",
    tags: ["website", "roofing"],
    budget: "RM 10,000 - RM 15,000",
    location: "Cheras, KL",
    notes: "Submitted enquiry form on website. Terraced house, partial roof replacement needed.",
    messages: [
      { id: "m1", type: "outgoing", content: "Hello Encik Rizal! We received your enquiry about roofing. Can we call you to discuss?", timestamp: "2024-03-13T14:25:00Z", sender: "Hafiz Azman" },
      { id: "m2", type: "incoming", content: "Yes, please call after 6pm", timestamp: "2024-03-13T14:30:00Z" },
      { id: "m3", type: "outgoing", content: "Will do! We'll call you at 6:30pm today.", timestamp: "2024-03-13T14:32:00Z", sender: "Hafiz Azman" },
    ],
  },
  {
    id: "lead-007",
    name: "Lee Cheng Huat",
    phone: "+60189990001",
    source: "Facebook",
    inquiryType: "Consultation",
    status: "quotation_sent",
    assignedTo: "Siti Rahayu",
    createdAt: "2024-03-12T09:00:00Z",
    tags: ["factory", "large-project"],
    budget: "RM 50,000+",
    location: "Shah Alam Industrial Area",
    notes: "Factory owner. Needs full roof assessment and waterproofing for 3 factory blocks.",
    messages: [
      { id: "m1", type: "incoming", content: "I need assessment for my factory roof. 3 blocks, each about 5000sqft", timestamp: "2024-03-12T09:00:00Z" },
      { id: "m2", type: "outgoing", content: "That's a significant project! We'll send our senior team for assessment. When are you available?", timestamp: "2024-03-12T09:10:00Z", sender: "Siti Rahayu" },
    ],
  },
  {
    id: "lead-008",
    name: "Nur Hidayah binti Kamarudin",
    phone: "+60122221113",
    source: "Instagram",
    inquiryType: "Acrylic",
    status: "new",
    assignedTo: "Unassigned",
    createdAt: "2024-03-15T10:00:00Z",
    tags: ["new", "instagram"],
    budget: "RM 2,000 - RM 3,000",
    location: "Ampang, KL",
    notes: "Small business owner, wants acrylic product display.",
    messages: [
      { id: "m1", type: "incoming", content: "Salam, tengok kat IG. Boleh buat stand acrylic untuk produk skincare?", timestamp: "2024-03-15T10:00:00Z" },
    ],
  },
];

export const campaigns: Campaign[] = [
  {
    id: "camp-001",
    name: "Roofing Campaign March",
    platform: "Facebook",
    spend: 3200,
    leadsGenerated: 45,
    conversions: 8,
    startDate: "2024-03-01",
    endDate: "2024-03-31",
    status: "active",
  },
  {
    id: "camp-002",
    name: "Acrylic Bulk Promo",
    platform: "Facebook",
    spend: 1800,
    leadsGenerated: 38,
    conversions: 12,
    startDate: "2024-03-01",
    endDate: "2024-03-15",
    status: "ended",
  },
  {
    id: "camp-003",
    name: "Waterproofing Solutions",
    platform: "Instagram",
    spend: 2500,
    leadsGenerated: 29,
    conversions: 6,
    startDate: "2024-03-05",
    endDate: "2024-03-31",
    status: "active",
  },
  {
    id: "camp-004",
    name: "Home Renovation Q1",
    platform: "TikTok",
    spend: 4100,
    leadsGenerated: 72,
    conversions: 11,
    startDate: "2024-01-15",
    endDate: "2024-03-31",
    status: "active",
  },
  {
    id: "camp-005",
    name: "Factory Roofing B2B",
    platform: "Facebook",
    spend: 5500,
    leadsGenerated: 18,
    conversions: 4,
    startDate: "2024-02-01",
    endDate: "2024-03-31",
    status: "active",
  },
  {
    id: "camp-006",
    name: "Acrylic Signage IG",
    platform: "Instagram",
    spend: 900,
    leadsGenerated: 22,
    conversions: 7,
    startDate: "2024-03-10",
    endDate: "2024-03-25",
    status: "paused",
  },
];

export const teamMembers: TeamMember[] = [
  {
    id: "team-001",
    name: "Hafiz Azman",
    avatar: "HA",
    role: "Senior Sales Agent",
    leadsHandled: 48,
    avgResponseTime: "4m 12s",
    closeRate: 34,
    revenue: 87400,
    status: "online",
  },
  {
    id: "team-002",
    name: "Siti Rahayu",
    avatar: "SR",
    role: "Sales Agent",
    leadsHandled: 35,
    avgResponseTime: "6m 45s",
    closeRate: 28,
    revenue: 52100,
    status: "online",
  },
  {
    id: "team-003",
    name: "Amirul Asyraf",
    avatar: "AA",
    role: "Junior Sales Agent",
    leadsHandled: 22,
    avgResponseTime: "9m 30s",
    closeRate: 18,
    revenue: 28600,
    status: "busy",
  },
  {
    id: "team-004",
    name: "Priya Nadarajan",
    avatar: "PN",
    role: "Sales Agent",
    leadsHandled: 31,
    avgResponseTime: "5m 20s",
    closeRate: 30,
    revenue: 44300,
    status: "offline",
  },
];

export const leadsOverTime = [
  { date: "Jan 1", leads: 12, qualified: 4 },
  { date: "Jan 8", leads: 19, qualified: 7 },
  { date: "Jan 15", leads: 15, qualified: 5 },
  { date: "Jan 22", leads: 24, qualified: 10 },
  { date: "Jan 29", leads: 28, qualified: 12 },
  { date: "Feb 5", leads: 22, qualified: 9 },
  { date: "Feb 12", leads: 31, qualified: 14 },
  { date: "Feb 19", leads: 35, qualified: 16 },
  { date: "Feb 26", leads: 29, qualified: 13 },
  { date: "Mar 4", leads: 42, qualified: 18 },
  { date: "Mar 11", leads: 38, qualified: 17 },
  { date: "Mar 18", leads: 45, qualified: 21 },
];

export const leadsBySource = [
  { source: "Facebook", leads: 112 },
  { source: "Instagram", leads: 68 },
  { source: "TikTok", leads: 45 },
  { source: "Referral", leads: 23 },
  { source: "Website", leads: 18 },
  { source: "Walk-in", leads: 8 },
];

export const inquiryBreakdown = [
  { type: "Roofing", value: 38, color: "#6366f1" },
  { type: "Acrylic", value: 25, color: "#8b5cf6" },
  { type: "Waterproofing", value: 18, color: "#a78bfa" },
  { type: "Renovation", value: 12, color: "#c4b5fd" },
  { type: "Consultation", value: 7, color: "#ddd6fe" },
];
