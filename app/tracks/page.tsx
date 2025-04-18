import TracksGrid from '../components/TracksGrid';

export const metadata = {
  title: 'Tracks | ProdAI Beats',
  description: 'Browse and listen to AI-generated beats and tracks',
};

export default function TracksPage() {
  return (
    <main className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Tracks</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Browse and listen to our collection of AI-generated beats and tracks
        </p>
      </div>
      
      <TracksGrid />
    </main>
  );
} 