import type { ThemeData } from '../../types';
import { espaco, faroeste, fantasia, lhamas, terror } from './grupoA';
import { cyber, egito, estudos, folclore, noir } from './grupoB';
import { animais, comida, cotidiano, mar, pirata } from './grupoC';
import { cartoons, culturaPop, criaturasFantasticas, dc, fnaf, jogos, marvel, mitologiaGrega, mitologiaJaponesa, mitologiaNordica, sliceLife } from './expansao';

export const BUILTIN_THEMES: ThemeData[] = [
  fantasia, espaco, terror, faroeste, lhamas, estudos, egito, noir,
  cyber, folclore, mar, comida, animais, cotidiano, pirata,
  marvel, dc, fnaf, jogos, cartoons, sliceLife, mitologiaGrega, mitologiaNordica,
  mitologiaJaponesa, culturaPop, criaturasFantasticas,
];

export const DEFAULT_THEME_IDS = ['fantasia'];
