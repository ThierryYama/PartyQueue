import type { Metadata } from 'next';
import { LibraryScreen } from '../../features/library/library-screen';

export const metadata: Metadata = { title: 'Sua biblioteca' };

export default function LibraryPage() {
  return <LibraryScreen />;
}
