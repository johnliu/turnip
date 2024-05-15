import { migrateAll } from '@/scripts/migrations/v1-migration';

export async function migration(migration: string) {
  switch (migration) {
    case 'v1-migration':
      return migrateAll();
    default:
      console.log('Unknown migration');
  }
}
