'use client';

import { useState } from 'react';
import {
  UPGRADE_DEFS,
  BRANCHES,
  BRANCH_COLORS,
  BRANCH_LABELS,
  getBranchUpgrades,
  canPurchaseUpgrade,
} from '@/lib/roguelike-upgrades';
import type { UpgradeId, UpgradeBranch, UpgradeDef } from '@/lib/roguelike-upgrades';

interface Props {
  upgrades: UpgradeId[];
  clearance: number;
  onPurchase: (id: UpgradeId) => Promise<void>;
  onClose: () => void;
}

type UpgradeStatus = 'owned' | 'affordable' | 'locked' | 'requires-prereq' | 'too-expensive';

function getUpgradeStatus(
  def: UpgradeDef,
  owned: UpgradeId[],
  clearance: number,
): UpgradeStatus {
  if (owned.includes(def.id)) return 'owned';

  const check = canPurchaseUpgrade(def.id, owned, clearance);
  if (check.canBuy) return 'affordable';

  if (check.reason?.startsWith('Requires')) return 'requires-prereq';
  if (check.reason === 'Insufficient Clearance') return 'too-expensive';
  return 'locked';
}

function statusBorderColor(status: UpgradeStatus, branchColor: string): string {
  switch (status) {
    case 'owned': return branchColor;
    case 'affordable': return branchColor;
    case 'too-expensive': return 'color-mix(in srgb, var(--c-muted) 40%, transparent)';
    default: return 'color-mix(in srgb, var(--c-muted) 20%, transparent)';
  }
}

function statusOpacity(status: UpgradeStatus): number {
  switch (status) {
    case 'owned': return 1;
    case 'affordable': return 1;
    case 'too-expensive': return 0.5;
    default: return 0.3;
  }
}

export function RoguelikeUpgrades({ upgrades, clearance, onPurchase, onClose }: Props) {
  const [purchasing, setPurchasing] = useState<UpgradeId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<UpgradeId | null>(null);

  async function handlePurchase(id: UpgradeId) {
    if (purchasing) return;
    setError(null);
    setPurchasing(id);
    try {
      await onPurchase(id);
      setConfirmId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Purchase failed');
    } finally {
      setPurchasing(null);
    }
  }

  function handleCardClick(def: UpgradeDef, status: UpgradeStatus) {
    if (status === 'owned' || status === 'locked' || status === 'requires-prereq') return;
    if (confirmId === def.id) {
      handlePurchase(def.id);
    } else {
      setConfirmId(def.id);
      setError(null);
    }
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl mx-auto p-4 font-mono anim-fade-in-up">
      {/* Header */}
      <div className="text-center space-y-1">
        <h2
          className="text-xl font-black tracking-widest"
          style={{ color: '#ff3333', textShadow: '0 0 8px rgba(255,51,51,0.3)' }}
        >
          PERMANENT UPGRADES
        </h2>
        <p className="text-xs text-[var(--c-muted)] tracking-widest">
          SPEND CLEARANCE TO UNLOCK PERMANENT BONUSES
        </p>
      </div>

      {/* Clearance balance */}
      <div className="term-border p-3 text-center">
        <span className="text-xs text-[var(--c-muted)] tracking-widest mr-2">CLEARANCE:</span>
        <span
          className="text-xl font-bold tabular-nums"
          style={{ color: '#00d4ff', textShadow: '0 0 6px rgba(0,212,255,0.3)' }}
        >
          {clearance}
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="text-center text-xs text-[#ff3333] tracking-wide">
          {error}
        </div>
      )}

      {/* Upgrade tree — 3 columns on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {BRANCHES.map((branch) => (
          <BranchColumn
            key={branch}
            branch={branch}
            upgrades={upgrades}
            clearance={clearance}
            confirmId={confirmId}
            purchasing={purchasing}
            onCardClick={handleCardClick}
          />
        ))}
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className="w-full py-3 term-border text-sm tracking-widest text-[var(--c-muted)] hover:text-[var(--c-secondary)] active:scale-95 transition-all mt-2"
      >
        [ CLOSE ]
      </button>
    </div>
  );
}

// ── Branch Column ──

function BranchColumn({
  branch,
  upgrades,
  clearance,
  confirmId,
  purchasing,
  onCardClick,
}: {
  branch: UpgradeBranch;
  upgrades: UpgradeId[];
  clearance: number;
  confirmId: UpgradeId | null;
  purchasing: UpgradeId | null;
  onCardClick: (def: UpgradeDef, status: UpgradeStatus) => void;
}) {
  const branchColor = BRANCH_COLORS[branch];
  const branchLabel = BRANCH_LABELS[branch];
  const branchUpgrades = getBranchUpgrades(branch);

  // Display tier 4 at top, tier 1 at bottom
  const reversed = [...branchUpgrades].reverse();

  return (
    <div className="flex flex-col gap-2">
      {/* Branch header */}
      <div className="text-center py-1.5">
        <span
          className="text-xs font-bold tracking-[0.2em]"
          style={{ color: branchColor }}
        >
          {branchLabel}
        </span>
      </div>

      {/* Upgrade cards, tier 4 to tier 1 */}
      {reversed.map((def) => {
        const status = getUpgradeStatus(def, upgrades, clearance);
        const isConfirming = confirmId === def.id;
        const isPurchasing = purchasing === def.id;

        return (
          <UpgradeCard
            key={def.id}
            def={def}
            status={status}
            branchColor={branchColor}
            isConfirming={isConfirming}
            isPurchasing={isPurchasing}
            ownedUpgrades={upgrades}
            onClick={() => onCardClick(def, status)}
          />
        );
      })}
    </div>
  );
}

