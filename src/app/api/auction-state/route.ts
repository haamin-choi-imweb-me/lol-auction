import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data', 'auction-state.json');

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

async function readState(): Promise<SavedAuctionState | null> {
  try {
    const data = await fs.readFile(DATA_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return null;
  }
}

async function writeState(state: SavedAuctionState): Promise<void> {
  await fs.writeFile(DATA_PATH, JSON.stringify(state, null, 2), 'utf-8');
}

// GET - 경매 상태 조회
export async function GET() {
  const state = await readState();
  return NextResponse.json(state);
}

// POST - 경매 상태 저장
export async function POST(request: NextRequest) {
  const body = await request.json();
  await writeState(body);
  return NextResponse.json({ success: true });
}

// DELETE - 경매 상태 초기화
export async function DELETE() {
  try {
    await fs.unlink(DATA_PATH);
  } catch {
    // File doesn't exist, that's fine
  }
  return NextResponse.json({ success: true });
}

