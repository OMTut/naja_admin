/**
 * Shared Mantine component style objects.
 * Uses CSS variables defined in index.css so colour changes
 * only need to happen in one place.
 */

import type { CSSProperties } from 'react';

export const inputStyles = {
  input: {
    backgroundColor: 'var(--naja-bg)',
    color: 'var(--naja-text)',
    borderColor: 'var(--naja-teal-dark)',
  },
  label: {
    color: 'var(--naja-gold)',
    fontWeight: '600',
    fontSize: '16px',
  },
  description: {
    color: 'var(--naja-teal)',
    fontSize: '16px',
  },
};

export const modalStyles = {
  content: {
    backgroundColor: 'var(--naja-sidebar)',
    border: '1px solid rgba(204, 172, 49, 0.3)',
  },
  header: {
    backgroundColor: 'var(--naja-sidebar)',
    borderBottom: '1px solid rgba(204, 172, 49, 0.2)',
  },
  close: {
    color: 'var(--naja-gold)',
  },
};

export const menuStyles = {
  dropdown: { backgroundColor: 'var(--naja-sidebar)', border: '1px solid rgba(204, 172, 49, 0.3)', padding: '4px' },
  item:     { color: 'var(--naja-text)', fontFamily: "'Vollkorn', serif", fontSize: '14px' },
};

export const drawerClassNames = {
  content: 'naja-drawer-content',
  header:  'naja-drawer-header',
  title:   'naja-drawer-title',
  close:   'naja-drawer-close',
};

export const displayRows = {
  /** Bottom border on the header Group */
  header: {
    borderBottom: '1px solid rgba(204,172,49,0.3)',
  },
  /** Alternating background + radius for each row Box */
  row: (idx: number): CSSProperties => ({
    backgroundColor: idx % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent',
    borderRadius: 4,
  }),
};

export interface ColumnDef {
  label: string;
  flex?: number;
  width?: number;
}

export const blueprintCols = {
  personal: [
    { label: 'Blueprint',   flex: 4 },
    { label: 'Category',    flex: 2 },
    { label: 'Ingredients', flex: 1 },
  ] as ColumnDef[],
  org: [
    { label: 'Blueprint', flex: 4 },
    { label: 'Category',  flex: 2 },
    { label: 'Members',   flex: 1 },
  ] as ColumnDef[],
  catalog: [
    { label: 'Blueprint', flex: 4 },
    { label: 'Category',  flex: 2 },
  ] as ColumnDef[],
};

export const tableStyles = {
  th: {
    color: 'var(--naja-gold)',
    fontWeight: '700',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    fontSize: '13px',
    borderBottom: '1px solid rgba(204, 172, 49, 0.3)',
  },
  td: {
    color: 'var(--naja-text)',
  },
};
