import { supabase } from '../config/supabase.js';

export const lotteryService = {
  async getCurrentDraw() {
    const { data, error } = await supabase
      .from('lottery_draws')
      .select('*')
      .eq('status', 'open')
      .order('draw_date', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async placeBet(drawId, betNumbers, totalAmount) {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Not authenticated');

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', user.data.user.id)
      .single();

    if (profileError) throw profileError;
    if (profile.balance < totalAmount) {
      throw new Error('ยอดเงินไม่เพียงพอ');
    }

    const { data: bet, error: betError } = await supabase
      .from('bets')
      .insert({
        user_id: user.data.user.id,
        draw_id: drawId,
        total_amount: totalAmount,
        status: 'pending'
      })
      .select()
      .single();

    if (betError) throw betError;

    const betNumbersData = betNumbers.map(bn => ({
      bet_id: bet.id,
      number: bn.number,
      bet_type: bn.betType,
      amount: bn.amount,
      payout_rate: bn.payoutRate
    }));

    const { error: betNumbersError } = await supabase
      .from('bet_numbers')
      .insert(betNumbersData);

    if (betNumbersError) throw betNumbersError;

    const { error: balanceError } = await supabase
      .from('profiles')
      .update({ balance: profile.balance - totalAmount })
      .eq('id', user.data.user.id);

    if (balanceError) throw balanceError;

    return bet;
  },

  async getUserBets() {
    const user = await supabase.auth.getUser();
    if (!user.data.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('bets')
      .select(`
        *,
        lottery_draws (*),
        bet_numbers (*)
      `)
      .eq('user_id', user.data.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getAdminRiskSummary(drawId) {
    const { data, error } = await supabase
      .from('bet_numbers')
      .select(`
        number,
        bet_type,
        amount,
        bets!inner (
          draw_id,
          status
        )
      `)
      .eq('bets.draw_id', drawId)
      .eq('bets.status', 'pending');

    if (error) throw error;

    const riskMap = {};
    data.forEach(item => {
      const key = `${item.number}-${item.bet_type}`;
      if (!riskMap[key]) {
        riskMap[key] = {
          number: item.number,
          betType: item.bet_type,
          totalRisk: 0
        };
      }
      riskMap[key].totalRisk += parseFloat(item.amount);
    });

    return Object.values(riskMap).sort((a, b) => b.totalRisk - a.totalRisk);
  },

  async getAllBets(drawId) {
    const { data, error } = await supabase
      .from('bets')
      .select(`
        *,
        profiles (full_name, email),
        bet_numbers (*)
      `)
      .eq('draw_id', drawId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
};
