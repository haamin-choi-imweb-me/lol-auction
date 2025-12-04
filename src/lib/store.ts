'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Player,
  TeamLeader,
  Team,
  AuctionHistoryItem,
  TIER_ORDER,
} from '@/types';

// API 호출 함수들
async function fetchPlayers(): Promise<Player[]> {
  const res = await fetch('/api/players');
  return res.json();
}

async function fetchTeamLeaders(): Promise<TeamLeader[]> {
  const res = await fetch('/api/teams');
  return res.json();
}

async function fetchAuctionState(): Promise<SavedAuctionState | null> {
  const res = await fetch('/api/auction-state');
  return res.json();
}

async function saveAuctionState(state: SavedAuctionState): Promise<void> {
  await fetch('/api/auction-state', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state),
  });
}

async function deleteAuctionState(): Promise<void> {
  await fetch('/api/auction-state', { method: 'DELETE' });
}

// API로 선수 추가
export async function addPlayer(player: Omit<Player, 'id'>): Promise<Player> {
  const res = await fetch('/api/players', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(player),
  });
  return res.json();
}

// API로 선수 수정
export async function updatePlayer(player: Player): Promise<Player> {
  const res = await fetch('/api/players', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(player),
  });
  return res.json();
}

// API로 선수 삭제
export async function deletePlayer(id: string): Promise<void> {
  await fetch(`/api/players?id=${id}`, { method: 'DELETE' });
}

// API로 팀장 추가
export async function addTeamLeader(team: Omit<TeamLeader, 'id'>): Promise<TeamLeader> {
  const res = await fetch('/api/teams', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(team),
  });
  return res.json();
}

// API로 팀장 수정
export async function updateTeamLeader(team: TeamLeader): Promise<TeamLeader> {
  const res = await fetch('/api/teams', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(team),
  });
  return res.json();
}

// API로 팀장 삭제
export async function deleteTeamLeader(id: string): Promise<void> {
  await fetch(`/api/teams?id=${id}`, { method: 'DELETE' });
}

interface SavedAuctionState {
  teams: {
    leaderId: string;
    currentPoints: number;
    members: {
      playerId: string;
      price: number;
      pickOrder: number;
    }[];
    totalSpent: number;
  }[];
  assignedPlayerIds: string[];
}

// 경매 상태 타입
export type AuctionStatus = 'idle' | 'in_progress';

// 현재 라운드 정보
export interface CurrentRound {
  startingPrice: number;        // 시작가 (2등 팀장 점수)
  currentPrice: number;         // 현재가 (패스하면서 내려감)
  priceDecrement: number;       // 한 싸이클 돌면 내릴 금액
  bidOrder: Team[];             // 입찰 순서 (보유 점수 높은 순)
  currentBidderIndex: number;   // 현재 차례 인덱스
  passedInCycle: string[];      // 이번 싸이클에서 패스한 팀장 ID
}

// 전체 경매 시스템 상태
export interface AuctionState {
  status: AuctionStatus;
  players: Player[];
  availablePlayers: Player[];
  teams: Team[];
  currentRound: CurrentRound | null;
  selectedPlayer: Player | null;  // 현재 지명 대상 선수
  auctionHistory: AuctionHistoryItem[];
}

// 초기 팀 생성
function createInitialTeams(leaders: TeamLeader[]): Team[] {
  return leaders.map((leader) => ({
    leader,
    members: [],
    totalSpent: 0,
  }));
}

// 보유 점수 높은 순으로 정렬된 팀 (4명 미만인 팀만)
function getEligibleTeamsSorted(teams: Team[]): Team[] {
  return [...teams]
    .filter((t) => t.members.length < 4)
    .sort((a, b) => b.leader.currentPoints - a.leader.currentPoints);
}

// 시작가 계산: 2등 팀장 점수
function calculateStartingPrice(teams: Team[]): number {
  const sorted = getEligibleTeamsSorted(teams);
  return sorted[1]?.leader.currentPoints || sorted[0]?.leader.currentPoints || 0;
}

// 초기 상태
function getInitialState(): AuctionState {
  return {
    status: 'idle',
    players: [],
    availablePlayers: [],
    teams: [],
    currentRound: null,
    selectedPlayer: null,
    auctionHistory: [],
  };
}

