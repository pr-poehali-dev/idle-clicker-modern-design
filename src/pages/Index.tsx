import { useState, useEffect, useCallback, useRef } from "react";
import Icon from "@/components/ui/icon";

// ============ TYPES ============
type Screen = "game" | "shop" | "prestige" | "stats" | "settings" | "inventory";

interface Particle {
  id: number;
  x: number;
  y: number;
  value: string;
  color: string;
}

interface Upgrade {
  id: string;
  name: string;
  desc: string;
  icon: string;
  baseCost: number;
  level: number;
  maxLevel: number;
  effect: string;
  multiplier: number;
  type: "tap" | "passive" | "hero";
}

interface Relic {
  id: string;
  name: string;
  desc: string;
  icon: string;
  owned: number;
  bonus: string;
}

interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
  unlocked: boolean;
  requirement: number;
  type: "taps" | "gold" | "stage" | "prestiges";
}

const HERO_IMAGE = "https://cdn.poehali.dev/projects/68d04eb9-a558-4e00-920c-2c945471895e/files/1f6fddd4-9736-4459-b886-f3eff630cf67.jpg";
const BG_IMAGE = "https://cdn.poehali.dev/projects/68d04eb9-a558-4e00-920c-2c945471895e/files/7ccbc1b2-8f32-4006-9ee3-6aa7508671b4.jpg";
const BOSS_IMAGE = "https://cdn.poehali.dev/projects/68d04eb9-a558-4e00-920c-2c945471895e/files/e0a5ea9e-516c-48db-9209-8a00e7e6bf05.jpg";

const INITIAL_UPGRADES: Upgrade[] = [
  { id: "sword", name: "Клинок Бурь", desc: "+5 урона за уровень", icon: "⚔️", baseCost: 50, level: 0, maxLevel: 100, effect: "+5 тап урона", multiplier: 5, type: "tap" },
  { id: "ring", name: "Кольцо Мощи", desc: "Удваивает урон тапа", icon: "💍", baseCost: 200, level: 0, maxLevel: 50, effect: "×2 тап урон", multiplier: 2, type: "tap" },
  { id: "armor", name: "Доспех Героя", desc: "Пассивный DPS +10/сек", icon: "🛡️", baseCost: 150, level: 0, maxLevel: 100, effect: "+10 DPS", multiplier: 10, type: "passive" },
  { id: "boots", name: "Сапоги Ветра", desc: "+15% скорости атаки", icon: "👢", baseCost: 300, level: 0, maxLevel: 50, effect: "+15% DPS", multiplier: 15, type: "passive" },
  { id: "helm", name: "Шлем Дракона", desc: "Крит шанс +5%", icon: "🐉", baseCost: 500, level: 0, maxLevel: 30, effect: "+5% крит", multiplier: 5, type: "hero" },
  { id: "cape", name: "Плащ Тьмы", desc: "×3 урон при крите", icon: "🌑", baseCost: 800, level: 0, maxLevel: 20, effect: "×3 крит урон", multiplier: 3, type: "hero" },
  { id: "amulet", name: "Амулет Света", desc: "+25 урона тапа", icon: "✨", baseCost: 400, level: 0, maxLevel: 80, effect: "+25 тап урон", multiplier: 25, type: "tap" },
  { id: "staff", name: "Посох Мага", desc: "+50 пассивного DPS", icon: "🔮", baseCost: 1000, level: 0, maxLevel: 60, effect: "+50 DPS", multiplier: 50, type: "passive" },
];

const INITIAL_RELICS: Relic[] = [
  { id: "r1", name: "Осколок Вечности", desc: "+25% к урону тапа", icon: "💎", owned: 0, bonus: "tap" },
  { id: "r2", name: "Кровь Дракона", desc: "+25% к пассивному DPS", icon: "🩸", owned: 0, bonus: "passive" },
  { id: "r3", name: "Корона Богов", desc: "+10% к стартовому золоту", icon: "👑", owned: 0, bonus: "gold" },
  { id: "r4", name: "Глаз Бездны", desc: "+15% шанс крита", icon: "👁️", owned: 0, bonus: "crit" },
  { id: "r5", name: "Звезда Хаоса", desc: "×2 к награде реликвий", icon: "⭐", owned: 0, bonus: "relics" },
  { id: "r6", name: "Камень Души", desc: "+50% к золоту с боссов", icon: "🔴", owned: 0, bonus: "boss_gold" },
];

const INITIAL_ACHIEVEMENTS: Achievement[] = [
  { id: "a1", name: "Первый удар", desc: "Сделай 100 тапов", icon: "👊", unlocked: false, requirement: 100, type: "taps" },
  { id: "a2", name: "Неутомимый", desc: "Сделай 1000 тапов", icon: "💪", unlocked: false, requirement: 1000, type: "taps" },
  { id: "a3", name: "Легенда тапа", desc: "Сделай 10000 тапов", icon: "🏆", unlocked: false, requirement: 10000, type: "taps" },
  { id: "a4", name: "Накопитель", desc: "Собери 1000 золота", icon: "💰", unlocked: false, requirement: 1000, type: "gold" },
  { id: "a5", name: "Богач", desc: "Собери 100000 золота", icon: "💎", unlocked: false, requirement: 100000, type: "gold" },
  { id: "a6", name: "Завоеватель", desc: "Достигни 10 этапа", icon: "🗡️", unlocked: false, requirement: 10, type: "stage" },
  { id: "a7", name: "Легенда", desc: "Достигни 50 этапа", icon: "⚔️", unlocked: false, requirement: 50, type: "stage" },
  { id: "a8", name: "Перерождение", desc: "Совершить первый престиж", icon: "🌟", unlocked: false, requirement: 1, type: "prestiges" },
];

