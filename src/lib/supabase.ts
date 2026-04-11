import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Type definitions ---

export type ArticleCategory = "KAMP" | "KLUB" | "UNGDOM";

export interface Article {
  id: string;
  slug: string;
  category: ArticleCategory;
  date: string;
  title: string;
  excerpt: string;
  content: string;
  image_url: string | null;
  latest: boolean;
  created_at: string;
}

export type PlayerPosition = "MÅLMÆND" | "FORSVAR" | "MIDTBANE" | "ANGREB";

export interface Player {
  id: string;
  number: string;
  name: string;
  position: PlayerPosition;
  image_url: string | null;
}

export interface Match {
  id: string;
  date: string;
  time: string | null;
  kickoff_at: string | null;
  status: MatchStatus;
  live_phase: LivePhase;
  live_minute: number | null;
  live_clock_running: boolean;
  live_clock_started_at: string | null;
  live_clock_accumulated_seconds: number;
  period_label: string | null;
  matchday_notes: string | null;
  home: string;
  home_team_id: string | null;
  away: string;
  away_team_id: string | null;
  venue: string | null;
  home_score: number | null;
  away_score: number | null;
  result: "win" | "draw" | "loss" | null;
  is_upcoming: boolean;
  gruppe: string; // 'regular' | 'oprykning' | 'nedrykning'
}

export type MatchStatus = "scheduled" | "live" | "finished";
export type LivePhase = "pre_match" | "first_half" | "halftime" | "second_half" | "fulltime";

export type MatchEventType =
  | "goal"
  | "yellow_card"
  | "red_card"
  | "substitution"
  | "kickoff"
  | "halftime"
  | "fulltime";

export type MatchEventTeamSide = "home" | "away";

export interface MatchEvent {
  id: string;
  match_id: string;
  team_side: MatchEventTeamSide;
  event_type: MatchEventType;
  minute: number | null;
  stoppage_minute: number | null;
  player_name: string | null;
  assist_name: string | null;
  note: string | null;
  created_at: string;
}

export type LineupPlayerSlot = {
  name: string;
  number?: string | null;
  position?: string | null;
  captain?: boolean;
  goalkeeper?: boolean;
};

export interface MatchLineup {
  id: string;
  match_id: string;
  team_side: MatchEventTeamSide;
  formation: string | null;
  starters: LineupPlayerSlot[];
  bench: LineupPlayerSlot[];
  confirmed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Standing {
  id: string;
  pos: number;
  team: string; // Sticking to matching by team name for now for backward compatibility in the DB
  team_id: string | null;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_scored: number;
  goals_conceded: number;
  pts: number;
  highlight: boolean;
  gruppe: string; // 'regular' | 'oprykning' | 'nedrykning'
}

export interface Team {
  id: string;
  name: string;
  abbreviation: string | null;
  logo_url: string | null;
  home_turf: string | null;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "new" | "handled";
  created_at: string;
}

export interface VolunteerSubmission {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "new" | "handled";
  created_at: string;
}

export interface NewsletterSubscription {
  id: string;
  email: string;
  created_at: string;
}

export interface MembershipSubmission {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  membership_tier: string;
  status: "new" | "handled";
  created_at: string;
}

export type SponsorTier = "guld" | "sølv" | "bronze";

export interface Sponsor {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  tier: SponsorTier;
  display_order: number;
  created_at: string;
}

export interface YouthTeam {
  id: string;
  age_group: string;
  coach: string | null;
  training_schedule: string | null;
  description: string | null;
  display_order: number;
  created_at: string;
  image_url: string | null;
  contact_email: string | null;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  image_url: string | null;
  bio: string | null;
  display_order: number;
  created_at: string;
}

export interface PlayerStats {
  id: string;
  player_id: string;
  season: string;
  goals: number;
  assists: number;
  appearances: number;
  yellow_cards: number;
  red_cards: number;
  created_at: string;
}

export interface MembershipTier {
  id: string;
  name: string;
  price: string;
  unit: string;
  description: string;
  perks: string[];
  featured: boolean;
  display_order: number;
  created_at: string;
}

export interface VolunteerRole {
  id: string;
  title: string;
  description: string;
  tasks: string[];
  display_order: number;
  created_at: string;
}

export interface SiteSetting {
  key: string;
  value: string;
  label: string | null;
  updated_at: string;
}
