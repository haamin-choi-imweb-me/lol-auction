'use client';

import { useState } from 'react';
import { Player, Team } from '@/types';
import { CurrentRound } from '@/lib/store';

interface AuctionPanelProps {
  currentRound: CurrentRound | null;
  selectedPlayer: Player | null;
  teams: Team[];
  onStartRound: (priceDecrement: number) => void;
  onPick: () => void;
  onPass: () => void;
  onCancel: () => void;
  onSetDecrement: (decrement: number) => void;
}

function getTierClass(tier: string): string {
  const baseTier = tier.replace(/[1-4]$/, '').toLowerCase();
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

function getRoleClass(role: string): string {
  const roleMap: Record<string, string> = {
    '탑': 'role-top',
    '정글': 'role-jungle',
    '미드': 'role-mid',
    '원딜': 'role-adc',
    '서폿': 'role-support',
  };
  return roleMap[role] || '';
}

export default function AuctionPanel({
  currentRound,
  selectedPlayer,
  teams,
  onStartRound,
  onPick,
  onPass,
  onCancel,
  onSetDecrement,
}: AuctionPanelProps) {
  const [priceDecrement, setPriceDecrement] = useState(100);

  // 라운드 시작 전
  if (!currentRound) {
    const sortedTeams = [...teams]
      .filter((t) => t.members.length < 4)
      .sort((a, b) => b.leader.currentPoints - a.leader.currentPoints);
    const estimatedStartingPrice = sortedTeams[1]?.leader.currentPoints || 0;

    return (
      <div style={{ background: 'rgba(26,26,36,0.8)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', height: '100%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '300px', textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', margin: '0 auto 12px', borderRadius: '50%', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg style={{ width: '24px', height: '24px', color: 'var(--accent-cyan)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: 'white', marginBottom: '12px' }}>경매 라운드 시작</h3>
          
          <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>경매 시작가</span>
              <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--accent-gold)' }}>
                {estimatedStartingPrice.toLocaleString()}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>감소 금액</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  onClick={() => setPriceDecrement(Math.max(10, priceDecrement - 10))}
                  style={{ width: '28px', height: '28px', borderRadius: '4px', background: 'var(--bg-primary)', color: 'var(--accent-red)', border: 'none', cursor: 'pointer', fontSize: '16px' }}
                >-</button>
                <input
                  type="number"
                  value={priceDecrement}
                  onChange={(e) => setPriceDecrement(Math.max(10, Number(e.target.value)))}
                  style={{ width: '70px', textAlign: 'center', fontSize: '14px', padding: '6px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'white' }}
                />
                <button
                  onClick={() => setPriceDecrement(priceDecrement + 10)}
                  style={{ width: '28px', height: '28px', borderRadius: '4px', background: 'var(--bg-primary)', color: 'var(--accent-green)', border: 'none', cursor: 'pointer', fontSize: '16px' }}
                >+</button>
              </div>
            </div>
          </div>

          <button
            onClick={() => onStartRound(priceDecrement)}
            disabled={sortedTeams.length < 2}
            style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: '8px', 
              fontWeight: 'bold', 
              fontSize: '14px',
              background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-magenta))', 
              color: 'black', 
              border: 'none', 
              cursor: sortedTeams.length < 2 ? 'not-allowed' : 'pointer',
              opacity: sortedTeams.length < 2 ? 0.5 : 1
            }}
          >
            라운드 시작
          </button>
        </div>
      </div>
    );
  }

  const { currentPrice, priceDecrement: decrement, bidOrder, currentBidderIndex, passedInCycle, startingPrice } = currentRound;
  const currentBidder = bidOrder[currentBidderIndex];
  const canAfford = currentBidder && currentBidder.leader.currentPoints >= currentPrice;

  return (
    <div style={{ background: 'rgba(26,26,36,0.8)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '14px', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexShrink: 0 }}>
        <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>경매 진행중</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>감소:</span>
          <input
            type="number"
            value={decrement}
            onChange={(e) => onSetDecrement(Math.max(10, Number(e.target.value)))}
            style={{ width: '50px', textAlign: 'center', fontSize: '12px', padding: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'white' }}
          />
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Price + Bidder row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', flexShrink: 0 }}>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>시작가</p>
            <p style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--accent-gold)' }}>{startingPrice.toLocaleString()}</p>
          </div>
          <div style={{ background: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.3)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>현재가</p>
            <p style={{ fontSize: '16px', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>{currentPrice.toLocaleString()}</p>
          </div>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', padding: '8px', textAlign: 'center' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>현재 차례</p>
            <p style={{ fontSize: '14px', fontWeight: 'bold', color: canAfford ? 'var(--accent-green)' : 'var(--accent-red)' }}>{currentBidder?.leader.name}</p>
          </div>
        </div>

        {/* Selected player */}
        <div style={{ flexShrink: 0 }}>
          {selectedPlayer ? (
            <div style={{ background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)', borderRadius: '8px', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 'bold', color: 'white' }}>{selectedPlayer.name}</p>
                <p className={getTierClass(selectedPlayer.tier)} style={{ fontSize: '12px' }}>{selectedPlayer.tier}</p>
              </div>
              <span className={getRoleClass(selectedPlayer.mainRole)} style={{ fontSize: '12px', padding: '4px 8px', background: 'var(--bg-secondary)', borderRadius: '4px' }}>
                {selectedPlayer.mainRole}
              </span>
            </div>
          ) : (
            <div style={{ padding: '12px', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: '8px', color: 'var(--text-muted)', fontSize: '13px' }}>
              선수를 클릭하세요
            </div>
          )}
        </div>

        {/* Bid order */}
        <div style={{ flexShrink: 0 }}>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>호명 순서 ({passedInCycle.length}/{bidOrder.length})</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {bidOrder.map((team, idx) => {
              const isPassed = passedInCycle.includes(team.leader.id);
              const isCurrent = idx === currentBidderIndex;
              return (
                <span
                  key={team.leader.id}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    background: isPassed ? 'var(--bg-primary)' : isCurrent ? 'var(--accent-cyan)' : 'var(--bg-secondary)',
                    color: isPassed ? 'var(--text-muted)' : isCurrent ? 'black' : 'var(--text-secondary)',
                    textDecoration: isPassed ? 'line-through' : 'none',
                    fontWeight: isCurrent ? 'bold' : 'normal'
                  }}
                >
                  {team.leader.name}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginTop: '8px', flexShrink: 0 }}>
        <button
          onClick={onCancel}
          style={{ padding: '10px', borderRadius: '8px', fontWeight: 'bold', background: 'rgba(255,68,68,0.2)', border: '1px solid var(--accent-red)', color: 'var(--accent-red)', cursor: 'pointer', fontSize: '13px' }}
        >
          취소
        </button>
        <button
          onClick={onPass}
          style={{ padding: '10px', borderRadius: '8px', fontWeight: 'bold', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'white', cursor: 'pointer', fontSize: '13px' }}
        >
          패스
        </button>
        <button
          onClick={onPick}
          disabled={!selectedPlayer || !canAfford}
          style={{ 
            padding: '10px', 
            borderRadius: '8px', 
            fontWeight: 'bold', 
            background: selectedPlayer && canAfford ? 'linear-gradient(135deg, var(--accent-cyan), var(--accent-magenta))' : 'var(--bg-secondary)',
            border: 'none',
            color: selectedPlayer && canAfford ? 'black' : 'var(--text-muted)',
            cursor: selectedPlayer && canAfford ? 'pointer' : 'not-allowed',
            fontSize: '13px'
          }}
        >
          지명
        </button>
      </div>
    </div>
  );
}
