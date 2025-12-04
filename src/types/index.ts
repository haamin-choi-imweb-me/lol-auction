// 라인 포지션 타입
export type Role = '탑' | '정글' | '미드' | '원딜' | '서폿' | '';

// 티어 타입
export type Tier = 
  | '챌린저' 
  | '그랜드마스터' 
  | '마스터' 
  | '다이아1' | '다이아2' | '다이아3' | '다이아4'
  | '에메랄드1' | '에메랄드2' | '에메랄드3' | '에메랄드4'
  | '플레티넘1' | '플레티넘2' | '플레티넘3' | '플레티넘4'
  | '골드1' | '골드2' | '골드3' | '골드4'
  | '실버1' | '실버2' | '실버3' | '실버4'
  | '브론즈1' | '브론즈2' | '브론즈3' | '브론즈4'
  | '아이언1' | '아이언2' | '아이언3' | '아이언4';

// 참가자 (선수) 타입
export interface Player {
  id: string;
  name: string;
  tier: Tier;
  mainRole: Role;
  subRole: Role;
}

// 팀장 타입
export interface TeamLeader {
  id: string;
  name: string;
  initialPoints: number;
  currentPoints: number;
}

// 팀 구성원 (낙찰된 선수)
export interface TeamMember {
  player: Player;
  price: number;
  pickOrder: number; // 1픽, 2픽, 3픽, 4픽
}

// 팀 전체 정보
export interface Team {
  leader: TeamLeader;
  members: TeamMember[];
  totalSpent: number;
}

// 경매 상태
export type AuctionStatus = 'idle' | 'in_progress' | 'completed';

// 현재 경매 진행 정보
export interface CurrentAuction {
  player: Player | null;
  startingPrice: number;
  currentPrice: number;
  currentBidderIndex: number; // 현재 콜 순서의 팀장 인덱스
  bidOrder: TeamLeader[]; // 입찰 순서 (보유 점수 높은 순)
  passedLeaders: string[]; // 패스한 팀장 ID 목록
}

// 전체 경매 시스템 상태
export interface AuctionState {
  status: AuctionStatus;
  players: Player[];
  availablePlayers: Player[]; // 아직 배정되지 않은 선수들
  teams: Team[];
  currentAuction: CurrentAuction | null;
  auctionHistory: AuctionHistoryItem[];
}

// 경매 히스토리 아이템
export interface AuctionHistoryItem {
  player: Player;
  winner: TeamLeader;
  price: number;
  timestamp: Date;
}

// 티어 순위 (높을수록 좋음)
export const TIER_ORDER: Record<Tier, number> = {
  '챌린저': 100,
  '그랜드마스터': 95,
  '마스터': 90,
  '다이아1': 85,
  '다이아2': 84,
  '다이아3': 83,
  '다이아4': 82,
  '에메랄드1': 75,
  '에메랄드2': 74,
  '에메랄드3': 73,
  '에메랄드4': 72,
  '플레티넘1': 65,
  '플레티넘2': 64,
  '플레티넘3': 63,
  '플레티넘4': 62,
  '골드1': 55,
  '골드2': 54,
  '골드3': 53,
  '골드4': 52,
  '실버1': 45,
  '실버2': 44,
  '실버3': 43,
  '실버4': 42,
  '브론즈1': 35,
  '브론즈2': 34,
  '브론즈3': 33,
  '브론즈4': 32,
  '아이언1': 25,
  '아이언2': 24,
  '아이언3': 23,
  '아이언4': 22,
};

// 라인 색상
export const ROLE_COLORS: Record<Role, string> = {
  '탑': '#ef4444',
  '정글': '#22c55e',
  '미드': '#3b82f6',
  '원딜': '#f59e0b',
  '서폿': '#a855f7',
  '': '#6b7280',
};

// 티어 색상
export const TIER_COLORS: Record<string, string> = {
  '챌린저': '#f43f5e',
  '그랜드마스터': '#dc2626',
  '마스터': '#a855f7',
  '다이아': '#22d3ee',
  '에메랄드': '#10b981',
  '플레티넘': '#06b6d4',
  '골드': '#fbbf24',
  '실버': '#9ca3af',
  '브론즈': '#b45309',
  '아이언': '#78716c',
};

export function getTierColor(tier: Tier): string {
  const baseTier = tier.replace(/[1-4]$/, '');
  return TIER_COLORS[baseTier] || TIER_COLORS['아이언'];
}

