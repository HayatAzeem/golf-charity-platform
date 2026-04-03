export type UserRole = 'subscriber' | 'admin';

export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'lapsed';
export type SubscriptionPlan = 'monthly' | 'yearly';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  subscription_status: SubscriptionStatus;
  subscription_plan?: SubscriptionPlan;
  subscription_end_date?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  selected_charity_id?: string;
  charity_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface GolfScore {
  id: string;
  user_id: string;
  score: number;
  played_at: string;
  created_at: string;
}

export interface Charity {
  id: string;
  name: string;
  description: string;
  long_description?: string;
  image_url?: string;
  website?: string;
  total_raised: number;
  is_featured: boolean;
  is_active: boolean;
  upcoming_events?: CharityEvent[];
  created_at: string;
}

export interface CharityEvent {
  id: string;
  charity_id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
}

export type DrawStatus = 'scheduled' | 'simulating' | 'published' | 'completed';
export type DrawLogic = 'random' | 'algorithmic';

export interface Draw {
  id: string;
  title: string;
  draw_date: string;
  status: DrawStatus;
  logic_type: DrawLogic;
  winning_numbers?: number[];
  prize_pool_5: number;
  prize_pool_4: number;
  prize_pool_3: number;
  jackpot_carried_over: number;
  total_pool: number;
  created_at: string;
  published_at?: string;
}

export type WinnerStatus = 'pending' | 'verified' | 'rejected' | 'paid';
export type MatchType = '5-match' | '4-match' | '3-match';

export interface Winner {
  id: string;
  draw_id: string;
  user_id: string;
  match_type: MatchType;
  matched_numbers: number[];
  prize_amount: number;
  status: WinnerStatus;
  proof_url?: string;
  created_at: string;
  user?: Profile;
  draw?: Draw;
}

export interface DrawEntry {
  id: string;
  draw_id: string;
  user_id: string;
  score_snapshot: number[];
  created_at: string;
}

export interface SubscriptionPricing {
  monthly: {
    price: number;
    prizePool: number;
    charityContribution: number;
  };
  yearly: {
    price: number;
    prizePool: number;
    charityContribution: number;
    savings: number;
  };
}

export const PRICING: SubscriptionPricing = {
  monthly: {
    price: 1999, // in pence/cents
    prizePool: 1400,
    charityContribution: 200,
  },
  yearly: {
    price: 19990,
    prizePool: 14000,
    charityContribution: 2000,
    savings: 3998,
  },
};

export const PRIZE_POOL_DISTRIBUTION = {
  '5-match': 0.40,
  '4-match': 0.35,
  '3-match': 0.25,
};
