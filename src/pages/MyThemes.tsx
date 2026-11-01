import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PromptCard from '../components/PromptCard';
import { generate } from '../lib/generator';
import { hashString, uid } from '../lib/rng';
import { usePageTitle } from '../lib/usePageTitle';
import { useStore } from '../store/store';
import type { Prompt, ThemeData } from '../types';

interface Draft {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
  subjects: string;
  adjectives: string;
  actions: string;
  props: string;
  settings: string;
  premade: string;
}

const EMPTY: Draft = { id: '', name: '', emoji: '✨', blurb: '', subjects: '', adjectives: '', actions: '', props: '', settings: '', premade: '' };

const EXAMPLE: Draft = {
  id: '',
  name: 'Gatos Detetives',
  emoji: '🐈',
  blurb: 'Felinos investigando mistérios domésticos.',
  subjects: 'o gato siamês\na gata de óculos\no filhote curioso\no gato de rua',
  adjectives: 'desconfiado|desconfiada\nelegante\nsonolento|sonolenta',
  actions: 'seguindo pegadas de lama\nespiando atrás da cortina\nderrubando um copo de propósito',
  props: 'com uma lupa\ncom um chapéu de detetive\ncom uma pista na boca',
  settings: 'numa sala bagunçada\nno telhado ao anoitecer\nnuma cozinha escura',
  premade: 'O gato que descobre quem esvaziou o pote de ração.\nUma reunião secreta de gatos no muro à meia-noite.',
};

const lines = (s: string) => s.split('\n').map((l) => l.trim()).filter(Boolean);
const toText = (a: string[]) => a.join('\n');

function toTheme(d: Draft): ThemeData {
  return {
    id: d.id || `meu-${uid()}`,
    name: d.name.trim(),
    emoji: d.emoji.trim() || '✨',
    hue: hashString(d.name) % 360,
    blurb: d.blurb.trim(),
    subjects: lines(d.subjects),
    adjectives: lines(d.adjectives),
    actions: lines(d.actions),
    props: lines(d.props),
    settings: lines(d.settings),
    premade: lines(d.premade),
    custom: true,
  };
}

function toDraft(t: ThemeData): Draft {
  return {
    id: t.id,
    name: t.name,
    emoji: t.emoji,
    blurb: t.blurb,
    subjects: toText(t.subjects),
    adjectives: toText(t.adjectives),
    actions: toText(t.actions),
    props: toText(t.props),
    settings: toText(t.settings),
    premade: toText(t.premade),
  };
}

const FIELDS: { key: keyof Draft; label: string; hint: string; ph: string }[] = [
  { key: 'subjects', label: 'Quem (personagens e coisas)', hint: 'Um por linha, com artigo: o / a / os / as.', ph: 'o robô\na bruxa\no dragão cansado' },
  { key: 'adjectives', label: 'Como (adjetivos)', hint: 'Um por linha. Para flexionar, use masculino|feminino.', ph: 'velho|velha\ncorajoso|corajosa\nelegante' },
  { key: 'actions', label: 'Fazendo (ações)', hint: 'Um por linha, no gerúndio.', ph: 'tomando chá\nfugindo de um monstro' },
  { key: 'props', label: 'Detalhes (acessórios)', hint: 'Um por linha. Começam com “com…”, “segurando…”, etc.', ph: 'com um chapéu enorme\nsegurando uma lanterna' },
  { key: 'settings', label: 'Onde (lugares)', hint: 'Um por linha, já com a preposição.', ph: 'numa floresta encantada\nno topo de uma torre' },
  { key: 'premade', label: 'Frases prontas', hint: 'Uma por linha. Frases completas, que não passam pelo sorteio.', ph: 'Um dragão que tem medo de fogo.' },
];

