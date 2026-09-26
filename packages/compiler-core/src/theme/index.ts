export * from './types';
export * from './default';
export * from './clean';
export * from './dark';

import { DEFAULT_THEME } from './default';
import { CLEAN_THEME } from './clean';
import { DARK_THEME } from './dark';

export const THEMES = {
  default: DEFAULT_THEME,
  clean: CLEAN_THEME,
  dark: DARK_THEME,
};

