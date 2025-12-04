'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useAuctionStore } from '@/lib/store';
import PlayerList from '@/components/PlayerList';
import AuctionPanel from '@/components/AuctionPanel';
import LeaderBoard from '@/components/LeaderBoard';
import TeamCard from '@/components/TeamCard';

export default function Home() {
  const {
    state,
    isLoading,
    startRound,
    setPriceDecrement,
    selectPlayer,
    pickPlayer,
    pass,
    cancelRound,
    sortPlayersByTier,
    sortTeamsByPoints,
    refreshData,
  } = useAuctionStore();

  const sortedAvailablePlayers = useMemo(
    () => sortPlayersByTier(state.availablePlayers),
    [state.availablePlayers, sortPlayersByTier]
  );

  const sortedTeams = useMemo(
    () => sortTeamsByPoints(state.teams),
    [state.teams, sortTeamsByPoints]
  );

  // 라인별 통계
  const roleStats = useMemo(() => {
    const stats = { 탑: 0, 정글: 0, 미드: 0, 원딜: 0, 서폿: 0 };
    state.availablePlayers.forEach(p => {
      if (stats[p.mainRole as keyof typeof stats] !== undefined) {
        stats[p.mainRole as keyof typeof stats]++;
      }
    });
    return stats;
  }, [state.availablePlayers]);

  // 티어별 통계
  const tierStats = useMemo(() => {
    const stats = { 챌린저: 0, 그랜드마스터: 0, 마스터: 0, 다이아: 0, 에메랄드: 0, 플레티넘: 0, 골드: 0, 실버: 0, 브론즈: 0, 아이언: 0 };
    state.availablePlayers.forEach(p => {
      const baseTier = p.tier.replace(/[1-4]$/, '');
      if (stats[baseTier as keyof typeof stats] !== undefined) {
        stats[baseTier as keyof typeof stats]++;
      }
    });
    return stats;
  }, [state.availablePlayers]);

  const currentBidderId = state.currentRound?.bidOrder[state.currentRound.currentBidderIndex]?.leader.id;

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[var(--accent-cyan)] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', padding: '8px', gap: '8px', overflow: 'hidden' }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        {/* 라인별 통계 */}
        <div style={{ display: 'flex', gap: '6px', fontSize: '10px', color: 'var(--text-muted)' }}>
          <span style={{ color: '#ef4444' }}>탑:{roleStats.탑}</span>
          <span style={{ color: '#22c55e' }}>정글:{roleStats.정글}</span>
          <span style={{ color: '#3b82f6' }}>미드:{roleStats.미드}</span>
          <span style={{ color: '#f59e0b' }}>원딜:{roleStats.원딜}</span>
          <span style={{ color: '#a855f7' }}>서폿:{roleStats.서폿}</span>
        </div>

        <div style={{ textAlign: 'center' }}>
          <h1 className="text-2xl font-black bg-gradient-to-r from-[var(--accent-cyan)] via-[var(--accent-magenta)] to-[var(--accent-gold)] bg-clip-text text-transparent">
            LoL 경매 시스템
          </h1>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', fontSize: '12px' }}>
            <span className="px-2 py-0.5 rounded-full bg-[var(--bg-card)]">전체: {state.players.length}</span>
            <span className="px-2 py-0.5 rounded-full bg-[var(--bg-card)]">미배정: {state.availablePlayers.length}</span>
          </div>
        </div>

        {/* 티어별 통계 + 버튼 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '4px', fontSize: '10px', color: 'var(--text-muted)' }}>
            {tierStats.챌린저 > 0 && <span style={{ color: '#f43f5e' }}>챌:{tierStats.챌린저}</span>}
            {tierStats.그랜드마스터 > 0 && <span style={{ color: '#dc2626' }}>그마:{tierStats.그랜드마스터}</span>}
            {tierStats.마스터 > 0 && <span style={{ color: '#a855f7' }}>마:{tierStats.마스터}</span>}
            {tierStats.다이아 > 0 && <span style={{ color: '#22d3ee' }}>다:{tierStats.다이아}</span>}
            {tierStats.에메랄드 > 0 && <span style={{ color: '#10b981' }}>에:{tierStats.에메랄드}</span>}
            {tierStats.플레티넘 > 0 && <span style={{ color: '#06b6d4' }}>플:{tierStats.플레티넘}</span>}
            {tierStats.골드 > 0 && <span style={{ color: '#fbbf24' }}>골:{tierStats.골드}</span>}
            {tierStats.실버 > 0 && <span style={{ color: '#9ca3af' }}>실:{tierStats.실버}</span>}
            {tierStats.브론즈 > 0 && <span style={{ color: '#b45309' }}>브:{tierStats.브론즈}</span>}
            {tierStats.아이언 > 0 && <span style={{ color: '#78716c' }}>아:{tierStats.아이언}</span>}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={refreshData} className="p-2 rounded-lg bg-[var(--bg-card)] text-[var(--text-secondary)]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <Link href="/admin" className="p-2 rounded-lg bg-[var(--accent-gold)]/20 text-[var(--accent-gold)] text-sm font-medium">
              관리자
            </Link>
          </div>
        </div>
      </header>

      {/* Player list */}
      <div style={{ height: '300px', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
        <PlayerList
          players={sortedAvailablePlayers}
          onSelectPlayer={selectPlayer}
          isSelectable={state.status === 'in_progress'}
          selectedPlayerId={state.selectedPlayer?.id}
        />
      </div>

      {/* Auction + Leaderboard - 고정 260px */}
      <div style={{ height: '300px', flexShrink: 0, display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <AuctionPanel
            currentRound={state.currentRound}
            selectedPlayer={state.selectedPlayer}
            teams={state.teams}
            onStartRound={startRound}
            onPick={pickPlayer}
            onPass={pass}
            onCancel={cancelRound}
            onSetDecrement={setPriceDecrement}
          />
        </div>
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <LeaderBoard teams={sortedTeams} currentBidderId={currentBidderId} />
        </div>
      </div>

      {/* Team cards - 남은 공간 */}
      <div style={{ flex: 1, minHeight: '100px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px', flexShrink: 0 }}>팀 구성</h2>
        <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', overflowY: 'auto' }}>
          {state.teams.map((team, index) => (
            <TeamCard key={team.leader.id} team={team} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
