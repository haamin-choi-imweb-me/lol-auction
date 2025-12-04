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
import initialPlayers from '../../data/players.json';
import initialTeamLeaders from '../../data/teams.json';

// localStorage 키
const STORAGE_KEYS = {
  PLAYERS: 'lol-auction-players',
  TEAM_LEADERS: 'lol-auction-team-leaders',
  AUCTION_STATE: 'lol-auction-state',
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
function getEligibleTeamsSorted(teams: Team[]): Team[] {
  return [...teams]
    .filter((t) => t.members.length < 4)
    .sort((a, b) => b.leader.currentPoints - a.leader.currentPoints);
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
    resetAuction,
    sortPlayersByTier,
    sortTeamsByPoints,
    refreshData,
  };
}

export type AuctionStore = ReturnType<typeof useAuctionStore>;
