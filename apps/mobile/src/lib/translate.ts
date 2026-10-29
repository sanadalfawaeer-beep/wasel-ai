import { translate, type TKey } from '@/i18n';
import type { Lang } from '@/types';

export { formatDistance, formatDuration } from '@/i18n';

export function t(
  lang: Lang,
  key: TKey,
  vars?: Record<string, string | number>,
): string {
  return translate(lang, key, vars);
}
