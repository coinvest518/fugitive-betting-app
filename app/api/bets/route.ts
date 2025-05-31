import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { BetData } from '@/lib/moralis';

// POST /api/bets - Create a new bet
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_address, fugitiveId, fugitiveName, amount, type, odds, potentialWin } = body;

    // Validate required fields
    if (!user_address || !fugitiveId || !amount || !type || !odds) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const betData: BetData = {
      user_address,
      fugitiveId,
      fugitiveName,
      amount,
      type,
      odds,
      potentialWin,
      status: 'active',
      timestamp: new Date(),
    };

    const { data, error } = await supabase
      .from('bets')
      .insert([betData])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, bet: data });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
