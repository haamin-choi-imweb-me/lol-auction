'use client';

import { Team } from '@/types';

interface LeaderBoardProps {
  teams: Team[];
  currentBidderId?: string;
}

export default function LeaderBoard({ teams, currentBidderId }: LeaderBoardProps) {
  const sortedTeams = [...teams].sort(
    (a, b) => b.leader.currentPoints - a.leader.currentPoints
  );

  return (
    <div style={{ background: 'rgba(26,26,36,0.8)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '10px', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--accent-gold)', marginBottom: '8px', flexShrink: 0 }}>
        입찰 우선순위
      </h2>

      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(3, 1fr)', gap: '6px', overflow: 'hidden' }}>
        {sortedTeams.map((team, index) => {
          const isCurrentBidder = team.leader.id === currentBidderId;
          const isFull = team.members.length >= 4;

          return (
            <div
              key={team.leader.id}
              style={{
                padding: '6px 8px',
                borderRadius: '6px',
                background: isCurrentBidder ? 'rgba(0,245,255,0.2)' : isFull ? 'rgba(18,18,26,0.5)' : 'var(--bg-secondary)',
                border: isCurrentBidder ? '1px solid var(--accent-cyan)' : '1px solid transparent',
                opacity: isFull ? 0.5 : 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                overflow: 'hidden'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '9px',
                  fontWeight: 'bold',
                  background: index === 0 ? 'var(--accent-gold)' : index === 1 ? '#9ca3af' : index === 2 ? '#b45309' : 'var(--bg-primary)',
                  color: index < 3 ? 'black' : 'var(--text-secondary)',
                  flexShrink: 0
                }}>
                  {index + 1}
                </div>
                <span style={{ 
                  fontSize: '12px', 
                  fontWeight: 'bold', 
                  color: isCurrentBidder ? 'var(--accent-cyan)' : 'white', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  whiteSpace: 'nowrap',
                  flex: 1
                }}>
                  {team.leader.name}
                </span>
                {isFull && <span style={{ fontSize: '8px', padding: '2px 4px', background: 'rgba(0,255,136,0.2)', color: 'var(--accent-green)', borderRadius: '3px', flexShrink: 0 }}>완료</span>}
                {isCurrentBidder && !isFull && <span style={{ fontSize: '8px', padding: '2px 4px', background: 'var(--accent-cyan)', color: 'black', borderRadius: '3px', flexShrink: 0 }}>입찰</span>}
              </div>
              <div style={{ fontSize: '10px', display: 'flex', gap: '6px' }}>
                <span>
                  <span style={{ color: '#00f5ff', fontWeight: 'bold' }}>{team.leader.currentPoints.toLocaleString()}</span>
                  <span style={{ color: '#606070' }}>/</span>
                  <span style={{ color: '#ffd700' }}>{team.leader.initialPoints.toLocaleString()}</span>
                </span>
                <span style={{ color: 'var(--text-muted)' }}>|</span>
                <span>{team.members.length}/4</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