export default function MyThemes() {
  usePageTitle('Meus temas');
  const store = useStore();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [preview, setPreview] = useState<Prompt[]>([]);
  const [error, setError] = useState('');

  const edit = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  const test = () => {
    if (!draft) return;
    const t = toTheme(draft);
    const out: Prompt[] = [];
    for (let i = 0; i < 3; i++) {
      out.push(generate({ themes: [t], mode: 'misto', detail: 'rico', twist: false, palette: false, previous: out[i - 1] }));
    }
    setPreview(out);
  };

  const save = () => {
    if (!draft) return;
    const t = toTheme(draft);
    if (!t.name) return setError('Dê um nome ao tema.');
    if (t.subjects.length + t.premade.length === 0) return setError('Adicione ao menos um “quem” ou uma frase pronta.');
    if (t.subjects.length > 0 && t.settings.length + t.actions.length === 0) return setError('Para frases aleatórias, adicione também alguns “onde” ou “fazendo”.');
    setError('');
    store.saveCustomTheme(t);
    store.toast('Tema salvo ✦');
    setDraft(null);
    setPreview([]);
  };

  const remove = (t: ThemeData) => {
    if (window.confirm(`Apagar o tema “${t.name}”?`)) {
      store.deleteCustomTheme(t.id);
      store.toast('Tema apagado');
    }
  };

  return (
    <div className="w page">
      <div className="page-head up">
        <p className="k">// meus temas</p>
        <h1>
          Crie o seu <em>universo</em>
        </h1>
        <p className="lead">
          Escreva as suas próprias listas de personagens, lugares, ações e frases. O tema entra no gerador, nas sessões cronometradas e na mistura
          com os outros.
        </p>
      </div>

      {!draft ? (
        <>
          <div className="btns">
            <button type="button" className="btn p" onClick={() => { setDraft({ ...EMPTY }); setPreview([]); setError(''); }}>
              ＋ Novo tema
            </button>
            <button type="button" className="btn" onClick={() => { setDraft({ ...EXAMPLE }); setPreview([]); setError(''); }}>
              Começar de um exemplo
            </button>
          </div>

          {store.data.customThemes.length ? (
            <div className="grid" style={{ marginTop: 28 }}>
              {store.data.customThemes.map((t) => (
                <article key={t.id} className="card theme">
                  <div className="ic">
                    <span className="ini" aria-hidden="true">{t.emoji}</span>
                    <span className="badge">seu</span>
                  </div>
                  <h3>{t.name}</h3>
                  <p>{t.blurb || 'Tema personalizado.'}</p>
                  <div className="meta">
                    <span>{t.subjects.length} quem</span>
                    <span>{t.settings.length} onde</span>
                    <span>{t.premade.length} prontas</span>
                  </div>
                  <div className="btns">
                    <button type="button" className="btn p sm" onClick={() => { store.setThemeIds([t.id]); navigate('/'); }}>
                      Usar
                    </button>
                    <button type="button" className="btn sm" onClick={() => { setDraft(toDraft(t)); setPreview([]); setError(''); }}>
                      Editar
                    </button>
                    <button type="button" className="btn sm danger" onClick={() => remove(t)}>
                      Apagar
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty card" style={{ marginTop: 28 }}>
              <p>Você ainda não criou nenhum tema. Que tal começar pelo exemplo “Gatos Detetives” e editar a gosto?</p>
            </div>
          )}
        </>
      ) : (
        <div className="card form-card">
          <div className="row2">
            <label className="field">
              <span className="field-l">Emoji</span>
              <input value={draft.emoji} maxLength={4} onChange={(e) => edit({ emoji: e.target.value })} className="emoji-in" aria-label="Emoji do tema" />
            </label>
            <label className="field grow">
              <span className="field-l">Nome do tema</span>
              <input value={draft.name} maxLength={40} onChange={(e) => edit({ name: e.target.value })} placeholder="Ex.: Gatos Detetives" />
            </label>
          </div>
          <label className="field">
            <span className="field-l">Descrição curta (opcional)</span>
            <input value={draft.blurb} maxLength={140} onChange={(e) => edit({ blurb: e.target.value })} placeholder="Uma linha sobre o clima do tema" />
          </label>

          <div className="fields-grid">
            {FIELDS.map((f) => (
              <label key={f.key} className="field">
                <span className="field-l">{f.label}</span>
                <textarea
                  rows={6}
                  value={draft[f.key]}
                  onChange={(e) => edit({ [f.key]: e.target.value } as Partial<Draft>)}
                  placeholder={f.ph}
                  spellCheck={false}
                />
                <small className="hint">{f.hint}</small>
              </label>
            ))}
          </div>

          {error ? <p className="error" role="alert">{error}</p> : null}

          <div className="btns">
            <button type="button" className="btn p" onClick={save}>
              Salvar tema
            </button>
            <button type="button" className="btn" onClick={test}>
              🎲 Testar 3 ideias
            </button>
            <button type="button" className="btn" onClick={() => { setDraft(null); setPreview([]); setError(''); }}>
              Cancelar
            </button>
          </div>

          {preview.length ? (
            <div className="preview">
              {preview.map((p) => (
                <PromptCard key={p.id} prompt={p} compact />
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