// ── Single Upgrade Card ──

function UpgradeCard({
  def,
  status,
  branchColor,
  isConfirming,
  isPurchasing,
  ownedUpgrades,
  onClick,
}: {
  def: UpgradeDef;
  status: UpgradeStatus;
  branchColor: string;
  isConfirming: boolean;
  isPurchasing: boolean;
  ownedUpgrades: UpgradeId[];
  onClick: () => void;
}) {
  const isClickable = status === 'affordable' || status === 'too-expensive';
  const borderColor = statusBorderColor(status, branchColor);
  const opacity = statusOpacity(status);

  // Prereq hint — use actual owned upgrades to show correct missing prereq
  const check = status === 'requires-prereq'
    ? canPurchaseUpgrade(def.id, ownedUpgrades, 999)
    : null;

  return (
    <button
      onClick={isClickable ? onClick : undefined}
      disabled={!isClickable || isPurchasing}
      className={`
        term-border p-2.5 text-left transition-all w-full
        ${status === 'owned' ? 'glow-border' : ''}
        ${isClickable ? 'cursor-pointer hover:bg-[color-mix(in_srgb,var(--c-primary)_5%,transparent)] active:scale-[0.98]' : 'cursor-default'}
        ${isPurchasing ? 'animate-pulse' : ''}
      `}
      style={{
        borderColor,
        opacity,
        boxShadow: status === 'owned' ? `0 0 8px ${branchColor}33, inset 0 0 8px ${branchColor}11` : undefined,
        background: status === 'owned'
          ? `color-mix(in srgb, ${branchColor} 6%, transparent)`
          : isConfirming
          ? 'color-mix(in srgb, var(--c-primary) 8%, transparent)'
          : undefined,
      }}
    >
      {/* Name + tier */}
      <div className="flex items-center justify-between gap-1">
        <span
          className="text-xs font-bold tracking-wider"
          style={{ color: status === 'owned' ? branchColor : 'var(--c-secondary)' }}
        >
          {def.name}
        </span>
        <span className="text-[10px] text-[var(--c-muted)]">T{def.tier}</span>
      </div>

      {/* Description */}
      <p className="text-[10px] text-[var(--c-muted)] leading-snug mt-0.5">
        {def.description}
      </p>

      {/* Status line */}
      <div className="flex items-center justify-between mt-1.5">
        {status === 'owned' ? (
          <span className="text-[10px] font-bold tracking-wider" style={{ color: branchColor }}>
            OWNED
          </span>
        ) : status === 'requires-prereq' ? (
          <span className="text-[10px] text-[var(--c-muted)] tracking-wider">
            {check?.reason ?? 'LOCKED'}
          </span>
        ) : isConfirming ? (
          <span className="text-[10px] font-bold tracking-wider text-[var(--c-primary)]">
            {isPurchasing ? 'PURCHASING...' : 'TAP TO CONFIRM'}
          </span>
        ) : (
          <span
            className="text-[10px] tabular-nums tracking-wider"
            style={{ color: status === 'affordable' ? '#00d4ff' : 'var(--c-muted)' }}
          >
            {def.cost} CLEARANCE
          </span>
        )}

        {/* Cost badge (when not confirming) */}
        {status !== 'owned' && !isConfirming && (
          <span
            className="text-[10px] tabular-nums"
            style={{ color: status === 'affordable' ? '#00d4ff' : 'var(--c-muted)' }}
          >
            {status === 'affordable' ? 'BUY' : ''}
          </span>
        )}
      </div>
    </button>
  );
}
