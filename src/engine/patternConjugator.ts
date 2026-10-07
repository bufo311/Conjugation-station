import { Pronoun, TenseKey } from '../types';
import { conjugateRegular, REGULAR_ENDINGS } from './conjugator';

function replaceLast(str: string, target: string, replacement: string): string {
  const idx = str.lastIndexOf(target);
  if (idx === -1) return str;
  return str.slice(0, idx) + replacement + str.slice(idx + target.length);
}

export function conjugateWithPattern(
  infinitive: string,
  pattern: string,
  tense: TenseKey,
  pronoun: Pronoun
): string {
  const endingType = infinitive.slice(-2) as 'ar' | 'er' | 'ir';
  const baseStem = infinitive.slice(0, -2);
  const isBoot = pronoun === 'yo' || pronoun === 'tu' || pronoun === 'el_ella_ud' || pronoun === 'ellos_ellas_uds';

  // 1. Regular patterns: A1, E1, I1
  if (pattern === 'A1' || pattern === 'E1' || pattern === 'I1') {
    return conjugateRegular(infinitive, tense, pronoun);
  }

  // 2. Orthographic -car -> -qué / -que
  if (pattern === 'A2') {
    const cStem = baseStem.slice(0, -1) + 'qu';
    if (tense === 'preterito' && pronoun === 'yo') return cStem + 'é';
    if (tense === 'presente_subjuntivo' || tense === 'imperativo_negativo') {
      const endings = REGULAR_ENDINGS.ar[tense];
      return cStem + endings[pronoun];
    }
    if (tense === 'imperativo_afirmativo' && (pronoun === 'el_ella_ud' || pronoun === 'nosotros' || pronoun === 'ellos_ellas_uds')) {
      const endings = REGULAR_ENDINGS.ar.imperativo_afirmativo;
      return cStem + endings[pronoun];
    }
    return conjugateRegular(infinitive, tense, pronoun);
  }

  // 3. Orthographic -gar -> -gué / -gue
  if (pattern === 'A3') {
    const gStem = baseStem + 'u'; // e.g. pag -> pagu
    if (tense === 'preterito' && pronoun === 'yo') return gStem + 'é';
    if (tense === 'presente_subjuntivo' || tense === 'imperativo_negativo') {
      const endings = REGULAR_ENDINGS.ar[tense];
      return gStem + endings[pronoun];
    }
    if (tense === 'imperativo_afirmativo' && (pronoun === 'el_ella_ud' || pronoun === 'nosotros' || pronoun === 'ellos_ellas_uds')) {
      const endings = REGULAR_ENDINGS.ar.imperativo_afirmativo;
      return gStem + endings[pronoun];
    }
    return conjugateRegular(infinitive, tense, pronoun);
  }

  // 4. Orthographic -zar -> -cé / -ce
  if (pattern === 'A4') {
    const zStem = baseStem.slice(0, -1) + 'c'; // e.g. abraz -> abrac
    if (tense === 'preterito' && pronoun === 'yo') return zStem + 'é';
    if (tense === 'presente_subjuntivo' || tense === 'imperativo_negativo') {
      const endings = REGULAR_ENDINGS.ar[tense];
      return zStem + endings[pronoun];
    }
    if (tense === 'imperativo_afirmativo' && (pronoun === 'el_ella_ud' || pronoun === 'nosotros' || pronoun === 'ellos_ellas_uds')) {
      const endings = REGULAR_ENDINGS.ar.imperativo_afirmativo;
      return zStem + endings[pronoun];
    }
    return conjugateRegular(infinitive, tense, pronoun);
  }

  // 5. Stem change e -> ie in -ar (A5, A6, A7)
  if (pattern === 'A5' || pattern === 'A6' || pattern === 'A7') {
    const ieStem = replaceLast(baseStem, 'e', 'ie');
    if (pattern === 'A6' && (tense === 'preterito' && pronoun === 'yo')) {
      return baseStem.slice(0, -1) + 'cé';
    }
    if (pattern === 'A7' && (tense === 'preterito' && pronoun === 'yo')) {
      return baseStem + 'ué';
    }
    if (tense === 'presente' && isBoot) {
      return ieStem + REGULAR_ENDINGS.ar.presente[pronoun];
    }
    if (tense === 'presente_subjuntivo' || tense === 'imperativo_negativo') {
      const s = isBoot ? ieStem : baseStem;
      const finalStem = pattern === 'A6' ? s.slice(0, -1) + 'c' : pattern === 'A7' ? s + 'u' : s;
      return finalStem + REGULAR_ENDINGS.ar.presente_subjuntivo[pronoun];
    }
    if (tense === 'imperativo_afirmativo') {
      if (pronoun === 'tu') return ieStem + 'a';
      if (pronoun === 'el_ella_ud') {
        const s = pattern === 'A6' ? ieStem.slice(0, -1) + 'c' : pattern === 'A7' ? ieStem + 'u' : ieStem;
        return s + 'e';
      }
      if (pronoun === 'ellos_ellas_uds') {
        const s = pattern === 'A6' ? ieStem.slice(0, -1) + 'c' : pattern === 'A7' ? ieStem + 'u' : ieStem;
        return s + 'en';
      }
    }
    return conjugateRegular(infinitive, tense, pronoun);
  }

  // 6. Stem change o -> ue in -ar (A8, A10, A11)
  if (pattern === 'A8' || pattern === 'A10' || pattern === 'A11') {
    const ueStem = replaceLast(baseStem, 'o', 'ue');
    if (pattern === 'A8' && (tense === 'preterito' && pronoun === 'yo')) {
      return baseStem + 'ué';
    }
    if (pattern === 'A11' && (tense === 'preterito' && pronoun === 'yo')) {
      return baseStem.slice(0, -1) + 'cé';
    }
    if (tense === 'presente' && isBoot) {
      return ueStem + REGULAR_ENDINGS.ar.presente[pronoun];
    }
    if (tense === 'presente_subjuntivo' || tense === 'imperativo_negativo') {
      const s = isBoot ? ueStem : baseStem;
      const finalStem = pattern === 'A11' ? s.slice(0, -1) + 'c' : pattern === 'A8' ? s + 'u' : s;
      return finalStem + REGULAR_ENDINGS.ar.presente_subjuntivo[pronoun];
    }
    if (tense === 'imperativo_afirmativo') {
      if (pronoun === 'tu') return ueStem + 'a';
      if (pronoun === 'el_ella_ud') {
        const s = pattern === 'A11' ? ueStem.slice(0, -1) + 'c' : pattern === 'A8' ? ueStem + 'u' : ueStem;
        return s + 'e';
      }
      if (pronoun === 'ellos_ellas_uds') {
        const s = pattern === 'A11' ? ueStem.slice(0, -1) + 'c' : pattern === 'A8' ? ueStem + 'u' : ueStem;
        return s + 'en';
      }
    }
    return conjugateRegular(infinitive, tense, pronoun);
  }

  // 7. u -> ue (A15: jugar)
  if (pattern === 'A15') {
    const ueStem = 'jueg';
    if (tense === 'preterito' && pronoun === 'yo') return 'jugué';
    if (tense === 'presente' && isBoot) return ueStem + REGULAR_ENDINGS.ar.presente[pronoun];
    if (tense === 'presente_subjuntivo' || tense === 'imperativo_negativo') {
      const s = isBoot ? 'juegu' : 'jugu';
      return s + REGULAR_ENDINGS.ar.presente_subjuntivo[pronoun];
    }
    if (tense === 'imperativo_afirmativo') {
      if (pronoun === 'tu') return 'juega';
      if (pronoun === 'el_ella_ud') return 'juegue';
      if (pronoun === 'nosotros') return 'juguemos';
      if (pronoun === 'ellos_ellas_uds') return 'jueguen';
    }
    return conjugateRegular(infinitive, tense, pronoun);
  }

  // 8. -cer / -cir after vowel -> -zco (E3: conocer, parecer, etc.)
  if (pattern === 'E3') {
    const zcoStem = baseStem.slice(0, -1) + 'zc'; // e.g. conoc -> conozc
    if (tense === 'presente' && pronoun === 'yo') return zcoStem + 'o';
    if (tense === 'presente_subjuntivo' || tense === 'imperativo_negativo') {
      return zcoStem + REGULAR_ENDINGS[endingType].presente_subjuntivo[pronoun];
    }
    if (tense === 'imperativo_afirmativo' && (pronoun === 'el_ella_ud' || pronoun === 'nosotros' || pronoun === 'ellos_ellas_uds')) {
      return zcoStem + REGULAR_ENDINGS[endingType].presente_subjuntivo[pronoun];
    }
    return conjugateRegular(infinitive, tense, pronoun);
  }

  // 9. -ger / -gir -> -j (E6, I7: coger, proteger, dirigir, exigir, etc.)
  if (pattern === 'E6' || pattern === 'I7') {
    const jStem = baseStem.slice(0, -1) + 'j';
    if (tense === 'presente' && pronoun === 'yo') return jStem + 'o';
    if (tense === 'presente_subjuntivo' || tense === 'imperativo_negativo') {
      return jStem + REGULAR_ENDINGS[endingType].presente_subjuntivo[pronoun];
    }
    if (tense === 'imperativo_afirmativo' && (pronoun === 'el_ella_ud' || pronoun === 'nosotros' || pronoun === 'ellos_ellas_uds')) {
      return jStem + REGULAR_ENDINGS[endingType].presente_subjuntivo[pronoun];
    }
    return conjugateRegular(infinitive, tense, pronoun);
  }

  // 10. e -> ie in -er (E8: entender, perder, atender, defender, encender)
  if (pattern === 'E8') {
    const ieStem = replaceLast(baseStem, 'e', 'ie');
    if (tense === 'presente' && isBoot) {
      return ieStem + REGULAR_ENDINGS.er.presente[pronoun];
    }
    if (tense === 'presente_subjuntivo' || tense === 'imperativo_negativo') {
      const s = isBoot ? ieStem : baseStem;
      return s + REGULAR_ENDINGS.er.presente_subjuntivo[pronoun];
    }
    if (tense === 'imperativo_afirmativo') {
      if (pronoun === 'tu') return ieStem + 'e';
      if (pronoun === 'el_ella_ud') return ieStem + 'a';
      if (pronoun === 'ellos_ellas_uds') return ieStem + 'an';
    }
    return conjugateRegular(infinitive, tense, pronoun);
  }

  // 11. o -> ue in -er (E9: mover, morder, doler, soler, llover)
  if (pattern === 'E9') {
    const ueStem = replaceLast(baseStem, 'o', 'ue');
    if (tense === 'presente' && isBoot) {
      return ueStem + REGULAR_ENDINGS.er.presente[pronoun];
    }
    if (tense === 'presente_subjuntivo' || tense === 'imperativo_negativo') {
      const s = isBoot ? ueStem : baseStem;
      return s + REGULAR_ENDINGS.er.presente_subjuntivo[pronoun];
    }
    if (tense === 'imperativo_afirmativo') {
      if (pronoun === 'tu') return ueStem + 'e';
      if (pronoun === 'el_ella_ud') return ueStem + 'a';
      if (pronoun === 'ellos_ellas_uds') return ueStem + 'an';
    }
    return conjugateRegular(infinitive, tense, pronoun);
  }

  // 12. -cer with consonant -> -zo (E2: convencer, vencer)
  if (pattern === 'E2') {
    const zStem = baseStem.slice(0, -1) + 'z';
    if (tense === 'presente' && pronoun === 'yo') return zStem + 'o';
    if (tense === 'presente_subjuntivo' || tense === 'imperativo_negativo') {
      return zStem + REGULAR_ENDINGS.er.presente_subjuntivo[pronoun];
    }
    return conjugateRegular(infinitive, tense, pronoun);
  }

  // 13. -guir -> -g (I2: distinguir)
  if (pattern === 'I2') {
    const gStem = baseStem.slice(0, -1); // distíngu -> disting
    if (tense === 'presente' && pronoun === 'yo') return gStem + 'o';
    if (tense === 'presente_subjuntivo' || tense === 'imperativo_negativo') {
      return gStem + REGULAR_ENDINGS.ir.presente_subjuntivo[pronoun];
    }
    return conjugateRegular(infinitive, tense, pronoun);
  }

  // 14. -ducir (I6: conducir, producir, traducir, reducir)
  if (pattern === 'I6') {
    const root = infinitive.slice(0, -5); // e.g. conduc -> con
    const duzcStem = root + 'duzc';
    const dujStem = root + 'duj';

    if (tense === 'presente' && pronoun === 'yo') return duzcStem + 'o';
    if (tense === 'presente_subjuntivo' || tense === 'imperativo_negativo') {
      return duzcStem + REGULAR_ENDINGS.ir.presente_subjuntivo[pronoun];
    }
    if (tense === 'preterito') {
      const preteriteJEndings: Record<Pronoun, string> = {
        yo: 'e',
        tu: 'iste',
        el_ella_ud: 'o',
        nosotros: 'imos',
        vosotros: 'isteis',
        ellos_ellas_uds: 'eron',
      };
      return dujStem + preteriteJEndings[pronoun];
    }
    if (tense === 'imperfecto_subjuntivo') {
      const impJEndings: Record<Pronoun, string> = {
        yo: 'era',
        tu: 'eras',
        el_ella_ud: 'era',
        nosotros: 'éramos',
        vosotros: 'erais',
        ellos_ellas_uds: 'eran',
      };
      return dujStem + impJEndings[pronoun];
    }
    return conjugateRegular(infinitive, tense, pronoun);
  }

  // 15. e -> i in -ir (I14: pedir, servir, vestir, repetir, medir, competir, despedir, impedir)
  if (pattern === 'I14') {
    const iStem = replaceLast(baseStem, 'e', 'i');
    if (tense === 'presente' && isBoot) {
      return iStem + REGULAR_ENDINGS.ir.presente[pronoun];
    }
    if (tense === 'preterito') {
      if (pronoun === 'el_ella_ud') return iStem + 'ió';
      if (pronoun === 'ellos_ellas_uds') return iStem + 'ieron';
      return baseStem + REGULAR_ENDINGS.ir.preterito[pronoun];
    }
    if (tense === 'presente_subjuntivo' || tense === 'imperativo_negativo') {
      return iStem + REGULAR_ENDINGS.ir.presente_subjuntivo[pronoun];
    }
    if (tense === 'imperfecto_subjuntivo') {
      return iStem + REGULAR_ENDINGS.ir.imperfecto_subjuntivo[pronoun];
    }
    if (tense === 'imperativo_afirmativo') {
      if (pronoun === 'tu') return iStem + 'e';
      if (pronoun === 'el_ella_ud') return iStem + 'a';
      if (pronoun === 'nosotros') return iStem + 'amos';
      if (pronoun === 'ellos_ellas_uds') return iStem + 'an';
    }
    return conjugateRegular(infinitive, tense, pronoun);
  }

  // 16. e -> ie in -ir (I11: sentir, preferir, mentir, divertir, advertir, convertir, herir, hervir, sugerir)
  if (pattern === 'I11') {
    const ieStem = replaceLast(baseStem, 'e', 'ie');
    const iStem = replaceLast(baseStem, 'e', 'i');
    if (tense === 'presente' && isBoot) {
      return ieStem + REGULAR_ENDINGS.ir.presente[pronoun];
    }
    if (tense === 'preterito') {
      if (pronoun === 'el_ella_ud') return iStem + 'ió';
      if (pronoun === 'ellos_ellas_uds') return iStem + 'ieron';
      return baseStem + REGULAR_ENDINGS.ir.preterito[pronoun];
    }
    if (tense === 'presente_subjuntivo' || tense === 'imperativo_negativo') {
      const s = isBoot ? ieStem : iStem;
      return s + REGULAR_ENDINGS.ir.presente_subjuntivo[pronoun];
    }
    if (tense === 'imperfecto_subjuntivo') {
      return iStem + REGULAR_ENDINGS.ir.imperfecto_subjuntivo[pronoun];
    }
    if (tense === 'imperativo_afirmativo') {
      if (pronoun === 'tu') return ieStem + 'e';
      if (pronoun === 'el_ella_ud') return ieStem + 'a';
      if (pronoun === 'nosotros') return iStem + 'amos';
      if (pronoun === 'ellos_ellas_uds') return ieStem + 'an';
    }
    return conjugateRegular(infinitive, tense, pronoun);
  }

  // 17. -uir -> -uy (I20: construir, destruir, huir, incluir, influir, contribuir)
  if (pattern === 'I20') {
    const uyStem = baseStem + 'y';
    if (tense === 'presente' && isBoot) {
      return uyStem + REGULAR_ENDINGS.ir.presente[pronoun];
    }
    if (tense === 'preterito') {
      if (pronoun === 'el_ella_ud') return uyStem + 'ó';
      if (pronoun === 'ellos_ellas_uds') return uyStem + 'eron';
      return baseStem + REGULAR_ENDINGS.ir.preterito[pronoun];
    }
    if (tense === 'presente_subjuntivo' || tense === 'imperativo_negativo') {
      return uyStem + REGULAR_ENDINGS.ir.presente_subjuntivo[pronoun];
    }
    if (tense === 'imperfecto_subjuntivo') {
      return uyStem + 'era';
    }
    if (tense === 'imperativo_afirmativo') {
      if (pronoun === 'tu') return uyStem + 'e';
      if (pronoun === 'el_ella_ud') return uyStem + 'a';
      if (pronoun === 'nosotros') return uyStem + 'amos';
      if (pronoun === 'ellos_ellas_uds') return uyStem + 'an';
    }
    return conjugateRegular(infinitive, tense, pronoun);
  }

  // 18. Irregular participles: I33, I34, E30
  if (pattern === 'I33') {
    if (tense === 'preterito_perfecto') {
      const aux = REGULAR_ENDINGS.ir.preterito_perfecto[pronoun];
      const part = infinitive === 'abrir' ? 'abierto' : infinitive === 'cubrir' ? 'cubierto' : 'descubierto';
      return aux + part;
    }
    return conjugateRegular(infinitive, tense, pronoun);
  }
  if (pattern === 'I34') {
    if (tense === 'preterito_perfecto') {
      const aux = REGULAR_ENDINGS.ir.preterito_perfecto[pronoun];
      const part = infinitive === 'escribir' ? 'escrito' : 'descrito';
      return aux + part;
    }
    return conjugateRegular(infinitive, tense, pronoun);
  }
  if (pattern === 'E30') {
    if (tense === 'preterito_perfecto') {
      const aux = REGULAR_ENDINGS.er.preterito_perfecto[pronoun];
      return aux + 'roto';
    }
    return conjugateRegular(infinitive, tense, pronoun);
  }

  // Default fallback
  return conjugateRegular(infinitive, tense, pronoun);
}