const INVENTORY_ITEMS = [
  { id: "i1", name: "Зелье скорости", desc: "×2 DPS на 30 сек", icon: "🧪", rarity: "rare", qty: 3 },
  { id: "i2", name: "Свиток урона", desc: "×5 тап урон на 1 мин", icon: "📜", rarity: "epic", qty: 1 },
  { id: "i3", name: "Золотой эликсир", desc: "+500% золото на 2 мин", icon: "🍶", rarity: "legendary", qty: 1 },
  { id: "i4", name: "Щит воина", desc: "Пропустить 1 этап", icon: "🛡️", rarity: "common", qty: 5 },
  { id: "i5", name: "Руна силы", desc: "Постоянный +10 урон", icon: "🔷", rarity: "rare", qty: 2 },
];

const RARITY_COLORS: Record<string, string> = {
  common: "text-gray-300 border-gray-500",
  rare: "text-blue-300 border-blue-500",
  epic: "text-purple-300 border-purple-500",
  legendary: "text-yellow-300 border-yellow-500",
};

function formatNumber(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(1) + "T";
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return Math.floor(n).toString();
}

export default function Index() {
  const [screen, setScreen] = useState<Screen>("game");
  const [gold, setGold] = useState(0);
  const [totalGold, setTotalGold] = useState(0);
  const [stage, setStage] = useState(1);
  const [totalTaps, setTotalTaps] = useState(0);
  const [prestiges, setPrestiges] = useState(0);
  const [relics, setRelics] = useState<Relic[]>(INITIAL_RELICS);
  const [upgrades, setUpgrades] = useState<Upgrade[]>(INITIAL_UPGRADES);
  const [achievements, setAchievements] = useState<Achievement[]>(INITIAL_ACHIEVEMENTS);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [bossShake, setBossShake] = useState(false);
  const [heroTap, setHeroTap] = useState(false);
  const [bossHp, setBossHp] = useState(100);
  const [maxBossHp, setMaxBossHp] = useState(100);
  const [isBoss, setIsBoss] = useState(false);
  const [prestigeConfirm, setPrestigeConfirm] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(true);
  const [graphicsOn, setGraphicsOn] = useState(true);
  const [vibrationOn, setVibrationOn] = useState(true);
  const [shopFilter, setShopFilter] = useState<"all" | "tap" | "passive" | "hero">("all");
  const particleId = useRef(0);
  const dpsInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const tapDamage = upgrades.reduce((acc, u) => {
    if (u.type === "tap") return acc + u.level * u.multiplier;
    return acc;
  }, 1) * (1 + (relics.find(r => r.id === "r1")?.owned ?? 0) * 0.25);

  const critChance = 0.05 + (upgrades.find(u => u.id === "helm")?.level ?? 0) * 0.05 + (relics.find(r => r.id === "r4")?.owned ?? 0) * 0.15;
  const critMult = (upgrades.find(u => u.id === "cape")?.level ?? 0) > 0 ? 3 : 2;

  const passiveDps = upgrades.reduce((acc, u) => {
    if (u.type === "passive") return acc + u.level * u.multiplier;
    return acc;
  }, 0) * (1 + (relics.find(r => r.id === "r2")?.owned ?? 0) * 0.25);

  const upgradeMultiplier = 1 + prestiges * 0.1 + (relics.find(r => r.id === "r1")?.owned ?? 0) * 0.25;

  const getBossHpMax = (s: number) => Math.floor(50 * Math.pow(1.4, s - 1));

  useEffect(() => {
    const stageHp = getBossHpMax(stage);
    setMaxBossHp(stageHp);
    setBossHp(stageHp);
    setIsBoss(stage % 5 === 0);
  }, [stage]);

  const dealDamage = useCallback((dmg: number, isTap: boolean) => {
    setBossHp(prev => {
      const newHp = Math.max(0, prev - dmg);
      if (newHp <= 0) {
        const goldReward = Math.floor(10 * Math.pow(1.3, stage - 1) * (1 + prestiges * 0.1));
        setGold(g => g + goldReward);
        setTotalGold(g => g + goldReward);
        setStage(s => s + 1);
        if (isTap && vibrationOn && navigator.vibrate) navigator.vibrate(50);
      }
      return newHp;
    });
  }, [stage, prestiges, vibrationOn]);

  useEffect(() => {
    if (passiveDps > 0) {
      dpsInterval.current = setInterval(() => {
        const dps = passiveDps / 10;
        dealDamage(dps, false);
      }, 100);
    }
    return () => { if (dpsInterval.current) clearInterval(dpsInterval.current); };
  }, [passiveDps, dealDamage]);

  useEffect(() => {
    const updated = achievements.map(a => {
      if (a.unlocked) return a;
      let val = 0;
      if (a.type === "taps") val = totalTaps;
      if (a.type === "gold") val = totalGold;
      if (a.type === "stage") val = stage;
      if (a.type === "prestiges") val = prestiges;
      if (val >= a.requirement) {
        showNotification(`🏆 Достижение: ${a.name}`);
        return { ...a, unlocked: true };
      }
      return a;
    });
    setAchievements(updated);
  }, [totalTaps, totalGold, stage, prestiges]);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 2500);
  };

  const handleTap = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    let clientX: number, clientY: number;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('changedTouches' in e && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const isCrit = Math.random() < critChance;
    const dmg = tapDamage * upgradeMultiplier * (isCrit ? critMult : 1);

    setTotalTaps(t => t + 1);
    setHeroTap(true);
    setTimeout(() => setHeroTap(false), 150);
    setBossShake(true);
    setTimeout(() => setBossShake(false), 300);

    const pid = particleId.current++;
    const color = isCrit ? "#FFD700" : "#FF6B35";
    const label = isCrit ? `⚡ КРИТ ${formatNumber(dmg)}!` : `+${formatNumber(dmg)}`;
    setParticles(p => [...p, { id: pid, x, y, value: label, color }]);
    setTimeout(() => setParticles(p => p.filter(pt => pt.id !== pid)), 800);

    dealDamage(dmg, true);

    const goldGain = 1 + Math.floor(stage * 0.3);
    setGold(g => g + goldGain);
    setTotalGold(g => g + goldGain);
  }, [tapDamage, critChance, critMult, upgradeMultiplier, dealDamage, stage]);

  const buyUpgrade = (upg: Upgrade) => {
    const cost = Math.floor(upg.baseCost * Math.pow(1.15, upg.level));
    if (gold < cost || upg.level >= upg.maxLevel) return;
    setGold(g => g - cost);
    setUpgrades(prev => prev.map(u => u.id === upg.id ? { ...u, level: u.level + 1 } : u));
    showNotification(`✅ ${upg.name} улучшен!`);
  };

  const doPrestige = () => {
    const newRelicCount = Math.floor(1 + stage / 10);
    const starRelicBonus = relics.find(r => r.id === "r5")?.owned ?? 0;
    const totalNewRelics = newRelicCount * (1 + starRelicBonus);

    setPrestiges(p => p + 1);
    setStage(1);
    setGold(0);
    setTotalGold(0);
    setTotalTaps(0);
    setUpgrades(INITIAL_UPGRADES);

    const randomRelicId = INITIAL_RELICS[Math.floor(Math.random() * INITIAL_RELICS.length)].id;
    setRelics(prev => prev.map(r => r.id === randomRelicId ? { ...r, owned: r.owned + totalNewRelics } : r));

    setPrestigeConfirm(false);
    setScreen("game");
    showNotification(`🌟 Престиж! Получено ${totalNewRelics} реликвий!`);
  };

  const upgradesCost = (upg: Upgrade) => Math.floor(upg.baseCost * Math.pow(1.15, upg.level));
  const filteredUpgrades = upgrades.filter(u => shopFilter === "all" || u.type === shopFilter);
  const hpPercent = maxBossHp > 0 ? (bossHp / maxBossHp) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-background flex flex-col overflow-hidden" style={{ maxWidth: 430, margin: "0 auto" }}>

      {/* NOTIFICATION */}
      {notification && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 animate-fade-up">
          <div className="bg-card border border-border rounded-xl px-4 py-2 text-sm font-display text-gold shadow-lg whitespace-nowrap">
            {notification}
          </div>
        </div>
      )}

      {/* ===== GAME SCREEN ===== */}
      {screen === "game" && (
        <div className="flex flex-col h-full">

          {/* ── BATTLE ARENA (full bleed, tap zone) ── */}
          <div
            className="relative flex-1 flex flex-col overflow-hidden"
            onTouchStart={handleTap}
            onClick={handleTap}
            style={{ cursor: "pointer" }}
          >
            {/* Background */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${BG_IMAGE})`, filter: "brightness(0.55) saturate(1.5)" }}
            />
            {/* Vignette */}
            <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 30%, rgba(5,5,20,0.75) 100%)" }} />
            {/* Bottom fade */}
            <div className="absolute bottom-0 left-0 right-0 h-32" style={{ background: "linear-gradient(to top, hsl(240 20% 8%), transparent)" }} />

            {/* ── TOP HUD ── */}
            <div className="relative z-20 flex items-start justify-between px-3 pt-3">
              {/* Left: gold + dps */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 rounded-2xl px-3 py-1.5" style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,190,0,0.25)" }}>
                  <span className="text-base">🪙</span>
                  <span className="font-display text-gold font-bold text-lg leading-none tracking-wide">{formatNumber(gold)}</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-2xl px-3 py-1" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", border: "1px solid rgba(0,220,255,0.2)" }}>
                  <span className="text-xs">⚡</span>
                  <span className="font-display text-cyan text-xs font-semibold">{formatNumber(passiveDps)}/с</span>
                </div>
              </div>

              {/* Center: stage badge */}
              <div className="flex flex-col items-center gap-1">
                <div className="rounded-2xl px-4 py-1.5 font-display font-bold text-white text-sm tracking-widest" style={{ background: "linear-gradient(135deg,rgba(120,60,220,0.85),rgba(60,20,120,0.85))", backdropFilter: "blur(10px)", border: "1px solid rgba(180,120,255,0.4)", boxShadow: "0 0 18px rgba(160,80,255,0.35)" }}>
                  ЭТАП {stage}
                </div>
                {isBoss && (
                  <div className="rounded-xl px-3 py-0.5 font-display font-bold text-white text-[10px] tracking-widest animate-pulse" style={{ background: "rgba(200,30,30,0.9)", border: "1px solid rgba(255,80,80,0.6)" }}>
                    ⚠️ БОСС
                  </div>
                )}
              </div>

              {/* Right: settings */}
              <div className="flex flex-col items-end gap-1.5">
                <button
                  onClick={e => { e.stopPropagation(); setScreen("settings"); }}
                  className="w-9 h-9 rounded-2xl flex items-center justify-center transition-all active:scale-90"
                  style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.12)" }}
                >
                  <Icon name="Settings" size={17} className="text-white/70" />
                </button>
                <div className="flex items-center gap-1 rounded-xl px-2 py-1" style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <span className="text-[10px]">⚔️</span>
                  <span className="font-display text-white/60 text-[10px]">{formatNumber(tapDamage * upgradeMultiplier)}</span>
                </div>
              </div>
            </div>

            {/* ── ENEMY HP BAR ── */}
            <div className="relative z-20 px-4 mt-2">
              <div className="flex justify-between items-center mb-1">
                <span className="font-display text-[11px] font-bold tracking-widest" style={{ color: isBoss ? "#FF5555" : "#AAAACC" }}>
                  {isBoss ? `👹 БОСС ЭТАПА ${stage}` : `💀 Монстр`}
                </span>
                <span className="font-display text-[11px] text-white/60">{formatNumber(Math.ceil(bossHp))} / {formatNumber(maxBossHp)}</span>
              </div>
              {/* Track */}
              <div className="h-4 rounded-full overflow-hidden relative" style={{ background: "rgba(0,0,0,0.6)", border: isBoss ? "1px solid rgba(255,80,80,0.5)" : "1px solid rgba(255,255,255,0.08)" }}>
                {/* Fill */}
                <div
                  className="absolute left-0 top-0 bottom-0 rounded-full transition-all duration-200"
                  style={{
                    width: `${hpPercent}%`,
                    background: isBoss
                      ? "linear-gradient(90deg,#c0392b,#e74c3c,#ff6b6b)"
                      : "linear-gradient(90deg,#e74c3c,#ff6b35,#ffd700)",
                    boxShadow: isBoss ? "0 0 12px rgba(255,80,80,0.6)" : "0 0 10px rgba(255,140,0,0.5)",
                  }}
                />
                {/* Shine */}
                <div className="absolute top-0 left-0 right-0 h-1/2 rounded-full" style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.15), transparent)" }} />
              </div>
            </div>

            {/* ── COMBAT AREA ── */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center" style={{ gap: 0 }}>

              {/* ENEMY */}
              <div
                className={`relative flex items-center justify-center ${bossShake ? "animate-[boss-shake_0.3s_ease]" : ""}`}
                style={{ marginBottom: -10 }}
              >
                  {/* Enemy outer ring — grows with stage */}
                <div className="absolute rounded-full animate-[spin_8s_linear_infinite]" style={{
                  width: isBoss ? 200 : 175,
                  height: isBoss ? 200 : 175,
                  border: `2px solid ${isBoss ? "rgba(255,60,60,0.5)" : "rgba(180,0,255,0.35)"}`,
                  boxShadow: isBoss ? "0 0 30px rgba(255,40,40,0.4), inset 0 0 30px rgba(255,40,40,0.15)" : "0 0 20px rgba(150,0,255,0.35)",
                }} />
                <div className="absolute rounded-full animate-[spin_5s_linear_infinite_reverse]" style={{
                  width: isBoss ? 178 : 155,
                  height: isBoss ? 178 : 155,
                  border: `1px dashed ${isBoss ? "rgba(255,120,0,0.4)" : "rgba(120,0,220,0.3)"}`,
                }} />
                {/* Core glow */}
                <div className="absolute rounded-full" style={{
                  width: isBoss ? 160 : 135,
                  height: isBoss ? 160 : 135,
                  background: isBoss
                    ? "radial-gradient(circle, rgba(255,50,50,0.35) 0%, rgba(180,0,0,0.15) 50%, transparent 70%)"
                    : "radial-gradient(circle, rgba(200,0,255,0.3) 0%, rgba(100,0,180,0.1) 50%, transparent 70%)",
                }} />
                <img
                  src={BOSS_IMAGE}
                  alt="Enemy"
                  className="object-contain relative z-10"
                  style={{
                    width: isBoss ? 165 : 138,
                    height: isBoss ? 165 : 138,
                    filter: isBoss
                      ? `hue-rotate(${stage * 12}deg) brightness(1.3) contrast(1.1) drop-shadow(0 0 28px rgba(255,50,50,0.8)) drop-shadow(0 0 60px rgba(255,0,0,0.4))`
                      : `hue-rotate(${stage * 18}deg) brightness(1.15) drop-shadow(0 0 20px rgba(180,0,255,0.7)) drop-shadow(0 0 40px rgba(120,0,200,0.4))`,
                    transform: `scale(${Math.min(0.88 + stage * 0.012, 1.35)})`,
                  }}
                  draggable={false}
                />
                {/* Stage rank badge */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-20 rounded-full px-2.5 py-0.5 font-display font-bold text-[10px] tracking-widest whitespace-nowrap" style={{
                  background: isBoss ? "linear-gradient(90deg,#c0392b,#e74c3c)" : "linear-gradient(90deg,#6c0dad,#9b59b6)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
                  color: "#fff",
                }}>
                  {isBoss ? `👹 БОСС ЛВЛ ${stage}` : `☠️ Монстр ЛВЛ ${stage}`}
                </div>
              </div>

              {/* CLASH DIVIDER */}
              <div className="flex items-center justify-center w-full px-6 z-20 my-1" style={{ height: 32 }}>
                <div className="flex-1 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(255,100,0,0.7))" }} />
                <div className="mx-3 flex items-center gap-1.5 rounded-full px-3 py-1" style={{ background: "rgba(0,0,0,0.65)", border: "1px solid rgba(255,100,0,0.3)", boxShadow: "0 0 15px rgba(255,80,0,0.25)" }}>
                  <span style={{ fontSize: 12 }}>⚔️</span>
                  <span className="font-display text-[10px] tracking-[0.25em]" style={{ color: "rgba(255,160,60,0.9)" }}>БИТВА</span>
                  <span style={{ fontSize: 12 }}>⚔️</span>
                </div>
                <div className="flex-1 h-px" style={{ background: "linear-gradient(to left, transparent, rgba(255,100,0,0.7))" }} />
              </div>

              {/* HERO */}
              <div
                className={`relative flex items-center justify-center ${heroTap ? "animate-bounce-tap" : "animate-hero-idle"}`}
                style={{ marginTop: -8 }}
              >
                {/* Hero outer glow ring */}
                <div className="absolute rounded-full animate-glow-pulse" style={{
                  width: 200,
                  height: 200,
                  background: "radial-gradient(circle, rgba(255,200,0,0.18) 0%, rgba(255,120,0,0.08) 40%, transparent 65%)",
                }} />
                {/* Hero power ring */}
                <div className="absolute rounded-full" style={{
                  width: 175,
                  height: 175,
                  border: "1.5px solid rgba(255,190,0,0.4)",
                  boxShadow: "0 0 25px rgba(255,180,0,0.35), inset 0 0 25px rgba(255,180,0,0.1)",
                  animation: "spin 12s linear infinite",
                }} />
                <div className="absolute rounded-full" style={{
                  width: 155,
                  height: 155,
                  border: "1px dashed rgba(255,130,0,0.3)",
                  animation: "spin 7s linear infinite reverse",
                }} />
                {/* Prestige stars */}
                {prestiges > 0 && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-0.5 z-20">
                    {Array.from({ length: Math.min(prestiges, 5) }).map((_, i) => (
                      <span key={i} style={{ fontSize: 10, filter: "drop-shadow(0 0 4px rgba(255,220,0,0.9))" }}>⭐</span>
                    ))}
                  </div>
                )}
                <img
                  src={HERO_IMAGE}
                  alt="Hero"
                  className="object-contain relative z-10 tap-hero"
                  style={{
                    width: 148,
                    height: 148,
                    filter: prestiges > 0
                      ? `drop-shadow(0 0 25px rgba(255,200,0,0.9)) drop-shadow(0 0 50px rgba(255,120,0,0.6)) brightness(1.2) contrast(1.05)`
                      : `drop-shadow(0 0 20px rgba(255,180,0,0.75)) drop-shadow(0 0 40px rgba(255,100,0,0.4)) brightness(1.1)`,
                  }}
                  draggable={false}
                />
                {/* Hero level badge */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-20 rounded-full px-2.5 py-0.5 font-display font-bold text-[10px] tracking-widest whitespace-nowrap" style={{
                  background: "linear-gradient(90deg,#b8860b,#FFD700)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  boxShadow: "0 2px 10px rgba(255,180,0,0.5)",
                  color: "#1a0a00",
                }}>
                  {prestiges > 0 ? `✨ ГЕРОЙ × ${prestiges} ПРЕСТИЖ` : `⚔️ ГЕРОЙ ЛВЛ ${stage}`}
                </div>
              </div>
            </div>

            {/* ── BOTTOM QUICKBAR ── */}
            <div className="relative z-20 flex items-center justify-between px-3 pb-3 gap-2">
              <div className="flex-1 flex items-center gap-2 rounded-2xl px-3 py-2" style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,190,0,0.35)", boxShadow: "0 0 12px rgba(255,180,0,0.15)" }}>
                <span style={{ fontSize: 18 }}>👊</span>
                <div>
                  <div className="font-display text-gold font-bold text-sm leading-none">{formatNumber(tapDamage * upgradeMultiplier)}</div>
                  <div className="font-display text-[9px] tracking-widest" style={{ color: "rgba(255,200,0,0.5)" }}>УРОН</div>
                </div>
              </div>
              <div className="flex-1 flex items-center gap-2 rounded-2xl px-3 py-2" style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,60,60,0.35)", boxShadow: "0 0 12px rgba(255,50,50,0.15)" }}>
                <span style={{ fontSize: 18 }}>💥</span>
                <div>
                  <div className="font-display font-bold text-sm leading-none" style={{ color: "#FF6060" }}>{Math.round(critChance * 100)}%</div>
                  <div className="font-display text-[9px] tracking-widest" style={{ color: "rgba(255,80,80,0.5)" }}>КРИТ</div>
                </div>
              </div>
              <div className="flex-1 flex items-center gap-2 rounded-2xl px-3 py-2" style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(12px)", border: "1px solid rgba(0,220,255,0.35)", boxShadow: "0 0 12px rgba(0,200,255,0.15)" }}>
                <span style={{ fontSize: 18 }}>🔮</span>
                <div>
                  <div className="font-display text-cyan font-bold text-sm leading-none">{formatNumber(passiveDps)}</div>
                  <div className="font-display text-[9px] tracking-widest" style={{ color: "rgba(0,210,255,0.5)" }}>DPS/С</div>
                </div>
              </div>
            </div>

            {/* Damage particles */}
            {particles.map(p => (
              <div
                key={p.id}
                className="particle"
                style={{
                  left: p.x,
                  top: p.y,
                  color: p.color,
                  fontSize: p.value.includes("КРИТ") ? 19 : 15,
                  textShadow: `0 0 12px ${p.color}, 0 0 24px ${p.color}`,
                  fontWeight: 900,
                  letterSpacing: "0.05em",
                }}
              >
                {p.value}
              </div>
            ))}
          </div>

          {/* ── BOTTOM NAV ── */}
          <div className="flex items-stretch" style={{ background: "rgba(8,6,22,0.98)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            {[
              { id: "shop", label: "Магазин", emoji: "🛒", color: "#FFB800", glow: "rgba(255,184,0,0.4)" },
              { id: "inventory", label: "Инвентарь", emoji: "🎒", color: "#00CCFF", glow: "rgba(0,200,255,0.4)" },
              { id: "stats", label: "Статус", emoji: "📊", color: "#44DD88", glow: "rgba(60,220,130,0.4)" },
              { id: "prestige", label: "Престиж", emoji: "🌟", color: "#BB66FF", glow: "rgba(180,80,255,0.4)" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setScreen(tab.id as Screen)}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 py-3 transition-all active:scale-90 relative overflow-hidden"
              >
                <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity" style={{ background: `radial-gradient(circle at center, ${tab.glow} 0%, transparent 70%)` }} />
                <span className="text-2xl relative z-10">{tab.emoji}</span>
                <span className="font-display text-[9px] tracking-widest relative z-10" style={{ color: "rgba(255,255,255,0.4)" }}>{tab.label.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ===== SHOP ===== */}
      {screen === "shop" && (
        <div className="flex flex-col h-full animate-screen-slide-in">
          <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border">
            <button onClick={() => setScreen("game")} className="w-9 h-9 bg-muted rounded-xl flex items-center justify-center">
              <Icon name="ArrowLeft" size={18} className="text-white" />
            </button>
            <h1 className="font-display text-2xl font-bold text-white tracking-wide flex-1">🛒 МАГАЗИН</h1>
            <div className="bg-card border border-border rounded-xl px-3 py-1.5 flex items-center gap-1.5">
              <span className="text-base">🪙</span>
              <span className="font-display text-gold font-bold">{formatNumber(gold)}</span>
            </div>
          </div>

          <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-hide">
            {(["all", "tap", "passive", "hero"] as const).map(f => (
              <button
                key={f}
                onClick={() => setShopFilter(f)}
                className={`px-4 py-1.5 rounded-xl font-display text-sm font-semibold whitespace-nowrap transition-all ${shopFilter === f ? "bg-gold text-background" : "bg-muted text-muted-foreground"}`}
              >
                {f === "all" ? "Все" : f === "tap" ? "⚔️ Тап" : f === "passive" ? "⚡ Авто" : "🦸 Герой"}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-4 space-y-2">
            {filteredUpgrades.map(upg => {
              const cost = upgradesCost(upg);
              const canAfford = gold >= cost && upg.level < upg.maxLevel;
              const maxed = upg.level >= upg.maxLevel;
              return (
                <div key={upg.id} className={`upgrade-card p-3 ${canAfford ? "can-afford" : ""}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                      {upg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-display text-white font-semibold text-base">{upg.name}</span>
                        <span className="font-display text-muted-foreground text-xs">{upg.level}/{upg.maxLevel}</span>
                      </div>
                      <p className="text-muted-foreground text-xs mt-0.5">{upg.desc}</p>
                      <div className="mt-1.5 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all" style={{ width: `${(upg.level / upg.maxLevel) * 100}%` }} />
                      </div>
                    </div>
                    <button
                      onClick={() => buyUpgrade(upg)}
                      disabled={!canAfford}
                      className={`flex-shrink-0 px-3 py-2 rounded-xl font-display text-xs font-bold transition-all active:scale-95 ${maxed ? "bg-green-900 text-green-300 cursor-default" : canAfford ? "gold-button" : "bg-muted text-muted-foreground cursor-not-allowed"}`}
                    >
                      {maxed ? "МАХ" : formatNumber(cost)}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== PRESTIGE ===== */}
      {screen === "prestige" && (
        <div className="flex flex-col h-full animate-screen-slide-in">
          <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border">
            <button onClick={() => setScreen("game")} className="w-9 h-9 bg-muted rounded-xl flex items-center justify-center">
              <Icon name="ArrowLeft" size={18} className="text-white" />
            </button>
            <h1 className="font-display text-2xl font-bold tracking-wide text-purple">🌟 ПРЕСТИЖ</h1>
            <div className="ml-auto bg-card border border-border rounded-xl px-3 py-1.5">
              <span className="font-display text-xs text-muted-foreground">Всего: <span className="text-purple font-bold">{prestiges}×</span></span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-4">
            <div className="mt-4 relic-card p-4 mb-4">
              <h3 className="font-display text-white font-bold mb-2 text-lg">Что такое Престиж?</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Сброс прогресса этапов и улучшений в обмен на постоянные реликвии, которые дают множители урона и золота навсегда.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="bg-muted rounded-xl p-3 text-center">
                  <div className="font-display text-gold text-xl font-bold">{stage}</div>
                  <div className="text-xs text-muted-foreground">Текущий этап</div>
                </div>
                <div className="bg-muted rounded-xl p-3 text-center">
                  <div className="font-display text-purple text-xl font-bold">+{Math.floor(1 + stage / 10)}</div>
                  <div className="text-xs text-muted-foreground">Реликвий получишь</div>
                </div>
              </div>
            </div>

            <h3 className="font-display text-white font-bold text-base mb-3">💎 МОИ РЕЛИКВИИ</h3>
            <div className="space-y-2 mb-4">
              {relics.map(r => (
                <div key={r.id} className="relic-card p-3 flex items-center gap-3">
                  <div className="text-3xl">{r.icon}</div>
                  <div className="flex-1">
                    <div className="font-display text-white font-semibold">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.desc}</div>
                  </div>
                  <div className="bg-purple-800/40 border border-purple-500/40 rounded-xl px-3 py-1.5 text-center">
                    <div className="font-display text-purple font-bold text-lg leading-none">{r.owned}</div>
                    <div className="text-[10px] text-muted-foreground">шт.</div>
                  </div>
                </div>
              ))}
            </div>

            {!prestigeConfirm ? (
              <button
                onClick={() => setPrestigeConfirm(true)}
                className={`w-full py-4 rounded-2xl font-display text-xl font-bold tracking-wider transition-all active:scale-98 ${stage >= 5 ? "purple-button animate-glow-pulse" : "bg-muted text-muted-foreground cursor-not-allowed"}`}
                disabled={stage < 5}
              >
                {stage < 5 ? `🔒 Нужен 5 этап (${stage}/5)` : "🌟 СОВЕРШИТЬ ПРЕСТИЖ"}
              </button>
            ) : (
              <div className="relic-card p-4 animate-prestige-burst">
                <p className="font-display text-white text-center font-bold text-lg mb-1">Ты уверен?</p>
                <p className="text-muted-foreground text-sm text-center mb-4">Весь прогресс будет сброшен, но ты получишь мощные реликвии!</p>
                <div className="flex gap-3">
                  <button onClick={() => setPrestigeConfirm(false)} className="flex-1 py-3 bg-muted rounded-xl font-display font-bold text-white">Отмена</button>
                  <button onClick={doPrestige} className="flex-1 py-3 purple-button rounded-xl font-display font-bold">Да, поехали!</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== STATS ===== */}
      {screen === "stats" && (
        <div className="flex flex-col h-full animate-screen-slide-in">
          <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border">
            <button onClick={() => setScreen("game")} className="w-9 h-9 bg-muted rounded-xl flex items-center justify-center">
              <Icon name="ArrowLeft" size={18} className="text-white" />
            </button>
            <h1 className="font-display text-2xl font-bold text-white tracking-wide">📊 СТАТИСТИКА</h1>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-4">
            <div className="grid grid-cols-2 gap-3 mt-4 mb-4">
              {[
                { label: "Этап", value: stage, icon: "🗺️", color: "text-gold" },
                { label: "Престижи", value: prestiges, icon: "🌟", color: "text-purple" },
                { label: "Всего тапов", value: formatNumber(totalTaps), icon: "👆", color: "text-cyan" },
                { label: "Всего золота", value: formatNumber(totalGold), icon: "🪙", color: "text-gold" },
                { label: "Урон тапа", value: formatNumber(tapDamage * upgradeMultiplier), icon: "⚔️", color: "text-crimson" },
                { label: "Авто DPS", value: formatNumber(passiveDps) + "/с", icon: "⚡", color: "text-emerald" },
              ].map(s => (
                <div key={s.label} className="game-card p-3 text-center">
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <div className={`font-display font-bold text-xl ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            <h3 className="font-display text-white font-bold text-base mb-3">🏆 ДОСТИЖЕНИЯ</h3>
            <div className="space-y-2">
              {achievements.map(a => (
                <div key={a.id} className={`game-card p-3 flex items-center gap-3 transition-all ${a.unlocked ? "border-gold/40" : "opacity-60"}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${a.unlocked ? "bg-gold/20" : "bg-muted"}`}>
                    {a.icon}
                  </div>
                  <div className="flex-1">
                    <div className={`font-display font-bold text-sm ${a.unlocked ? "text-gold" : "text-muted-foreground"}`}>{a.name}</div>
                    <div className="text-xs text-muted-foreground">{a.desc}</div>
                  </div>
                  {a.unlocked && <span className="text-emerald text-lg">✓</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== INVENTORY ===== */}
      {screen === "inventory" && (
        <div className="flex flex-col h-full animate-screen-slide-in">
          <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border">
            <button onClick={() => setScreen("game")} className="w-9 h-9 bg-muted rounded-xl flex items-center justify-center">
              <Icon name="ArrowLeft" size={18} className="text-white" />
            </button>
            <h1 className="font-display text-2xl font-bold text-white tracking-wide">🎒 ИНВЕНТАРЬ</h1>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-4">
            <p className="text-muted-foreground text-sm mt-3 mb-4">Используй предметы чтобы усилить героя в бою</p>
            <div className="space-y-3">
              {INVENTORY_ITEMS.map(item => {
                const rarityClass = RARITY_COLORS[item.rarity];
                const [colorClass, borderClass] = rarityClass.split(" ");
                return (
                  <div key={item.id} className={`upgrade-card p-3 border ${borderClass}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 bg-muted border ${borderClass}`}>
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`font-display font-bold text-sm ${colorClass}`}>{item.name}</span>
                          <span className={`text-[10px] font-display px-2 py-0.5 rounded-full border ${rarityClass}`}>
                            {item.rarity === "common" ? "Обыч" : item.rarity === "rare" ? "Ред" : item.rarity === "epic" ? "Эпик" : "Лег"}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-xs mt-0.5">{item.desc}</p>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-display text-xs text-muted-foreground">×{item.qty}</span>
                        <button
                          onClick={() => showNotification(`✨ ${item.name} использован!`)}
                          className="px-3 py-1.5 bg-accent/80 text-white rounded-xl font-display text-xs font-bold active:scale-95 transition-all"
                        >
                          Исп.
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===== SETTINGS ===== */}
      {screen === "settings" && (
        <div className="flex flex-col h-full animate-screen-slide-in">
          <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-border">
            <button onClick={() => setScreen("game")} className="w-9 h-9 bg-muted rounded-xl flex items-center justify-center">
              <Icon name="ArrowLeft" size={18} className="text-white" />
            </button>
            <h1 className="font-display text-2xl font-bold text-white tracking-wide">⚙️ НАСТРОЙКИ</h1>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-4">
            <div className="mt-4 game-card p-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-2xl">
                  ⚔️
                </div>
                <div>
                  <div className="font-display text-white font-bold text-lg">Герой Легенд</div>
                  <div className="text-muted-foreground text-sm">Этап {stage} • {prestiges} престижей</div>
                </div>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {[
                { label: "Звук", desc: "Звуковые эффекты", icon: "🔊", value: soundOn, setter: setSoundOn },
                { label: "Графика", desc: "Частицы и анимации", icon: "✨", value: graphicsOn, setter: setGraphicsOn },
                { label: "Вибрация", desc: "Тактильный отклик", icon: "📳", value: vibrationOn, setter: setVibrationOn },
              ].map(s => (
                <div key={s.label} className="game-card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{s.icon}</span>
                    <div>
                      <div className="font-display text-white font-semibold">{s.label}</div>
                      <div className="text-xs text-muted-foreground">{s.desc}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => s.setter(!s.value)}
                    className={`w-14 h-7 rounded-full transition-all relative ${s.value ? "bg-gold" : "bg-muted"}`}
                  >
                    <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all ${s.value ? "left-7" : "left-0.5"}`} />
                  </button>
                </div>
              ))}
            </div>

            <div className="game-card p-4 mb-3">
              <h3 className="font-display text-white font-bold mb-3">📈 ПРОГРЕСС</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Улучшений куплено</span>
                  <span className="font-display text-gold font-bold">{upgrades.reduce((a, u) => a + u.level, 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Реликвий всего</span>
                  <span className="font-display text-purple font-bold">{relics.reduce((a, r) => a + r.owned, 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Достижений</span>
                  <span className="font-display text-cyan font-bold">{achievements.filter(a => a.unlocked).length}/{achievements.length}</span>
                </div>
              </div>
            </div>

            <div className="game-card p-3">
              <p className="text-xs text-muted-foreground text-center">Версия 0.1.0 Alpha • Tap Legends</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}