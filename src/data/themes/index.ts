import type { ThemeData } from '../../types';
import { espaco, faroeste, fantasia, lhamas, terror } from './grupoA';
import { cyber, egito, estudos, folclore, noir } from './grupoB';
import { animais, comida, cotidiano, mar, pirata } from './grupoC';
import { cartoons, culturaPop, criaturasFantasticas, dc, fnaf, jogos, marvel, mitologiaGrega, mitologiaJaponesa, mitologiaNordica, sliceLife } from './expansao';
import { aplicarExpansaoProfunda } from './expansaoProfunda';
import { aplicarPatch3 } from './patch3Profundo';
import { animeManga, mitologiaCelta, mitologiaChinesa, mitologiaHindu, mitologiaRomana, mitologiasMesoamericanas, pokemon } from './expansaoUniversos';
import { aplicarPatch4 } from './patch4Universos';
import { PATCH5_THEMES } from './patch5Resenha';
import { PATCH6_THEMES } from './patch6Musica';
import { PATCH8_BRASILIDADES } from './patch8Brasilidades';

export const BUILTIN_THEMES: ThemeData[] = [...aplicarPatch4(aplicarPatch3(aplicarExpansaoProfunda([
  fantasia, espaco, terror, faroeste, lhamas, estudos, egito, noir,
  cyber, folclore, mar, comida, animais, cotidiano, pirata,
  marvel, dc, fnaf, jogos, cartoons, sliceLife, mitologiaGrega, mitologiaNordica,
  mitologiaJaponesa, culturaPop, criaturasFantasticas,
  mitologiaRomana, mitologiaCelta, mitologiaChinesa, mitologiaHindu, mitologiasMesoamericanas, animeManga, pokemon,
]))), ...PATCH5_THEMES, ...PATCH6_THEMES, ...PATCH8_BRASILIDADES];

export const DEFAULT_THEME_IDS = ['fantasia'];
