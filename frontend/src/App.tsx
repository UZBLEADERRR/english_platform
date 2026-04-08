import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import Home from './pages/Home';
import Apps from './pages/Apps';
import Reels from './pages/Reels';
import AiChat from './pages/AiChat';
import Profile from './pages/Profile';
import CategoryView from './pages/CategoryView';
import LevelView from './pages/LevelView';
import LessonView from './pages/LessonView';
import Movies from './pages/Movies';
import MovieDetail from './pages/MovieDetail';
import Comics from './pages/Comics';
import ComicReader from './pages/ComicReader';
import GrammarChecker from './pages/GrammarChecker';
import Tips from './pages/Tips';
import Pricing from './pages/Pricing';
import Songs from './pages/Songs';
import Library from './pages/Library';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="apps" element={<Apps />} />
          <Route path="reels" element={<Reels />} />
          <Route path="ai-chat" element={<AiChat />} />
          <Route path="profile" element={<Profile />} />
          <Route path="category/:id" element={<CategoryView />} />
          <Route path="level/:categoryId/:levelId" element={<LevelView />} />
          <Route path="lesson/:topicId" element={<LessonView />} />
          <Route path="movies" element={<Movies />} />
          <Route path="movie/:id" element={<MovieDetail />} />
          <Route path="comics" element={<Comics />} />
          <Route path="comic/:id" element={<ComicReader />} />
          <Route path="grammar-checker" element={<GrammarChecker />} />
          <Route path="tips" element={<Tips />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="songs" element={<Songs />} />
          <Route path="library" element={<Library />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
