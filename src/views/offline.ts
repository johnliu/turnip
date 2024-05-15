import { renderUnexpectedError } from '@/views/base';

export function renderOffline() {
  return renderUnexpectedError('Turnip is currently offline.');
}
