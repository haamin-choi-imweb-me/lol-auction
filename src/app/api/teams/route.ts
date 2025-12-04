import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { TeamLeader } from '@/types';

const DATA_PATH = path.join(process.cwd(), 'data', 'teams.json');

async function readTeams(): Promise<TeamLeader[]> {
  try {
    const data = await fs.readFile(DATA_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeTeams(teams: TeamLeader[]): Promise<void> {
  await fs.writeFile(DATA_PATH, JSON.stringify(teams, null, 2), 'utf-8');
}

// GET - 모든 팀장 조회
export async function GET() {
  const teams = await readTeams();
  return NextResponse.json(teams);
}

// POST - 새 팀장 추가
export async function POST(request: NextRequest) {
  const body = await request.json();
  const teams = await readTeams();
  
  const newTeam: TeamLeader = {
    id: `t${Date.now()}`,
    name: body.name,
    initialPoints: body.initialPoints || 0,
    currentPoints: body.currentPoints ?? body.initialPoints ?? 0,
  };
  
  teams.push(newTeam);
  await writeTeams(teams);
  
  return NextResponse.json(newTeam, { status: 201 });
}

// PUT - 팀장 정보 수정
export async function PUT(request: NextRequest) {
  const body = await request.json();
  const teams = await readTeams();
  
  const index = teams.findIndex(t => t.id === body.id);
  if (index === -1) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 });
  }
  
  teams[index] = { ...teams[index], ...body };
  await writeTeams(teams);
  
  return NextResponse.json(teams[index]);
}

// DELETE - 팀장 삭제
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }
  
  const teams = await readTeams();
  const filtered = teams.filter(t => t.id !== id);
  
  if (filtered.length === teams.length) {
    return NextResponse.json({ error: 'Team not found' }, { status: 404 });
  }
  
  await writeTeams(filtered);
  
  return NextResponse.json({ success: true });
}

