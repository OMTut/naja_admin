/**
 * Shared Mantine component style objects.
 * Uses CSS variables defined in index.css so colour changes
 * only need to happen in one place.
 */

export const inputStyles = {
  input: {
    backgroundColor: 'var(--naja-sidebar)',
    color: 'var(--naja-text)',
    borderColor: 'rgba(204, 172, 49, 0.3)',
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
