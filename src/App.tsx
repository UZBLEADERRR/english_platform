/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import Home from './pages/Home';
import Artifacts from './pages/Artifacts';
import Reels from './pages/Reels';
import VirtualTeacher from './pages/VirtualTeacher';
import Profile from './pages/Profile';
import CategoryView from './pages/CategoryView';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="artifacts" element={<Artifacts />} />
          <Route path="reels" element={<Reels />} />
          <Route path="virtual-teacher" element={<VirtualTeacher />} />
          <Route path="profile" element={<Profile />} />
          <Route path="category/:id" element={<CategoryView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
