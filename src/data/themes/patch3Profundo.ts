import type { ThemeData } from '../../types';

/** Conteúdo adicional do Patch 3. Mantém os temas originais e evita duplicatas. */
const PATCH3: Record<string, Partial<Pick<ThemeData, 'subjects' | 'actions' | 'settings' | 'props' | 'premade'>>> = {
  marvel: {
    subjects: ['Kate Bishop', 'America Chavez', 'Shang-Chi', 'Coração de Ferro', 'Cavaleiro Negro', 'Clea', 'Wiccano', 'Célere', 'Kamala Khan', 'Monica Rambeau', 'Manto e Adaga', 'Mulher-Hulk', 'Valquíria', 'Agatha Harkness', 'Quasar', 'Namora', 'Sersi', 'Karnak', 'Medusa dos Inumanos', 'Molly Hayes', 'Doutor Vodu', 'Manto de energia cósmica', 'um agente da SWORD', 'um inventor de Wakanda'],
    actions: ['investigando uma anomalia no multiverso', 'ensinando um aprendiz a controlar poderes', 'reconstruindo um bairro após uma batalha', 'fazendo uma visita diplomática a outro planeta', 'resolvendo um mistério sem usar superpoderes'],
    settings: ['numa estação da SWORD', 'numa rua de Hell’s Kitchen', 'num laboratório de Wakanda', 'num mercado intergaláctico', 'numa dimensão feita de memórias'],
    props: ['com um comunicador interdimensional', 'com um protótipo de traje', 'com um artefato kree', 'com um mapa do multiverso'],
    premade: ['Uma equipe improvável precisa organizar uma festa surpresa para seu integrante mais sério.', 'Desenhe um herói secundário em seu primeiro dia de trabalho numa equipe cósmica.', 'Um portal abre para uma realidade em que todos os vilões escolheram carreiras comuns.'],
  },
  dc: {
    subjects: ['Jessica Cruz', 'John Stewart', 'Guy Gardner', 'Vixen', 'Senhor Incrível', 'Questão', 'Caçadora', 'Cassandra Cain', 'Stephanie Brown', 'Superboy', 'Impulse', 'Jon Kent', 'Mera', 'Orion', 'Big Barda', 'Metamorfo', 'Animal Man', 'Etrigan', 'Doutor Destino', 'Senhor Milagre', 'Onda de Calor', 'Pistoleiro', 'Amanda Waller', 'um membro da Legião dos Super-Heróis'],
    actions: ['investigando um caso que atravessa gerações', 'treinando uma nova equipe de jovens heróis', 'protegendo uma cidade durante um blecaute', 'negociando uma trégua entre mundos', 'tentando ter um dia de folga em Gotham'],
    settings: ['numa sala de evidências da Batcaverna', 'numa estação espacial da Tropa dos Lanternas', 'numa rua de Metrópolis ao amanhecer', 'numa feira de ciências em Central City', 'numa dimensão mágica escondida'],
    props: ['com um anel energético rachado', 'com um arquivo de casos antigos', 'com um bumerangue experimental', 'com um artefato de Apokolips'],
    premade: ['Desenhe a equipe de apoio de um herói organizando a base depois de uma missão.', 'Um vilão tenta abrir uma pequena empresa em Metrópolis.', 'Crie um pôster de mistério sobrenatural ambientado em Gotham.'],
  },
  fnaf: {
    subjects: ['Ballora no palco vazio', 'Funtime Foxy sob holofotes', 'Lefty numa sala de armazenamento', 'Music Man numa sala de máquinas', 'The Puppet diante de uma caixa musical', 'Sun e Moon trocando de turno', 'Glamrock Bonnie numa sala de ensaio', 'DJ Music Man num corredor gigante', 'um técnico noturno', 'um animatrônico de parque abandonado', 'um mascote esquecido numa vitrine'],
    actions: ['tentando consertar uma caixa musical', 'seguindo pegadas de óleo pelo corredor', 'ensaiando uma apresentação para ninguém', 'protegendo uma criança perdida', 'reagindo a uma câmera que voltou a funcionar'],
    settings: ['numa sala de manutenção coberta de desenhos', 'num palco inundado por luz vermelha', 'numa pizzaria fechada há décadas', 'num depósito de fantasias', 'num corredor onde as luzes piscam em sequência'],
    props: ['com uma etiqueta de manutenção antiga', 'com um microfone sem fio', 'com uma peça de endoesqueleto', 'com um desenho infantil amassado'],
    premade: ['Desenhe um animatrônico visto apenas pelo reflexo de uma janela.', 'Um turno noturno fica estranhamente tranquilo — até a música começar.', 'Crie um novo animatrônico com tema de circo e uma história inquietante.'],
  },
  jogos: {
    subjects: ['um cavaleiro de Hallownest', 'um viajante de Hyrule', 'um ouriço supersônico', 'um construtor de blocos', 'um explorador de Terraria', 'um habitante de Stardew Valley', 'um guerreiro de Dark Souls', 'um protagonista de roguelike', 'um detetive de visual novel', 'um piloto de corrida arcade', 'um mago de RPG tático', 'um chefe secreto de jogo indie', 'um mascote de plataforma retrô', 'um mercador que vende itens amaldiçoados'],
    actions: ['descobrindo uma área secreta atrás de uma cachoeira', 'criando um item lendário com materiais improváveis', 'enfrentando um chefe sem atacar', 'construindo uma casa em terreno perigoso', 'ajudando um NPC numa missão opcional'],
    settings: ['numa cidade pixel art sob chuva', 'numa masmorra com gravidade invertida', 'numa vila aconchegante entre montanhas', 'numa arena de chefe esquecida', 'num mapa de jogo que está se desfazendo'],
    props: ['com um inventário cheio demais', 'com um mapa parcialmente queimado', 'com uma ferramenta de durabilidade quase zero', 'com uma poção de efeito desconhecido'],
    premade: ['Desenhe a tela de seleção de personagem de um jogo que não existe.', 'Um NPC percebe que o jogador nunca escolhe suas opções de diálogo.', 'Crie uma evolução alternativa para uma criatura de jogo inventada.'],
  },
  cartoons: {
    subjects: ['um detetive adolescente e seu cão medroso', 'um gnomo que trabalha num escritório', 'um robô com crise de identidade', 'um vilão que só quer jardinagem', 'um pato aventureiro', 'um fantasma que teme lugares escuros', 'um monstro tímido numa escola', 'um alienígena tentando ser entregador', 'um mascote de cereal que ganhou vida'],
    actions: ['tentando seguir instruções absurdamente literais', 'participando de uma competição sem sentido', 'escondendo uma invenção que saiu do controle', 'transformando uma tarefa doméstica em aventura épica', 'tentando parecer normal numa reunião'],
    settings: ['numa cidade onde as leis da física falham', 'numa escola para criaturas improváveis', 'num supermercado interdimensional', 'num escritório com portas para outras épocas', 'numa casa com cômodos impossíveis'],
    props: ['com um manual de instruções vivo', 'com um controle remoto que altera a realidade', 'com uma maleta que não para de crescer', 'com um troféu de uma competição inventada'],
    premade: ['Crie uma sequência de três quadros em que um pequeno problema vira um desastre cartunesco.', 'Um personagem tenta explicar uma piada para alguém de outra dimensão.', 'Desenhe uma cidade de cartoon construída em torno de um objeto banal gigante.'],
  },
  'slice-life': {
    subjects: ['dois amigos que estudam em silêncio juntos', 'uma pessoa que fotografa nuvens', 'um barista que desenha nos guardanapos', 'uma estudante aprendendo a cozinhar', 'um vizinho que cuida das plantas do prédio', 'uma pessoa que escreve cartas que nunca envia', 'um entregador que conhece todos os gatos da rua'],
    actions: ['dividindo o último pedaço de bolo', 'esperando a chuva passar sob uma marquise', 'trocando livros com bilhetes escondidos', 'decorando um quarto com objetos reaproveitados', 'voltando para casa depois de um dia difícil'],
    settings: ['num ônibus quase vazio ao entardecer', 'numa lavanderia numa noite chuvosa', 'numa varanda cheia de plantas', 'numa livraria de bairro', 'numa cozinha iluminada pela manhã'],
    props: ['com uma câmera descartável', 'com uma sacola de pães quentinhos', 'com um guarda-chuva compartilhado', 'com um bilhete dobrado em quatro'],
    premade: ['Desenhe uma conversa silenciosa entre duas pessoas que se entendem sem falar.', 'Mostre uma semana de vida de um personagem em sete pequenos quadros.', 'Uma pessoa encontra um desenho antigo dentro de um livro emprestado.'],
  },
  'mitologia-grega': {
    subjects: ['Héstia cuidando da chama do lar', 'Perséfone entre romãs e flores', 'Hécate numa encruzilhada', 'Íris atravessando o arco-íris', 'Eos abrindo as portas da aurora', 'Hipnos carregando sonhos', 'Tânatos como figura serena', 'Quíron ensinando um herói', 'Atalanta numa corrida lendária', 'Ariadne com um fio encantado', 'Orfeu tocando para pedras', 'Medusa em um retrato digno e trágico'],
    actions: ['negociando com as Moiras', 'guiando um herói por um labirinto', 'acalmando uma criatura marinha', 'organizando um banquete no Olimpo', 'protegendo uma passagem para o submundo'],
    settings: ['numa encruzilhada sob três luas', 'num jardim de Perséfone', 'numa oficina de Hefesto', 'numa praia onde os deuses deixam oferendas', 'numa biblioteca de oráculos'],
    props: ['com um fio dourado do destino', 'com uma romã partida', 'com uma lira de madeira escura', 'com uma chave antiga de bronze'],
    premade: ['Perséfone divide o tempo entre dois mundos em uma agenda lotada.', 'Héstia transforma uma pequena casa numa morada acolhedora para viajantes.', 'Desenhe uma cena mitológica sob a perspectiva de uma criatura esquecida.'],
  },
  'mitologia-nordica': {
    subjects: ['Idunn com suas maçãs', 'Bragi com uma harpa', 'Ullr atravessando neve profunda', 'Eir como curandeira', 'Ran recolhendo tesouros do mar', 'Aegir em um salão submarino', 'Gullveig envolta em ouro', 'um norn tecendo um fio do destino'],
    actions: ['reparando uma ponte entre mundos', 'negociando com anões ferreiros', 'registrando presságios numa runa', 'navegando por um mar de gelo', 'protegendo uma árvore jovem durante o inverno'],
    settings: ['num salão de madeira sob a aurora', 'numa praia de pedras negras', 'numa forja abaixo de uma montanha', 'num bosque de freixos antigos'],
    props: ['com uma bússola rúnica', 'com uma maçã dourada', 'com uma rede de pesca encantada', 'com uma pedra gravada com runas'],
    premade: ['Idunn precisa proteger suas maçãs durante uma festa caótica em Asgard.', 'Uma norn encontra um fio do destino que parece levar a lugar nenhum.', 'Desenhe uma embarcação viking atravessando um céu estrelado entre mundos.'],
  },
  'mitologia-japonesa': {
    subjects: ['Benzaiten com instrumento musical', 'Raijin entre tambores de trovão', 'Fujin carregando seu saco de vento', 'Omoikane como sábio conselheiro', 'um zashiki-warashi numa casa antiga', 'um nurikabe bloqueando uma estrada', 'um tsukumogami feito de guarda-chuva', 'um kodama num cedro centenário'],
    actions: ['guiando um festival de lanternas', 'reparando um portão torii', 'negociando paz entre yokai rivais', 'protegendo uma ponte durante uma nevasca', 'ensinando um humano a respeitar a floresta'],
    settings: ['numa rua de lojas fechadas após a meia-noite', 'numa floresta de cedros gigantes', 'numa casa tradicional cheia de amuletos', 'num festival sob chuva fina'],
    props: ['com um sino de bronze', 'com uma máscara de kitsune rachada', 'com um leque que invoca ventos', 'com um amuleto de papel dobrado'],
    premade: ['Um tsukumogami tenta descobrir quem foi seu dono original.', 'Raijin e Fujin disputam quem consegue criar a tempestade mais bonita.', 'Desenhe uma estação de trem frequentada por espíritos depois da meia-noite.'],
  },
};

export function aplicarPatch3(themes: ThemeData[]): ThemeData[] {
  for (const theme of themes) {
    const extra = PATCH3[theme.id];
    if (!extra) continue;
    for (const key of ['subjects', 'actions', 'settings', 'props', 'premade'] as const) {
      const atuais = theme[key];
      const vistos = new Set(atuais.map((s) => s.normalize('NFC').trim().toLocaleLowerCase('pt-BR')));
      for (const item of extra[key] ?? []) {
        const id = item.normalize('NFC').trim().toLocaleLowerCase('pt-BR');
        if (id && !vistos.has(id)) { atuais.push(item); vistos.add(id); }
      }
    }
  }
  return themes;
}
