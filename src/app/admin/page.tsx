'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Player, TeamLeader, Tier, Role } from '@/types';
import {
  addPlayer,
  updatePlayer,
  deletePlayer,
  addTeamLeader,
  updateTeamLeader,
  deleteTeamLeader,
  STORAGE_KEYS,
} from '@/lib/store';

const TIERS: Tier[] = [
  '챌린저', '그랜드마스터', '마스터',
  '다이아1', '다이아2', '다이아3', '다이아4',
  '에메랄드1', '에메랄드2', '에메랄드3', '에메랄드4',
  '플레티넘1', '플레티넘2', '플레티넘3', '플레티넘4',
  '골드1', '골드2', '골드3', '골드4',
];

const ROLES: Role[] = ['탑', '정글', '미드', '원딜', '서폿'];

// localStorage 헬퍼
function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export default function AdminPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<TeamLeader[]>([]);
  const [activeTab, setActiveTab] = useState<'players' | 'teams'>('teams');
  const [isLoading, setIsLoading] = useState(true);

  // 선수 폼
  const [playerForm, setPlayerForm] = useState({
    id: '',
    name: '',
    tier: '다이아4' as Tier,
    mainRole: '미드' as Role,
    subRole: '' as Role | '',
  });
  const [isEditingPlayer, setIsEditingPlayer] = useState(false);

  // 팀장 폼
  const [teamForm, setTeamForm] = useState({
    id: '',
    name: '',
    initialPoints: 3000,
    currentPoints: 3000,
    tier: '' as Tier | '',
  });
  const [isEditingTeam, setIsEditingTeam] = useState(false);

  // 팀장 점수순 정렬
  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => b.currentPoints - a.currentPoints);
  }, [teams]);

  // 데이터 로드 (localStorage에서)
  const loadData = () => {
    setIsLoading(true);
    try {
      const storedPlayers = getFromStorage<Player[]>(STORAGE_KEYS.PLAYERS, []);
      const storedTeams = getFromStorage<TeamLeader[]>(STORAGE_KEYS.TEAM_LEADERS, []);
      setPlayers(storedPlayers);
      setTeams(storedTeams);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 선수 관련 핸들러
  const handlePlayerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditingPlayer) {
        updatePlayer(playerForm as Player);
      } else {
        addPlayer({
          name: playerForm.name,
          tier: playerForm.tier,
          mainRole: playerForm.mainRole,
          subRole: playerForm.subRole as Role,
        });
      }
      loadData();
      resetPlayerForm();
    } catch (error) {
      console.error('Failed to save player:', error);
    }
  };

  const handleEditPlayer = (player: Player) => {
    setPlayerForm(player);
    setIsEditingPlayer(true);
  };

  const handleDeletePlayer = (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      deletePlayer(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete player:', error);
    }
  };

  const resetPlayerForm = () => {
    setPlayerForm({
      id: '',
      name: '',
      tier: '다이아4',
      mainRole: '미드',
      subRole: '',
    });
    setIsEditingPlayer(false);
  };

  // 팀장 관련 핸들러
  const handleTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditingTeam) {
        updateTeamLeader(teamForm as TeamLeader);
      } else {
        addTeamLeader({
          name: teamForm.name,
          initialPoints: teamForm.initialPoints,
          currentPoints: teamForm.currentPoints,
        });
      }
      loadData();
      resetTeamForm();
    } catch (error) {
      console.error('Failed to save team:', error);
    }
  };

  const handleEditTeam = (team: TeamLeader) => {
    setTeamForm(team);
    setIsEditingTeam(true);
  };

  const handleDeleteTeam = (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      deleteTeamLeader(id);
      loadData();
    } catch (error) {
      console.error('Failed to delete team:', error);
    }
  };

  const resetTeamForm = () => {
    setTeamForm({
      id: '',
      name: '',
      initialPoints: 3000,
      currentPoints: 3000,
      tier: '',
    });
    setIsEditingTeam(false);
  };

  // 경매 리셋
  const handleResetAuction = () => {
    if (!confirm('경매 상태를 초기화하시겠습니까? 모든 낙찰 기록이 삭제됩니다.')) return;
    try {
      // 경매 상태 삭제
      localStorage.removeItem(STORAGE_KEYS.AUCTION_STATE);
      // 팀장 currentPoints를 initialPoints로 리셋
      for (const team of teams) {
        updateTeamLeader({
          ...team,
          currentPoints: team.initialPoints,
        });
      }
      loadData();
      alert('경매가 초기화되었습니다.');
    } catch (error) {
      console.error('Failed to reset auction:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-[var(--accent-cyan)] text-xl">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">관리자 페이지</h1>
          <p className="text-[var(--text-secondary)]">선수 및 팀장 데이터 관리</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleResetAuction}
            className="px-4 py-2 rounded-lg bg-[var(--accent-red)]/20 text-[var(--accent-red)] hover:bg-[var(--accent-red)]/30 transition-colors"
          >
            경매 초기화
          </button>
          <Link
            href="/"
            className="px-6 py-2 rounded-lg bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/30 transition-colors"
          >
            경매 페이지로 →
          </Link>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('teams')}
          className={`px-6 py-3 rounded-xl font-semibold transition-all ${
            activeTab === 'teams'
              ? 'bg-[var(--accent-gold)] text-black'
              : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          팀장 관리 ({teams.length})
        </button>
        <button
          onClick={() => setActiveTab('players')}
          className={`px-6 py-3 rounded-xl font-semibold transition-all ${
            activeTab === 'players'
              ? 'bg-[var(--accent-cyan)] text-black'
              : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          선수 관리 ({players.length})
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'teams' ? (
          <motion.div
            key="teams"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* 팀장 추가/수정 폼 */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold mb-4 text-[var(--accent-gold)]">
                {isEditingTeam ? '팀장 수정' : '팀장 추가'}
              </h2>
              <form onSubmit={handleTeamSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1">
                    팀장 이름
                  </label>
                  <input
                    type="text"
                    value={teamForm.name}
                    onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-white focus:border-[var(--accent-gold)] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1">
                    초기 보유 점수
                  </label>
                  <input
                    type="number"
                    value={teamForm.initialPoints}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setTeamForm({
                        ...teamForm,
                        initialPoints: val,
                        currentPoints: isEditingTeam ? teamForm.currentPoints : val,
                      });
                    }}
                    className="w-full px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-white focus:border-[var(--accent-gold)] focus:outline-none"
                    required
                  />
                </div>
                {isEditingTeam && (
                  <div>
                    <label className="block text-sm text-[var(--text-secondary)] mb-1">
                      현재 보유 점수
                    </label>
                    <input
                      type="number"
                      value={teamForm.currentPoints}
                      onChange={(e) => setTeamForm({ ...teamForm, currentPoints: Number(e.target.value) })}
                      className="w-full px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-white focus:border-[var(--accent-gold)] focus:outline-none"
                      required
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1">
                    팀장 티어 (선택)
                  </label>
                  <select
                    value={teamForm.tier}
                    onChange={(e) => setTeamForm({ ...teamForm, tier: e.target.value as Tier | '' })}
                    className="w-full px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-white focus:border-[var(--accent-gold)] focus:outline-none"
                  >
                    <option value="">선택 안 함</option>
                    {TIERS.map((tier) => (
                      <option key={tier} value={tier}>
                        {tier}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 btn-primary">
                    {isEditingTeam ? '수정' : '추가'}
                  </button>
                  {isEditingTeam && (
                    <button
                      type="button"
                      onClick={resetTeamForm}
                      className="btn-secondary"
                    >
                      취소
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* 팀장 목록 (점수순 정렬) */}
            <div className="lg:col-span-2 glass-card p-6">
              <h2 className="text-xl font-bold mb-4 text-[var(--text-primary)]">
                팀장 목록 (점수순)
              </h2>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {sortedTeams.map((team, idx) => (
                  <motion.div
                    key={team.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-8 h-8 rounded-full bg-[var(--accent-gold)]/20 text-[var(--accent-gold)] flex items-center justify-center font-bold">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">
                          {team.name}
                          {team.tier && (
                            <span className="ml-2 text-xs px-2 py-0.5 rounded bg-[var(--accent-magenta)]/20 text-[var(--accent-magenta)]">
                              {team.tier}
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-[var(--text-secondary)]">
                          현재: <span className="text-[var(--accent-cyan)]">{team.currentPoints.toLocaleString()}</span> / 초기: {team.initialPoints.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditTeam(team)}
                        className="px-3 py-1 rounded-lg text-sm bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/30"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDeleteTeam(team.id)}
                        className="px-3 py-1 rounded-lg text-sm bg-[var(--accent-red)]/20 text-[var(--accent-red)] hover:bg-[var(--accent-red)]/30"
                      >
                        삭제
                      </button>
                    </div>
                  </motion.div>
                ))}
                {teams.length === 0 && (
                  <p className="text-center text-[var(--text-muted)] py-8">
                    등록된 팀장이 없습니다
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="players"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* 선수 추가/수정 폼 */}
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold mb-4 text-[var(--accent-cyan)]">
                {isEditingPlayer ? '선수 수정' : '선수 추가'}
              </h2>
              <form onSubmit={handlePlayerSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1">
                    소환사명
                  </label>
                  <input
                    type="text"
                    value={playerForm.name}
                    onChange={(e) => setPlayerForm({ ...playerForm, name: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-white focus:border-[var(--accent-cyan)] focus:outline-none"
                    placeholder="닉네임#태그"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1">
                    티어
                  </label>
                  <select
                    value={playerForm.tier}
                    onChange={(e) => setPlayerForm({ ...playerForm, tier: e.target.value as Tier })}
                    className="w-full px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-white focus:border-[var(--accent-cyan)] focus:outline-none"
                  >
                    {TIERS.map((tier) => (
                      <option key={tier} value={tier}>{tier}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1">
                    주 포지션
                  </label>
                  <select
                    value={playerForm.mainRole}
                    onChange={(e) => setPlayerForm({ ...playerForm, mainRole: e.target.value as Role })}
                    className="w-full px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-white focus:border-[var(--accent-cyan)] focus:outline-none"
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[var(--text-secondary)] mb-1">
                    부 포지션 (선택)
                  </label>
                  <select
                    value={playerForm.subRole}
                    onChange={(e) => setPlayerForm({ ...playerForm, subRole: e.target.value as Role | '' })}
                    className="w-full px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-white focus:border-[var(--accent-cyan)] focus:outline-none"
                  >
                    <option value="">없음</option>
                    {ROLES.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="flex-1 btn-primary">
                    {isEditingPlayer ? '수정' : '추가'}
                  </button>
                  {isEditingPlayer && (
                    <button
                      type="button"
                      onClick={resetPlayerForm}
                      className="btn-secondary"
                    >
                      취소
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* 선수 목록 */}
            <div className="lg:col-span-2 glass-card p-6">
              <h2 className="text-xl font-bold mb-4 text-[var(--text-primary)]">
                선수 목록
              </h2>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {players.map((player, idx) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">{player.name}</p>
                        <p className="text-sm text-[var(--text-secondary)]">
                          {player.tier} | {player.mainRole}
                          {player.subRole && ` / ${player.subRole}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditPlayer(player)}
                        className="px-3 py-1 rounded-lg text-sm bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/30"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDeletePlayer(player.id)}
                        className="px-3 py-1 rounded-lg text-sm bg-[var(--accent-red)]/20 text-[var(--accent-red)] hover:bg-[var(--accent-red)]/30"
                      >
                        삭제
                      </button>
                    </div>
                  </motion.div>
                ))}
                {players.length === 0 && (
                  <p className="text-center text-[var(--text-muted)] py-8">
                    등록된 선수가 없습니다
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
