import { NextResponse } from 'next/server';
import { getLogs } from '@/lib/logger';

export async function GET() {
  const logs = await getLogs();
  return NextResponse.json(logs);
}
