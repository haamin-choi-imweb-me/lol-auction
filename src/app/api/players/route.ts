import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { Player } from '@/types';

const DATA_PATH = path.join(process.cwd(), 'data', 'players.json');

async function readPlayers(): Promise<Player[]> {
  try {
    const data = await fs.readFile(DATA_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writePlayers(players: Player[]): Promise<void> {
  await fs.writeFile(DATA_PATH, JSON.stringify(players, null, 2), 'utf-8');
}

// GET - 모든 선수 조회
export async function GET() {
  const players = await readPlayers();
  return NextResponse.json(players);
}

// POST - 새 선수 추가
export async function POST(request: NextRequest) {
  const body = await request.json();
  const players = await readPlayers();
  
  const newPlayer: Player = {
    id: `p${Date.now()}`,
    name: body.name,
    tier: body.tier,
    mainRole: body.mainRole,
    subRole: body.subRole || '',
  };
  
  players.push(newPlayer);
  await writePlayers(players);
  
  return NextResponse.json(newPlayer, { status: 201 });
}

// PUT - 선수 수정
export async function PUT(request: NextRequest) {
  const body = await request.json();
  const players = await readPlayers();
  
  const index = players.findIndex(p => p.id === body.id);
  if (index === -1) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 });
  }
  
  players[index] = { ...players[index], ...body };
  await writePlayers(players);
  
  return NextResponse.json(players[index]);
}

// DELETE - 선수 삭제
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  
  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }
  
  const players = await readPlayers();
  const filtered = players.filter(p => p.id !== id);
  
  if (filtered.length === players.length) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 });
  }
  
  await writePlayers(filtered);
  
  return NextResponse.json({ success: true });
}