export function useAuctionStore() {
  const [state, setState] = useState<AuctionState>(getInitialState);
  const [isLoading, setIsLoading] = useState(true);

  // 초기 데이터 로드
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [players, teamLeaders, savedState] = await Promise.all([
        fetchPlayers(),
        fetchTeamLeaders(),
        fetchAuctionState(),
      ]);

      let teams = createInitialTeams(teamLeaders);
      let availablePlayers = [...players];
      
      // 저장된 경매 상태가 있으면 복원
      if (savedState && savedState.teams) {
        teams = teams.map((team) => {
          const savedTeam = savedState.teams.find(
            (st) => st.leaderId === team.leader.id
          );
          if (savedTeam) {
            return {
              leader: {
                ...team.leader,
                currentPoints: savedTeam.currentPoints,
              },
              members: savedTeam.members.map((m) => {
                const player = players.find((p) => p.id === m.playerId);
                return {
                  player: player!,
                  price: m.price,
                  pickOrder: m.pickOrder,
                };
              }).filter((m) => m.player),
              totalSpent: savedTeam.totalSpent,
            };
          }
          return team;
        });
        
        availablePlayers = players.filter(
          (p) => !savedState.assignedPlayerIds.includes(p.id)
        );
      }

      setState({
        status: 'idle',
        players,
        availablePlayers,
        teams,
        currentRound: null,
        selectedPlayer: null,
        auctionHistory: [],
      });
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 라운드 시작
  const startRound = useCallback((priceDecrement: number = 100) => {
    setState((prev) => {
      const eligibleTeams = getEligibleTeamsSorted(prev.teams);
      if (eligibleTeams.length < 2) return prev;

      const startingPrice = eligibleTeams[1].leader.currentPoints;

      return {
        ...prev,
        status: 'in_progress',
        currentRound: {
          startingPrice,
          currentPrice: startingPrice,
          priceDecrement,
          bidOrder: eligibleTeams,
          currentBidderIndex: 0,
          passedInCycle: [],
        },
        selectedPlayer: null,
      };
    });
  }, []);

  // 감소 금액 설정
  const setPriceDecrement = useCallback((decrement: number) => {
    setState((prev) => {
      if (!prev.currentRound) return prev;
      return {
        ...prev,
        currentRound: {
          ...prev.currentRound,
          priceDecrement: decrement,
        },
      };
    });
  }, []);

  // 선수 선택 (지명 대상)
  const selectPlayer = useCallback((player: Player | null) => {
    setState((prev) => ({
      ...prev,
      selectedPlayer: player,
    }));
  }, []);

  // 지명 (현재 팀장이 선택된 선수를 현재가에 구매)
  const pickPlayer = useCallback(() => {
    setState((prev) => {
      if (!prev.currentRound || !prev.selectedPlayer) return prev;

      const { currentPrice, bidOrder, currentBidderIndex } = prev.currentRound;
      const currentTeam = bidOrder[currentBidderIndex];
      const player = prev.selectedPlayer;

      // 팀 인덱스 찾기
      const teamIndex = prev.teams.findIndex((t) => t.leader.id === currentTeam.leader.id);
      if (teamIndex === -1) return prev;

      // 팀 업데이트
      const team = prev.teams[teamIndex];
      const newMember = {
        player,
        price: currentPrice,
        pickOrder: team.members.length + 1,
      };

      const updatedTeam: Team = {
        ...team,
        leader: {
          ...team.leader,
          currentPoints: team.leader.currentPoints - currentPrice,
        },
        members: [...team.members, newMember],
        totalSpent: team.totalSpent + currentPrice,
      };

      const updatedTeams = [...prev.teams];
      updatedTeams[teamIndex] = updatedTeam;

      // 히스토리 추가
      const historyItem: AuctionHistoryItem = {
        player,
        winner: team.leader,
        price: currentPrice,
        timestamp: new Date(),
      };

      // 새로운 미배정 선수 목록
      const newAvailablePlayers = prev.availablePlayers.filter((p) => p.id !== player.id);

      // 상태 저장
      const savedState: SavedAuctionState = {
        teams: updatedTeams.map((t) => ({
          leaderId: t.leader.id,
          currentPoints: t.leader.currentPoints,
          members: t.members.map((m) => ({
            playerId: m.player.id,
            price: m.price,
            pickOrder: m.pickOrder,
          })),
          totalSpent: t.totalSpent,
        })),
        assignedPlayerIds: prev.players
          .filter((p) => !newAvailablePlayers.find((ap) => ap.id === p.id))
          .map((p) => p.id),
      };
      saveAuctionState(savedState);

      return {
        ...prev,
        status: 'idle',
        teams: updatedTeams,
        availablePlayers: newAvailablePlayers,
        currentRound: null,
        selectedPlayer: null,
        auctionHistory: [...prev.auctionHistory, historyItem],
      };
    });
  }, []);

  // 패스
  const pass = useCallback(() => {
    setState((prev) => {
      if (!prev.currentRound) return prev;

      const { bidOrder, currentBidderIndex, passedInCycle, currentPrice, priceDecrement } = prev.currentRound;
      const currentBidder = bidOrder[currentBidderIndex];

      // 현재 팀장을 패스 목록에 추가
      let newPassedInCycle = [...passedInCycle, currentBidder.leader.id];

      // 다음 입찰 가능한 팀장 찾기 (패스 안 했고, 현재가 이상의 점수 보유)
      let nextBidderIndex = -1;
      for (let i = currentBidderIndex + 1; i < bidOrder.length; i++) {
        const team = bidOrder[i];
        if (!newPassedInCycle.includes(team.leader.id) && team.leader.currentPoints >= currentPrice) {
          nextBidderIndex = i;
          break;
        } else if (!newPassedInCycle.includes(team.leader.id)) {
          // 점수 부족한 팀장은 자동 패스 처리
          newPassedInCycle = [...newPassedInCycle, team.leader.id];
        }
      }

      // 다음 입찰자가 없으면 (모두 패스했거나 점수 부족)
      if (nextBidderIndex === -1) {
        // 가격 내리기
        const newPrice = currentPrice - priceDecrement;
        
        // 가격이 0 이하면 라운드 종료
        if (newPrice <= 0) {
          return {
            ...prev,
            status: 'idle',
            currentRound: null,
            selectedPlayer: null,
          };
        }

        // 새 싸이클: 가격 내리고 첫 번째 입찰 가능한 팀장 찾기
        let firstEligibleIndex = 0;
        const newCyclePassed: string[] = [];
        for (let i = 0; i < bidOrder.length; i++) {
          const team = bidOrder[i];
          if (team.leader.currentPoints >= newPrice) {
            firstEligibleIndex = i;
            break;
          } else {
            // 점수 부족한 팀장은 자동 패스
            newCyclePassed.push(team.leader.id);
          }
        }

        // 새 가격으로도 아무도 못 사면 라운드 종료
        if (newCyclePassed.length >= bidOrder.length) {
          return {
            ...prev,
            status: 'idle',
            currentRound: null,
            selectedPlayer: null,
          };
        }

        return {
          ...prev,
          currentRound: {
            ...prev.currentRound,
            currentPrice: newPrice,
            currentBidderIndex: firstEligibleIndex,
            passedInCycle: newCyclePassed,
          },
          selectedPlayer: null,
        };
      }

      // 다음 팀장으로
      return {
        ...prev,
        currentRound: {
          ...prev.currentRound,
          currentBidderIndex: nextBidderIndex,
          passedInCycle: newPassedInCycle,
        },
        selectedPlayer: null,
      };
    });
  }, []);

  // 라운드 취소
  const cancelRound = useCallback(() => {
    setState((prev) => ({
      ...prev,
      status: 'idle',
      currentRound: null,
      selectedPlayer: null,
    }));
  }, []);

  // 전체 리셋
  const resetAuction = useCallback(async () => {
    await deleteAuctionState();
    await loadData();
  }, [loadData]);

  // 선수 정렬 (티어순)
  const sortPlayersByTier = useCallback((players: Player[]): Player[] => {
    return [...players].sort((a, b) => {
      return TIER_ORDER[b.tier] - TIER_ORDER[a.tier];
    });
  }, []);

  // 팀 정렬 (보유 점수순)
  const sortTeamsByPoints = useCallback((teams: Team[]): Team[] => {
    return [...teams].sort((a, b) => b.leader.currentPoints - a.leader.currentPoints);
  }, []);

  // 데이터 새로고침
  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  return {
    state,
    isLoading,
    startRound,
    setPriceDecrement,
    selectPlayer,
    pickPlayer,
    pass,
    cancelRound,
    resetAuction,
    sortPlayersByTier,
    sortTeamsByPoints,
    refreshData,
  };
}

export type AuctionStore = ReturnType<typeof useAuctionStore>;
