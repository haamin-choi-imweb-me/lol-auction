'use client';

import { motion } from 'framer-motion';
import { Team } from '@/types';

interface TeamCardProps {
  team: Team;
  index: number;
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

export default function TeamCard({ team, index }: TeamCardProps) {
  const emptySlots = 4 - team.members.length;

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
        {team.members.map((member, idx) => (
          <div
            key={member.player.id}
            className="flex items-center justify-between p-1.5 rounded bg-[var(--bg-secondary)]"
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
              <span className="text-xs font-semibold text-[var(--accent-cyan)]">{member.price}</span>
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
