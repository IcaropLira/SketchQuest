import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import About from './pages/About';
import Generator from './pages/Generator';
import MyThemes from './pages/MyThemes';
import Palettes from './pages/Palettes';
import Progress from './pages/Progress';
import Saved from './pages/Saved';
import Session from './pages/Session';
import Sketchpad from './pages/Sketchpad';
import Themes from './pages/Themes';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Generator />} />
        <Route path="temas" element={<Themes />} />
        <Route path="sessao" element={<Session />} />
        <Route path="rabiscar" element={<Sketchpad />} />
        <Route path="paletas" element={<Palettes />} />
        <Route path="salvos" element={<Saved />} />
        <Route path="progresso" element={<Progress />} />
        <Route path="meus-temas" element={<MyThemes />} />
        <Route path="sobre" element={<About />} />
        <Route path="*" element={<Generator />} />
      </Route>
    </Routes>
  );
}
