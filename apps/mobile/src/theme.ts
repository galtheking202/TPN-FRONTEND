export const COLORS = {
  bg:            '#FAF7F2',
  surface:       '#FFFFFF',
  surfaceRaised: '#FFFDF9',
  surfaceAlt:    '#F3EFE7',
  border:        '#E8E2D6',
  borderStrong:  '#D4CDBD',
  primary:       '#6B85C7',
  primaryHover:  '#5269A8',
  primarySoft:   '#D8E0F0',
  breaking:      '#C46A5E',
  dangerSoft:    '#F5D9D2',
  warning:       '#C99A4C',
  warningSoft:   '#F2E4C8',
  success:       '#6B9B7B',
  text:          '#1F1B16',
  textSub:       '#5C5648',
  textMuted:     '#8A826F',
  accent:        '#8A7AB0',
};

export const CATEGORY_COLORS: Record<string, { solid: string; soft: string; ink: string }> = {
  Politics:               { solid: '#C06B4A', soft: '#F3DDD0', ink: '#8A3D1E' },
  Economy:                { solid: '#5A9A8A', soft: '#DCEDE8', ink: '#36695C' },
  Health:                 { solid: '#C4798A', soft: '#F1DAE0', ink: '#8B4757' },
  Technology:             { solid: '#6B85C7', soft: '#D8E0F0', ink: '#3F5490' },
  Environment:            { solid: '#7BA381', soft: '#DDE9DE', ink: '#466B4D' },
  'Defence and Security': { solid: '#8A7AB0', soft: '#E4DEEC', ink: '#564479' },
  Sports:                 { solid: '#C99A4C', soft: '#F2E4C8', ink: '#8A6824' },
};

export const DEFAULT_CAT = { solid: '#6B85C7', soft: '#D8E0F0', ink: '#3F5490' };
