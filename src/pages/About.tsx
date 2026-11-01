import { Link } from 'react-router-dom';
import Sparkle from '../components/Sparkle';
import { usePageTitle } from '../lib/usePageTitle';

const SHORTCUTS: [string, string][] = [
  ['Espaço / Enter', 'gerar uma nova ideia'],
  ['←  →', 'voltar e avançar no histórico'],
  ['S', 'salvar ou remover dos favoritos'],
  ['Ctrl + Z', 'desfazer no quadro de rabiscos'],
  ['Ctrl + Shift + Z', 'refazer'],
  ['E', 'alternar lápis e borracha'],
  ['[  ]', 'diminuir ou aumentar a espessura'],
];

export default function About() {
  usePageTitle('Sobre');
  return (
    <div className="w page prose-page">
      <div className="page-head up">
        <p className="k">// sobre</p>
        <h1>
          Sobre o <em>SketchQuest</em>
        </h1>
        <p className="lead">
          <Sparkle size={14} /> Um gerador de ideias para quem quer desenhar e não sabe o quê.
        </p>
      </div>

      <div className="two">
        <div className="card">
          <h3>O que tem aqui</h3>
          <ul className="plain">
            <li>Frases aleatórias montadas por partes, com concordância de gênero, e frases prontas escritas à mão.</li>
            <li>15 temas, mistura de temas e temas criados por você.</li>
            <li>Travar partes da frase, sortear só uma delas, voltar para a ideia anterior.</li>
            <li>Desafios extras, paletas de cores e uma ideia do dia igual para todo mundo.</li>
            <li>Sessões cronometradas, quadro de rabiscos, favoritos com notas e progresso com sequência de dias.</li>
          </ul>
        </div>
        <div className="card">
          <h3>Atalhos</h3>
          <dl className="keys">
            {SHORTCUTS.map(([k, v]) => (
              <div key={k}>
                <dt>
                  <span className="kbd">{k}</span>
                </dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="two">
        <div className="card">
          <h3>Privacidade</h3>
          <p className="muted">
            Não há conta nem servidor. Favoritos, histórico, estatísticas e temas próprios ficam guardados no seu navegador (localStorage).
            Limpar os dados do site apaga tudo, então use o backup em <Link to="/salvos">Salvos</Link> de vez em quando.
          </p>
        </div>
        <div className="card">
          <h3>Créditos</h3>
          <p className="muted">
            Criado por Ícaro Pinto Lira, na mesma família visual do <a href="https://icaropintolira.vercel.app" target="_blank" rel="noopener noreferrer">portfólio Hiraku</a>.
            Inspirado em apps de sugestões de desenho como o “What to Draw?”, mas com todo o conteúdo, código e identidade escritos do zero.
          </p>
        </div>
      </div>
    </div>
  );
}
