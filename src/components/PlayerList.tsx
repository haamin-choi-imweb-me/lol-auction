'use client';

import { useMemo, useState } from 'react';
import { Player, TIER_ORDER } from '@/types';

interface PlayerListProps {
  players: Player[];
  onSelectPlayer?: (player: Player) => void;
  isSelectable?: boolean;
  selectedPlayerId?: string | null;
}

const ROLES = ['탑', '정글', '미드', '원딜', '서폿'] as const;

const ROLE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  '탑': { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  '정글': { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30' },
  '미드': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  '원딜': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  '서폿': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30' },
};

function getTierClass(tier: string): string {
  const baseTier = tier.replace(/[1-4]$/, '');
  const tierMap: Record<string, string> = {
    '챌린저': 'tier-challenger',
    '그랜드마스터': 'tier-grandmaster',
    '마스터': 'tier-master',
    '다이아': 'tier-diamond',
    '에메랄드': 'tier-emerald',
    '플레티넘': 'tier-platinum',
    '골드': 'tier-gold',
    '실버': 'tier-silver',
    '브론즈': 'tier-bronze',
    '아이언': 'tier-iron',
  };
  return tierMap[baseTier] || 'tier-iron';
}

// 선수 + 부라인 여부
interface PlayerWithRole {
  player: Player;
  isSub: boolean;
}

export default function PlayerList({
  players,
  onSelectPlayer,
  isSelectable = false,
  selectedPlayerId,
}: PlayerListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPlayers = useMemo(() => {
    if (!searchQuery.trim()) return players;
    const query = searchQuery.toLowerCase();
    return players.filter((player) =>
      player.name.toLowerCase().includes(query) ||
      player.tier.toLowerCase().includes(query)
    );
  }, [players, searchQuery]);

  // 주라인 + 부라인 모두 포함해서 그룹화
  const playersByRole = useMemo(() => {
    const grouped: Record<string, PlayerWithRole[]> = {
      '탑': [], '정글': [], '미드': [], '원딜': [], '서폿': [],
    };

    filteredPlayers.forEach((player) => {
      // 주라인에 추가
      if (grouped[player.mainRole]) {
        grouped[player.mainRole].push({ player, isSub: false });
      }
      // 부라인에도 추가 (있으면)
      if (player.subRole && grouped[player.subRole]) {
        grouped[player.subRole].push({ player, isSub: true });
      }
    });

    // 티어순 정렬 (주라인 우선, 그 다음 티어순)
    Object.keys(grouped).forEach((role) => {
      grouped[role].sort((a, b) => {
        // 주라인 우선
        if (a.isSub !== b.isSub) return a.isSub ? 1 : -1;
        // 티어순
        return TIER_ORDER[b.player.tier] - TIER_ORDER[a.player.tier];
      });
    });

    return grouped;
  }, [filteredPlayers]);

  // 라인별 통계 (주라인 기준)
  const roleStats = useMemo(() => {
    const stats = { 탑: 0, 정글: 0, 미드: 0, 원딜: 0, 서폿: 0 };
    players.forEach(p => {
      if (stats[p.mainRole as keyof typeof stats] !== undefined) {
        stats[p.mainRole as keyof typeof stats]++;
      }
    });
    return stats;
  }, [players]);

  // 티어별 통계
  const tierStats = useMemo(() => {
    const stats = { 챌린저: 0, 그랜드마스터: 0, 마스터: 0, 다이아: 0, 에메랄드: 0, 플레티넘: 0, 골드: 0, 실버: 0, 브론즈: 0, 아이언: 0 };
    players.forEach(p => {
      const baseTier = p.tier.replace(/[1-4]$/, '');
      if (stats[baseTier as keyof typeof stats] !== undefined) {
        stats[baseTier as keyof typeof stats]++;
      }
    });
    return stats;
  }, [players]);

  const totalCount = players.length;
  const filteredCount = filteredPlayers.length;

  return (
    <div style={{ background: 'rgba(26,26,36,0.8)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '8px', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>미배정 선수</h2>
        
        {/* 가운데 통계 */}
        <div style={{ display: 'flex', gap: '16px', fontSize: '10px' }}>
          {/* 라인별 */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <span style={{ color: '#ef4444' }}>탑:{roleStats.탑}</span>
            <span style={{ color: '#22c55e' }}>정글:{roleStats.정글}</span>
            <span style={{ color: '#3b82f6' }}>미드:{roleStats.미드}</span>
            <span style={{ color: '#f59e0b' }}>원딜:{roleStats.원딜}</span>
            <span style={{ color: '#a855f7' }}>서폿:{roleStats.서폿}</span>
          </div>
          <span style={{ color: 'var(--text-muted)' }}>|</span>
          {/* 티어별 */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {tierStats.챌린저 > 0 && <span style={{ color: '#f43f5e' }}>챌린저:{tierStats.챌린저}</span>}
            {tierStats.그랜드마스터 > 0 && <span style={{ color: '#dc2626' }}>그랜드마스터:{tierStats.그랜드마스터}</span>}
            {tierStats.마스터 > 0 && <span style={{ color: '#a855f7' }}>마스터:{tierStats.마스터}</span>}
            {tierStats.다이아 > 0 && <span style={{ color: '#22d3ee' }}>다이아:{tierStats.다이아}</span>}
            {tierStats.에메랄드 > 0 && <span style={{ color: '#10b981' }}>에메랄드:{tierStats.에메랄드}</span>}
            {tierStats.플레티넘 > 0 && <span style={{ color: '#06b6d4' }}>플레티넘:{tierStats.플레티넘}</span>}
            {tierStats.골드 > 0 && <span style={{ color: '#fbbf24' }}>골드:{tierStats.골드}</span>}
            {tierStats.실버 > 0 && <span style={{ color: '#9ca3af' }}>실버:{tierStats.실버}</span>}
            {tierStats.브론즈 > 0 && <span style={{ color: '#b45309' }}>브론즈:{tierStats.브론즈}</span>}
            {tierStats.아이언 > 0 && <span style={{ color: '#78716c' }}>아이언:{tierStats.아이언}</span>}
          </div>
        </div>

        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', padding: '2px 8px', background: 'var(--bg-secondary)', borderRadius: '9999px' }}>
          {searchQuery ? `${filteredCount}/${totalCount}` : `${totalCount}명`}
        </span>
      </div>

      <div style={{ position: 'relative', marginBottom: '6px' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="검색..."
          style={{ width: '100%', padding: '6px 10px 6px 28px', borderRadius: '6px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'white', fontSize: '12px' }}
        />
        <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '12px', height: '12px', color: 'var(--text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      {totalCount === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
          모든 선수가 배정되었습니다
        </div>
      ) : filteredCount === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
          검색 결과 없음
        </div>
      ) : (
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
          {ROLES.map((role) => {
            const rolePlayers = playersByRole[role];
            const roleColor = ROLE_COLORS[role];
            // 주라인 수만 카운트
            const mainCount = rolePlayers.filter(p => !p.isSub).length;
            const subCount = rolePlayers.filter(p => p.isSub).length;

            return (
              <div key={role} style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
                <div className={`${roleColor.bg} ${roleColor.border}`} style={{ padding: '4px 8px', borderRadius: '4px 4px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, borderBottom: '1px solid' }}>
                  <span className={roleColor.text} style={{ fontWeight: 'bold', fontSize: '12px' }}>{role}</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    {mainCount}{subCount > 0 && <span style={{ color: 'var(--accent-gold)' }}>+{subCount}</span>}
                  </span>
                </div>

                <div className={`${roleColor.bg} ${roleColor.border}`} style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '3px', borderRadius: '0 0 4px 4px', borderTop: 'none', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {rolePlayers.length === 0 ? (
                    <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', padding: '8px 0' }}>-</div>
                  ) : (
                    rolePlayers.map(({ player, isSub }) => (
                      <div
                        key={`${player.id}-${isSub ? 'sub' : 'main'}`}
                        onClick={() => isSelectable && onSelectPlayer?.(player)}
                        style={{
                          padding: '4px 6px',
                          borderRadius: '4px',
                          background: selectedPlayerId === player.id ? 'rgba(0,245,255,0.3)' : isSub ? 'rgba(255,215,0,0.1)' : 'rgba(18,18,26,0.8)',
                          border: selectedPlayerId === player.id ? '1px solid var(--accent-cyan)' : isSub ? '1px solid rgba(255,215,0,0.3)' : '1px solid transparent',
                          cursor: isSelectable ? 'pointer' : 'default',
                          flexShrink: 0,
                          opacity: isSub ? 0.85 : 1
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                          {isSub && (
                            <span style={{ fontSize: '8px', padding: '1px 3px', background: 'var(--accent-gold)', color: 'black', borderRadius: '2px', fontWeight: 'bold' }}>부</span>
                          )}
                          <p style={{ fontSize: '11px', fontWeight: 500, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }} title={player.name}>
                            {player.name}
                          </p>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className={getTierClass(player.tier)} style={{ fontSize: '10px' }}>{player.tier}</span>
                          <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                            {isSub ? `주:${player.mainRole}` : player.subRole ? `부:${player.subRole}` : ''}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
