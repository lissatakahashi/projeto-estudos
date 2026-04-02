import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Badge, UserBadge } from '../../domain/badges/types/badge';
import BadgesPanel from './BadgesPanel';

describe('BadgesPanel', () => {
  it('renders earned and locked badges correctly', () => {
    const badges: Badge[] = [
      {
        badgeId: 'badge-1',
        slug: 'first_focus_session',
        name: 'Primeiro Foco',
        description: 'Conclua sua primeira sessão de foco válida.',
        category: 'study' as const,
        icon: 'timer',
        isActive: true,
        createdAt: '2026-04-01T00:00:00.000Z',
        updatedAt: '2026-04-01T00:00:00.000Z',
      },
      {
        badgeId: 'badge-2',
        slug: 'first_shop_purchase',
        name: 'Primeira Compra',
        description: 'Realize sua primeira compra na loja.',
        category: 'economy',
        icon: 'shopping_bag',
        isActive: true,
        createdAt: '2026-04-01T00:00:00.000Z',
        updatedAt: '2026-04-01T00:00:00.000Z',
      },
    ];

    const userBadges: UserBadge[] = [
      {
        id: 'user-badge-1',
        userId: 'user-1',
        badgeId: 'badge-1',
        earnedAt: '2026-04-01T00:00:00.000Z',
        createdAt: '2026-04-01T00:00:00.000Z',
        badge: badges[0],
      },
    ];

    render(<BadgesPanel badges={badges} userBadges={userBadges} loading={false} />);

    expect(screen.getByText('Conquistas')).toBeInTheDocument();
    expect(screen.getByText('Primeiro Foco')).toBeInTheDocument();
    expect(screen.getByText('Primeira Compra')).toBeInTheDocument();
    expect(screen.getByText('Bloqueada')).toBeInTheDocument();
  });
});
