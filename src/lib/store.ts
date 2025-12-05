'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Player,
  TeamLeader,
  Team,
  AuctionHistoryItem,
  TIER_ORDER,
} from '@/types';

// 초기 데이터 (JSON에서 가져옴)
import initialPlayers from './players';
import initialTeamLeaders from './teams';

const VERSION = 'v3';

// localStorage 키
export const STORAGE_KEYS = {
  PLAYERS: `lol-auction-players_${VERSION}`,
  TEAM_LEADERS: `lol-auction-team-leaders_${VERSION}`,
  AUCTION_STATE: `lol-auction-state_${VERSION}`,
};

// localStorage 헬퍼 함수들
function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

function removeFromStorage(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to remove from localStorage:', error);
  }
}

// 선수 데이터 로드 (localStorage 우선, 없으면 초기 데이터)
function loadPlayers(): Player[] {
  const stored = getFromStorage<Player[] | null>(STORAGE_KEYS.PLAYERS, null);
  if (stored && stored.length > 0) return stored;
  // 초기 데이터 저장하고 반환
  saveToStorage(STORAGE_KEYS.PLAYERS, initialPlayers);
  return initialPlayers as Player[];
}

// 팀장 데이터 로드
function loadTeamLeaders(): TeamLeader[] {
  const stored = getFromStorage<TeamLeader[] | null>(STORAGE_KEYS.TEAM_LEADERS, null);
  if (stored && stored.length > 0) return stored;
  saveToStorage(STORAGE_KEYS.TEAM_LEADERS, initialTeamLeaders);
  return initialTeamLeaders as TeamLeader[];
}

// 선수 저장
function savePlayers(players: Player[]): void {
  saveToStorage(STORAGE_KEYS.PLAYERS, players);
}

