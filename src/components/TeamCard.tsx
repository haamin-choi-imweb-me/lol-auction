'use client';

import { motion } from 'framer-motion';
import { Team } from '@/types';

interface TeamCardProps {
  team: Team;
  index: number;
  onRemoveMember?: (teamId: string, playerId: string) => void;
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

const ROLE_ORDER: Record<string, number> = {
  '탑': 0,
  '정글': 1,
  '미드': 2,
  '원딜': 3,
  '서폿': 4,
};

export default function TeamCard({ team, index, onRemoveMember }: TeamCardProps) {
  const emptySlots = 4 - team.members.length;
  
  // 주라인 기준 정렬
  const sortedMembers = [...team.members].sort((a, b) => {
    const orderA = ROLE_ORDER[a.player.mainRole] ?? 99;
    const orderB = ROLE_ORDER[b.player.mainRole] ?? 99;
    return orderA - orderB;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass-card p-3"
    >
      {/* Team header */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--accent-cyan)] to-[var(--accent-magenta)] flex items-center justify-center font-bold text-black text-sm">
            {index + 1}
          </div>
          <div>
            <h3 className="font-bold text-sm text-[var(--text-primary)]">{team.leader.name}</h3>
            <p className="text-xs text-[var(--text-secondary)]">
              남은: <span className="text-[var(--accent-cyan)]">{team.leader.currentPoints.toLocaleString()}</span>
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-[var(--text-muted)]">지출</p>
          <p className="text-sm font-bold text-[var(--accent-magenta)]">{team.totalSpent.toLocaleString()}</p>
        </div>
      </div>

      {/* Team members */}
      <div className="space-y-1.5">
        {sortedMembers.map((member, idx) => (
          <div
            key={member.player.id}
            className="flex items-center justify-between p-1.5 rounded bg-[var(--bg-secondary)] group"
          >
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[var(--accent-gold)]/20 text-[var(--accent-gold)] flex items-center justify-center text-[10px] font-bold">
                {member.pickOrder}
              </span>
              <div>
                <p className="font-medium text-xs text-[var(--text-primary)]">{member.player.name}</p>
                <p className={`text-[10px] ${getTierClass(member.player.tier)}`}>{member.player.tier}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[10px] ${getRoleClass(member.player.mainRole)}`}>
                {member.player.mainRole}
              </span>
              {member.player.subRole && (
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-[var(--accent-gold)]/20 text-[var(--accent-gold)]">
                  +{member.player.subRole}
                </span>
              )}
              <span className="text-xs font-semibold text-[var(--accent-cyan)]">{member.price}</span>
              {onRemoveMember && (
                <button
                  onClick={() => onRemoveMember(team.leader.id, member.player.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 rounded flex items-center justify-center bg-[var(--accent-red)]/20 text-[var(--accent-red)] hover:bg-[var(--accent-red)]/40"
                  title="지명 취소"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Empty slots */}
        {Array.from({ length: emptySlots }).map((_, idx) => (
          <div
            key={`empty-${idx}`}
            className="flex items-center justify-center p-2 rounded border border-dashed border-[var(--border-color)] text-[var(--text-muted)] text-xs"
          >
            {team.members.length + idx + 1}픽 대기중
          </div>
        ))}
      </div>
    </motion.div>
  );
}