// 팀장 저장
function saveTeamLeaders(leaders: TeamLeader[]): void {
  saveToStorage(STORAGE_KEYS.TEAM_LEADERS, leaders);
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

// 경매 상태 저장
function saveAuctionState(state: SavedAuctionState): void {
  saveToStorage(STORAGE_KEYS.AUCTION_STATE, state);
}

// 경매 상태 로드
function loadAuctionState(): SavedAuctionState | null {
  return getFromStorage<SavedAuctionState | null>(STORAGE_KEYS.AUCTION_STATE, null);
}

// 경매 상태 삭제
function deleteAuctionState(): void {
  removeFromStorage(STORAGE_KEYS.AUCTION_STATE);
}

// 선수 추가
export function addPlayer(player: Omit<Player, 'id'>): Player {
  const players = loadPlayers();
  const newPlayer: Player = {
    ...player,
    id: `p${Date.now()}`,
  };
  savePlayers([...players, newPlayer]);
  return newPlayer;
}

// 선수 수정
export function updatePlayer(player: Player): Player {
  const players = loadPlayers();
  const updated = players.map((p) => (p.id === player.id ? player : p));
  savePlayers(updated);
  return player;
}

// 선수 삭제
export function deletePlayer(id: string): void {
  const players = loadPlayers();
  savePlayers(players.filter((p) => p.id !== id));
}

// 팀장 추가
export function addTeamLeader(team: Omit<TeamLeader, 'id'>): TeamLeader {
  const leaders = loadTeamLeaders();
  const newLeader: TeamLeader = {
    ...team,
    id: `t${Date.now()}`,
  };
  saveTeamLeaders([...leaders, newLeader]);
  return newLeader;
}

// 팀장 수정
export function updateTeamLeader(team: TeamLeader): TeamLeader {
  const leaders = loadTeamLeaders();
  const updated = leaders.map((t) => (t.id === team.id ? team : t));
  saveTeamLeaders(updated);
  return team;
}

// 팀장 삭제
export function deleteTeamLeader(id: string): void {
  const leaders = loadTeamLeaders();
  saveTeamLeaders(leaders.filter((t) => t.id !== id));
}

// 경매 상태 타입
export type AuctionStatus = 'idle' | 'in_progress';

// 현재 라운드 정보
export interface CurrentRound {
  startingPrice: number;
  currentPrice: number;
  priceDecrement: number;
  bidOrder: Team[];
  currentBidderIndex: number;
  passedInCycle: string[];
}

// 전체 경매 시스템 상태
export interface AuctionState {
  status: AuctionStatus;
  players: Player[];
  availablePlayers: Player[];
  teams: Team[];
  currentRound: CurrentRound | null;
  selectedPlayer: Player | null;
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
// 정렬 기준: 점수 높은 순 → 멤버 적은 순 → 티어 낮은 순
function getEligibleTeamsSorted(teams: Team[]): Team[] {
  return [...teams]
    .filter((t) => t.members.length < 4)
    .sort((a, b) => {
      // 1. 점수 높은 순
      if (b.leader.currentPoints !== a.leader.currentPoints) {
        return b.leader.currentPoints - a.leader.currentPoints;
      }
      
      // 2. 멤버 적은 순
      if (a.members.length !== b.members.length) {
        return a.members.length - b.members.length;
      }
      
      // 3. 티어 낮은 순 (티어가 없으면 가장 낮은 것으로 간주)
      const tierA = a.leader.tier || '아이언4';
      const tierB = b.leader.tier || '아이언4';
      return TIER_ORDER[tierA] - TIER_ORDER[tierB];
    });
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
  const [history, setHistory] = useState<AuctionState[]>([]); // Undo를 위한 히스토리

  // 초기 데이터 로드
  const loadData = useCallback(() => {
    setIsLoading(true);
    try {
      const players = loadPlayers();
      const teamLeaders = loadTeamLeaders();
      const savedState = loadAuctionState();

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
              members: savedTeam.members
                .map((m) => {
                  const player = players.find((p) => p.id === m.playerId);
                  return player
                    ? {
                        player,
                        price: m.price,
                        pickOrder: m.pickOrder,
                      }
                    : null;
                })
                .filter((m): m is NonNullable<typeof m> => m !== null),
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
  const startRound = useCallback((priceDecrement: number = 20) => {
    setState((prev) => {
      const eligibleTeams = getEligibleTeamsSorted(prev.teams);
      if (eligibleTeams.length === 0) return prev;

      // 이전 상태를 히스토리에 저장
      setHistory((h) => [...h, JSON.parse(JSON.stringify(prev))]);

      // 시작가 = 가장 낮은 점수의 팀장
      const startingPrice = Math.min(...eligibleTeams.map(t => t.leader.currentPoints));

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

      // 이전 상태를 히스토리에 저장
      setHistory((h) => [...h, JSON.parse(JSON.stringify(prev))]);

      const { currentPrice, bidOrder, currentBidderIndex, priceDecrement } = prev.currentRound;
      const currentTeam = bidOrder[currentBidderIndex];
      const player = prev.selectedPlayer;

      const teamIndex = prev.teams.findIndex(
        (t) => t.leader.id === currentTeam.leader.id
      );
      if (teamIndex === -1) return prev;

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

      const historyItem: AuctionHistoryItem = {
        player,
        winner: team.leader,
        price: currentPrice,
        timestamp: new Date(),
      };

      const newAvailablePlayers = prev.availablePlayers.filter(
        (p) => p.id !== player.id
      );

      // localStorage에 상태 저장
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

      // 낙찰 후 새 라운드를 낙찰 가격으로 시작
      const newEligibleTeams = getEligibleTeamsSorted(updatedTeams);
      
      // 다음 라운드 가능 여부 확인
      if (newEligibleTeams.length === 0 || newAvailablePlayers.length === 0) {
        // 더 이상 라운드를 진행할 수 없음
        return {
          ...prev,
          status: 'idle',
          teams: updatedTeams,
          availablePlayers: newAvailablePlayers,
          currentRound: null,
          selectedPlayer: null,
          auctionHistory: [...prev.auctionHistory, historyItem],
        };
      }

      // 새 라운드 시작 (낙찰 가격으로)
      return {
        ...prev,
        status: 'in_progress',
        teams: updatedTeams,
        availablePlayers: newAvailablePlayers,
        currentRound: {
          startingPrice: currentPrice,
          currentPrice: currentPrice,
          priceDecrement,
          bidOrder: newEligibleTeams,
          currentBidderIndex: 0,
          passedInCycle: [],
        },
        selectedPlayer: null,
        auctionHistory: [...prev.auctionHistory, historyItem],
      };
    });
  }, []);

  // 패스
  const pass = useCallback(() => {
    setState((prev) => {
      if (!prev.currentRound) return prev;

      // 이전 상태를 히스토리에 저장
      setHistory((h) => [...h, JSON.parse(JSON.stringify(prev))]);

      const {
        bidOrder,
        currentBidderIndex,
        passedInCycle,
        currentPrice,
        priceDecrement,
      } = prev.currentRound;
      const currentBidder = bidOrder[currentBidderIndex];

      let newPassedInCycle = [...passedInCycle, currentBidder.leader.id];

      let nextBidderIndex = -1;
      for (let i = currentBidderIndex + 1; i < bidOrder.length; i++) {
        const team = bidOrder[i];
        if (
          !newPassedInCycle.includes(team.leader.id) &&
          team.leader.currentPoints >= currentPrice
        ) {
          nextBidderIndex = i;
          break;
        } else if (!newPassedInCycle.includes(team.leader.id)) {
          newPassedInCycle = [...newPassedInCycle, team.leader.id];
        }
      }

      if (nextBidderIndex === -1) {
        const newPrice = currentPrice - priceDecrement;

        if (newPrice <= 0) {
          return {
            ...prev,
            status: 'idle',
            currentRound: null,
            selectedPlayer: null,
          };
        }

        let firstEligibleIndex = 0;
        const newCyclePassed: string[] = [];
        for (let i = 0; i < bidOrder.length; i++) {
          const team = bidOrder[i];
          if (team.leader.currentPoints >= newPrice) {
            firstEligibleIndex = i;
            break;
          } else {
            newCyclePassed.push(team.leader.id);
          }
        }

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

  // 이전 상태로 되돌리기 (Undo)
  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const previousState = h[h.length - 1];
      
      // 상태 복원
      setState(previousState);
      
      // localStorage에도 복원
      const savedState: SavedAuctionState = {
        teams: previousState.teams.map((t: Team) => ({
          leaderId: t.leader.id,
          currentPoints: t.leader.currentPoints,
          members: t.members.map((m) => ({
            playerId: m.player.id,
            price: m.price,
            pickOrder: m.pickOrder,
          })),
          totalSpent: t.totalSpent,
        })),
        assignedPlayerIds: previousState.players
          .filter((p: Player) => !previousState.availablePlayers.find((ap: Player) => ap.id === p.id))
          .map((p: Player) => p.id),
      };
      saveAuctionState(savedState);
      
      return h.slice(0, -1); // 마지막 히스토리 제거
    });
  }, []);

  // 지명 취소 (멤버 제거)
  const removeMember = useCallback((teamId: string, playerId: string) => {
    setState((prev) => {
      const teamIndex = prev.teams.findIndex((t) => t.leader.id === teamId);
      if (teamIndex === -1) return prev;

      const team = prev.teams[teamIndex];
      const memberIndex = team.members.findIndex((m) => m.player.id === playerId);
      if (memberIndex === -1) return prev;

      const member = team.members[memberIndex];
      const removedPlayer = member.player;
      const refundPrice = member.price;

      // 팀 업데이트 (멤버 제거, 점수 복구)
      const updatedTeam: Team = {
        ...team,
        leader: {
          ...team.leader,
          currentPoints: team.leader.currentPoints + refundPrice,
        },
        members: team.members.filter((m) => m.player.id !== playerId),
        totalSpent: team.totalSpent - refundPrice,
      };

      const updatedTeams = [...prev.teams];
      updatedTeams[teamIndex] = updatedTeam;

      // 선수를 다시 미배정으로
      const newAvailablePlayers = [...prev.availablePlayers, removedPlayer];

      // localStorage에 상태 저장
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
        teams: updatedTeams,
        availablePlayers: newAvailablePlayers,
      };
    });
  }, []);

  // 전체 리셋
  const resetAuction = useCallback(() => {
    deleteAuctionState();
    loadData();
  }, [loadData]);

  // 선수 정렬 (티어순)
  const sortPlayersByTier = useCallback((players: Player[]): Player[] => {
    return [...players].sort((a, b) => {
      return TIER_ORDER[b.tier] - TIER_ORDER[a.tier];
    });
  }, []);

  // 팀 정렬 (보유 점수순)
  const sortTeamsByPoints = useCallback((teams: Team[]): Team[] => {
    return [...teams].sort(
      (a, b) => b.leader.currentPoints - a.leader.currentPoints
    );
  }, []);

  // 데이터 새로고침
  const refreshData = useCallback(() => {
    loadData();
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
    undo,
    removeMember,
    resetAuction,
    sortPlayersByTier,
    sortTeamsByPoints,
    refreshData,
  };
}

export type AuctionStore = ReturnType<typeof useAuctionStore>;
