/**
 * PROYECTO KOKAMA - SCRIPT PRINCIPAL
 * Interacciones, Audio Web, Módulos Educativos, Cuentos y Juegos
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initAmbientAudio();
  initLearningCards();
  initStories();
  initMemoryGame();
  initTriviaGame();
  initRiddles();
});

/* ==========================================================
   1. NAVEGACIÓN Y SCROLL SPY
   ========================================================== */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  const mobileToggle = document.getElementById('mobileToggle');
  const navMenu = document.getElementById('navMenu');
  const navLinks = document.querySelectorAll('.nav-link');

  // Sticky Navbar shadow al hacer scroll
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Scroll Spy: marcar enlace activo
    let currentSection = '';
    const sections = document.querySelectorAll('section[id], footer[id]');
    
    sections.forEach(sec => {
      const sectionTop = sec.offsetTop - 120;
      const sectionHeight = sec.offsetHeight;
      if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
        currentSection = sec.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${currentSection}`) {
        link.classList.add('active');
      }
    });
  });

  // Toggle menú móvil
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
    });

    // Cerrar al hacer clic en un enlace
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
      });
    });
  }
}

/* ==========================================================
   2. AUDIO AMBIENTAL Y SÍNTESIS DE VOZ
   ========================================================== */
let audioCtx = null;
let isAmbientPlaying = false;
let ambientInterval = null;
let riverNoiseNode = null;
let riverGainNode = null;

function initAmbientAudio() {
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundIcon = document.getElementById('soundIcon');

  if (!soundToggleBtn) return;

  soundToggleBtn.addEventListener('click', () => {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    if (!isAmbientPlaying) {
      startAmazonAmbience();
      isAmbientPlaying = true;
      soundToggleBtn.classList.add('playing');
      soundIcon.className = 'fa-solid fa-volume-high';
      showToast('Sonido ambiental de la selva activado 🌿');
    } else {
      stopAmazonAmbience();
      isAmbientPlaying = false;
      soundToggleBtn.classList.remove('playing');
      soundIcon.className = 'fa-solid fa-volume-xmark';
      showToast('Sonido ambiental silenciado');
    }
  });
}

// Generador de sonido de río y viento suave con Web Audio API
function startAmazonAmbience() {
  if (!audioCtx) return;

  // Ruido marrón/rosa para simular el caudal del río Marañón
  const bufferSize = audioCtx.sampleRate * 2;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  let lastOut = 0.0;

  for (let i = 0; i < bufferSize; i++) {
    const white = Math.random() * 2 - 1;
    data[i] = (lastOut + (0.02 * white)) / 1.02;
    lastOut = data[i];
    data[i] *= 2.8; // volumen de textura
  }

  riverNoiseNode = audioCtx.createBufferSource();
  riverNoiseNode.buffer = buffer;
  riverNoiseNode.loop = true;

  // Filtro pasa bajos para la calidez del agua
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(320, audioCtx.currentTime);

  riverGainNode = audioCtx.createGain();
  riverGainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);

  riverNoiseNode.connect(filter);
  filter.connect(riverGainNode);
  riverGainNode.connect(audioCtx.destination);
  riverNoiseNode.start();

  // Cantos aleatorios de aves amazónicas cada 4-7 segundos
  ambientInterval = setInterval(() => {
    if (isAmbientPlaying && Math.random() > 0.3) {
      playAmazonBirdChirp();
    }
  }, 4500);
}

function stopAmazonAmbience() {
  if (riverNoiseNode) {
    try {
      riverGainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);
      setTimeout(() => {
        riverNoiseNode.stop();
        riverNoiseNode.disconnect();
      }, 500);
    } catch (e) {}
  }
  if (ambientInterval) {
    clearInterval(ambientInterval);
  }
}

// Síntesis armónica de un canto sutil de pájaro amazónico
function playAmazonBirdChirp() {
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  const baseFreq = 1800 + Math.random() * 800;
  osc.type = 'sine';
  osc.frequency.setValueAtTime(baseFreq, now);
  osc.frequency.exponentialRampToValueAtTime(baseFreq + 600, now + 0.08);
  osc.frequency.exponentialRampToValueAtTime(baseFreq - 300, now + 0.18);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.04, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 0.26);
}

// Reproducción de pronunciación fonética clara
function playSpeechText(text, contextHint = '') {
  // Efecto auditivo acústico
  playClickTone();

  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel(); // Detener audios previos
    
    // Preparar el enunciado
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-PE'; // Español peruano como base de pronunciación fonética nativa
    utterance.rate = 0.85; // Velocidad ligeramente pausada para facilitar el aprendizaje
    utterance.pitch = 1.05;

    // Intentar buscar una voz en español
    const voices = window.speechSynthesis.getVoices();
    const esVoice = voices.find(v => v.lang.includes('es') || v.lang.includes('ES'));
    if (esVoice) utterance.voice = esVoice;

    window.speechSynthesis.speak(utterance);
    showToast(`Escuchando: "${text}" ${contextHint ? '• ' + contextHint : ''}`);
  } else {
    showToast(`Pronunciación fonética: [${text}]`);
  }
}

function playClickTone() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = audioCtx || new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(540, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(820, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.13);
  } catch (e) {}
}

/* ==========================================================
   3. BASE DE DATOS DE APRENDIZAJE & MODAL INTERACTIVO
   ========================================================== */
const LEARNING_DATABASE = {
  numeros: {
    category: 'Tsanatakana • Números',
    title: 'Sistema Numérico en Kokama-Kukamiria',
    tip: 'El conteo tradicional se combina para formar cifras mayores. Por ejemplo, 11 es "Chunka wepe" (diez y uno).',
    filters: ['Todos', 'Básicos (1-5)', 'Superiores (6-10)', 'Decenas y Centenas'],
    items: [
      {
        index: '1',
        word: 'Wepe',
        phonetic: '[wé-pe]',
        spanish: 'Uno (1)',
        category: 'Básicos (1-5)',
        note: 'Punto de partida del conteo y unidad individual.'
      },
      {
        index: '2',
        word: 'Mukuika',
        phonetic: '[mu-kui-ka]',
        spanish: 'Dos (2)',
        category: 'Básicos (1-5)',
        note: 'Representa el par, la dualidad y los compañeros de canoa.'
      },
      {
        index: '3',
        word: 'Mutsapirika',
        phonetic: '[mu-tsa-pi-rí-ka]',
        spanish: 'Tres (3)',
        category: 'Básicos (1-5)',
        note: 'Ligado a los tres mundos de la cosmovisión kukama.'
      },
      {
        index: '4',
        word: 'Irwaka',
        phonetic: '[ir-wá-ka]',
        spanish: 'Cuatro (4)',
        category: 'Básicos (1-5)',
        note: 'Refiere a los cuatro puntos de las quebradas y vientos.'
      },
      {
        index: '5',
        word: 'Pichika',
        phonetic: '[pi-chí-ka]',
        spanish: 'Cinco (5)',
        category: 'Básicos (1-5)',
        note: 'Equivalente a los dedos de una mano completa (wepe puapara).'
      },
      {
        index: '6',
        word: 'Tsukta',
        phonetic: '[tsúk-ta]',
        spanish: 'Seis (6)',
        category: 'Superiores (6-10)',
        note: 'Primer número del conteo de la segunda mano.'
      },
      {
        index: '7',
        word: 'Kantse',
        phonetic: '[kán-tse]',
        spanish: 'Siete (7)',
        category: 'Superiores (6-10)',
        note: 'Usado frecuentemente en las cuentas de lunas crecientes.'
      },
      {
        index: '8',
        word: 'Putsa',
        phonetic: '[pút-sa]',
        spanish: 'Ocho (8)',
        category: 'Superiores (6-10)',
        note: 'Número del conteo ribereño.'
      },
      {
        index: '9',
        word: 'Iskun',
        phonetic: '[ís-kun]',
        spanish: 'Nueve (9)',
        category: 'Superiores (6-10)',
        note: 'Último dígito antes de completar la decena.'
      },
      {
        index: '10',
        word: 'Chunka',
        phonetic: '[chún-ka]',
        spanish: 'Diez (10)',
        category: 'Superiores (6-10)',
        note: 'Una decena completa (las dos manos).'
      },
      {
        index: '20',
        word: 'Mukuika chunka',
        phonetic: '[mu-kui-ka chún-ka]',
        spanish: 'Veinte (20)',
        category: 'Decenas y Centenas',
        note: 'Literalmente: dos veces diez.'
      },
      {
        index: '100',
        word: 'Pacha',
        phonetic: '[pá-cha]',
        spanish: 'Cien (100)',
        category: 'Decenas y Centenas',
        note: 'Un centenar completo en intercambios comunales.'
      }
    ]
  },

  alfabeto: {
    category: 'Ikitu Kana • Fonología',
    title: 'Alfabeto Oficial Kukama-Kukamiria (MINEDU)',
    tip: 'Cuenta con 18 grafías oficializadas por R.M. N.° 303-2015-MINEDU: 5 vocales y 13 consonantes.',
    filters: ['Todos', 'Vocales (5)', 'Consonantes (13)', 'Grafías Especiales'],
    items: [
      {
        index: 'A',
        word: 'A',
        phonetic: '[a] (abierta)',
        spanish: 'Vocal A',
        category: 'Vocales (5)',
        note: 'Ejemplo: "Amī" (abuelo o ancestro protector).'
      },
      {
        index: 'Ë',
        word: 'Ë',
        phonetic: '[ə] (vocal central media)',
        spanish: 'Vocal Ë especial',
        category: 'Grafías Especiales',
        note: 'Sonido suave entre "e" y "o". Ejemplo: "Pë" (camino de agua / sendero).'
      },
      {
        index: 'I',
        word: 'I',
        phonetic: '[i] (anterior alta)',
        spanish: 'Vocal I',
        category: 'Vocales (5)',
        note: 'Ejemplo: "Ipira" (pez o pescado del río).'
      },
      {
        index: 'Ɨ',
        word: 'Ɨ / Ï',
        phonetic: '[ɨ] (vocal central alta cerrada)',
        spanish: 'Vocal Ɨ especial',
        category: 'Grafías Especiales',
        note: 'Se pronuncia con la lengua hacia atrás sin redondear los labios. Ejemplo: "Iwititi" (tierra).'
      },
      {
        index: 'U',
        word: 'U',
        phonetic: '[u] (posterior)',
        spanish: 'Vocal U',
        category: 'Vocales (5)',
        note: 'Ejemplo: "Uni" (agua de río o de lluvia).'
      },
      {
        index: 'Ch',
        word: 'Ch',
        phonetic: '[tʃ] (africada)',
        spanish: 'Consonante Ch',
        category: 'Consonantes (13)',
        note: 'Ejemplo: "Churi" (lorito pihuicho de la selva).'
      },
      {
        index: 'J',
        word: 'J',
        phonetic: '[h] (aspirada suave)',
        spanish: 'Consonante J',
        category: 'Consonantes (13)',
        note: 'Suena como una "h" inglesa suave. Ejemplo: "Jaka" (red de pesca).'
      },
      {
        index: 'K',
        word: 'K',
        phonetic: '[k] (oclusiva velar)',
        spanish: 'Consonante K',
        category: 'Consonantes (13)',
        note: 'Ejemplo: "Kupari" (el mundo subacuático de los espíritus).'
      },
      {
        index: 'M',
        word: 'M',
        phonetic: '[m] (nasal bilabial)',
        spanish: 'Consonante M',
        category: 'Consonantes (13)',
        note: 'Ejemplo: "Mainuma" (colibrí o picaflor mensajero).'
      },
      {
        index: 'N',
        word: 'N',
        phonetic: '[n] (nasal alveolar)',
        spanish: 'Consonante N',
        category: 'Consonantes (13)',
        note: 'Ejemplo: "Namu" (ave panguana de la selva baja).'
      },
      {
        index: 'P',
        word: 'P',
        phonetic: '[p] (oclusiva sorda)',
        spanish: 'Consonante P',
        category: 'Consonantes (13)',
        note: 'Ejemplo: "Pani" (remo tradicional para canoa).'
      },
      {
        index: 'R',
        word: 'R',
        phonetic: '[ɾ] (vibrante simple)',
        spanish: 'Consonante R',
        category: 'Consonantes (13)',
        note: 'Sonido suave similar a "pero". Ejemplo: "Ruru" (loro silvestre).'
      },
      {
        index: 'Sh',
        word: 'Sh',
        phonetic: '[ʃ] (fricativa palatal)',
        spanish: 'Consonante Sh',
        category: 'Consonantes (13)',
        note: 'Como la "sh" inglesa. Ejemplo: "Shepe" (hoja tierna de bijao).'
      },
      {
        index: 'T',
        word: 'T',
        phonetic: '[t] (oclusiva dental)',
        spanish: 'Consonante T',
        category: 'Consonantes (13)',
        note: 'Ejemplo: "Tapira" (sachavaca o tapir amazónico).'
      },
      {
        index: 'Ts',
        word: 'Ts',
        phonetic: '[ts] (africada alveolar)',
        spanish: 'Consonante Ts',
        category: 'Grafías Especiales',
        note: 'Sonido muy distintivo de la lengua. Ejemplo: "Tsuna" (bufeo colorado).'
      },
      {
        index: 'W',
        word: 'W',
        phonetic: '[w] (semivocal labial)',
        spanish: 'Consonante W',
        category: 'Consonantes (13)',
        note: 'Ejemplo: "Wira" (pájaro o ave que vuela).'
      },
      {
        index: 'Y',
        word: 'Y',
        phonetic: '[j] (semiconsonante)',
        spanish: 'Consonante Y',
        category: 'Consonantes (13)',
        note: 'Ejemplo: "Yawara" (jaguar o tigre del monte).'
      },
      {
        index: 'Ÿ',
        word: 'Ÿ',
        phonetic: '[ɰ̃] (nasal palatal/velar)',
        spanish: 'Consonante Ÿ nasalizada',
        category: 'Grafías Especiales',
        note: 'Grafía única para representar la semivocal nasalizada. Ejemplo: "Ÿapumuki" (cantar).'
      }
    ]
  },

  animales: {
    category: 'Mīra kana • Fauna Sagrada',
    title: 'Animales de la Selva y los Ríos de Loreto',
    tip: 'En la cosmovisión kukama, muchos animales son considerados protectores o seres que poseen su propio espíritu (madre del animal).',
    filters: ['Todos', 'Mamíferos', 'Acuáticos', 'Aves', 'Reptiles'],
    items: [
      {
        index: '🐆',
        word: 'Yawaratara',
        phonetic: '[ya-wa-ra-tá-ra]',
        spanish: 'Jaguar / Otorongo',
        category: 'Mamíferos',
        note: 'El felino mayor de la Amazonía; señor del monte y guardián espiritual.'
      },
      {
        index: '🐬',
        word: 'Tsuna',
        phonetic: '[tsú-na]',
        spanish: 'Bufeo Colorado / Delfín rosado',
        category: 'Acuáticos',
        note: 'Ser mítico del mundo submarino (Kupari) que viste sombrero de paja.'
      },
      {
        index: '🐟',
        word: 'Iwatsu',
        phonetic: '[i-wá-tsu]',
        spanish: 'Paiche gigante',
        category: 'Acuáticos',
        note: 'El pez de escamas rojas más grande de la cuenca amazónica.'
      },
      {
        index: '🐍',
        word: 'Kumapa / Maimuru',
        phonetic: '[ku-má-pa]',
        spanish: 'Anaconda / Madre del Agua',
        category: 'Reptiles',
        note: 'La gran serpiente que modeló los ríos y curvas del Marañón.'
      },
      {
        index: '🐢',
        word: 'Karipapa / Yapú',
        phonetic: '[ka-ri-pá-pa]',
        spanish: 'Charapa / Taricaya',
        category: 'Reptiles',
        note: 'Tortuga fluvial de río cuyas playas de desove son sagradas.'
      },
      {
        index: '🐦',
        word: 'Mainuma',
        phonetic: '[mai-nú-ma]',
        spanish: 'Picaflor / Colibrí',
        category: 'Aves',
        note: 'El ave mensajera entre el mundo de arriba y la tierra de los hombres.'
      },
      {
        index: '🦜',
        word: 'Churi',
        phonetic: '[chú-ri]',
        spanish: 'Pihuicho (lorito verde)',
        category: 'Aves',
        note: 'Vuela en bandadas alegres por las copas de las palmeras de aguaje.'
      },
      {
        index: '🐊',
        word: 'Uwatakatara',
        phonetic: '[u-wa-ta-ka-tá-ra]',
        spanish: 'Caimán / Lagarto negro',
        category: 'Reptiles',
        note: 'Habitante silencioso de las cochas y caños tranquilos de la selva.'
      },
      {
        index: '🐗',
        word: 'Tapira',
        phonetic: '[ta-pí-ra]',
        spanish: 'Sachavaca / Tapir amazónico',
        category: 'Mamíferos',
        note: 'El mamífero terrestre más corpulento de los bosques de Loreto.'
      },
      {
        index: '🐒',
        word: 'Pitsiku',
        phonetic: '[pi-tsí-ku]',
        spanish: 'Mono pichico / Frailecillo',
        category: 'Mamíferos',
        note: 'Pequeño primate ágil que salta entre los árboles de renaco.'
      },
      {
        index: '🦅',
        word: 'Urupukira',
        phonetic: '[u-ru-pu-kí-ra]',
        spanish: 'Gallinazo / Aura del río',
        category: 'Aves',
        note: 'Vuela en círculos limpiando las orillas de las islas fluviales.'
      },
      {
        index: '🛡️',
        word: 'Kaikana',
        phonetic: '[kai-ká-na]',
        spanish: 'Armadillo / Carachupa',
        category: 'Mamíferos',
        note: 'Guardián de los túneles terrestres y raíces del monte virgen.'
      }
    ]
  },

  frases: {
    category: 'Maniyawa • Expresiones Vivas',
    title: 'Saludos, Cortesía y Diálogos en Kokama',
    tip: 'Un rasgo hermoso del idioma es que las respuestas varían dependiendo de si quien habla es un hombre o una mujer.',
    filters: ['Todos', 'Saludos', 'Respuestas', 'Despedidas'],
    items: [
      {
        index: '🤝',
        word: 'Tsaniuri!',
        phonetic: '[tsa-ni-ú-ri]',
        spanish: '¡Bienvenido! / ¡Bienvenida!',
        category: 'Saludos',
        note: 'Expresión afectuosa con la que se recibe a un visitante en el hogar.'
      },
      {
        index: '☀️',
        word: 'Era na kuema',
        phonetic: '[é-ra na kué-ma]',
        spanish: 'Buenos días (saludo general)',
        category: 'Saludos',
        note: 'Deseo de claridad y buena energía al salir el sol en el río.'
      },
      {
        index: '🧔',
        word: 'Era ta kuema',
        phonetic: '[é-ra ta kué-ma]',
        spanish: 'Buenos días (respuesta dicha por varón)',
        category: 'Respuestas',
        note: 'Uso de la partícula "ta" correspondiente al habla masculina.'
      },
      {
        index: '👩',
        word: 'Era tsa kuema',
        phonetic: '[é-ra tsa kué-ma]',
        spanish: 'Buenos días (respuesta dicha por mujer)',
        category: 'Respuestas',
        note: 'Uso de la partícula "tsa" propia del género femenino.'
      },
      {
        index: '🌅',
        word: 'Era na karuka',
        phonetic: '[é-ra na ka-rú-ka]',
        spanish: 'Buenas tardes',
        category: 'Saludos',
        note: 'Saludo empleado cuando el sol empieza a declinar sobre el agua.'
      },
      {
        index: '❓',
        word: '¿Maniawatsëpë?',
        phonetic: '[ma-nia-wa-tsə́-pə]',
        spanish: '¿Cómo estás? / ¿Cómo están?',
        category: 'Saludos',
        note: 'Pregunta cotidiana por la salud y el bienestar de la familia.'
      },
      {
        index: '✨',
        word: 'Erai katu',
        phonetic: '[é-rai ká-tu]',
        spanish: 'Todo bien / En perfecta paz',
        category: 'Respuestas',
        note: 'Respuesta afirmativa de agradecimiento y satisfacción.'
      },
      {
        index: '🙏',
        word: 'Utsurpaki',
        phonetic: '[ut-sur-pá-ki]',
        spanish: 'Muchas gracias',
        category: 'Respuestas',
        note: 'Muestra de gratitud por un favor, pesca compartida o alimento.'
      },
      {
        index: '👋',
        word: 'Utsutarwa',
        phonetic: '[ut-su-tár-wa]',
        spanish: 'Hasta luego (despedida dicha por varón)',
        category: 'Despedidas',
        note: '"Ya me voy y volveré a verte".'
      },
      {
        index: '🙋‍♀️',
        word: 'Utsuchirwa',
        phonetic: '[ut-su-chír-wa]',
        spanish: 'Hasta luego (despedida dicha por mujer)',
        category: 'Despedidas',
        note: 'Despedida respetuosa de una mujer al retirarse de la reunión.'
      }
    ]
  }
};

let currentActiveModuleKey = 'numeros';
let currentActiveFilter = 'Todos';

function initLearningCards() {
  const cards = document.querySelectorAll('.module-card');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalBackdrop = document.getElementById('learningModal');

  cards.forEach(card => {
    card.addEventListener('click', () => {
      const moduleKey = card.getAttribute('data-module');
      openLearningModal(moduleKey);
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const moduleKey = card.getAttribute('data-module');
        openLearningModal(moduleKey);
      }
    });
  });

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeLearningModal);
  }

  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) {
        closeLearningModal();
      }
    });
  }

  // Cerrar con Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLearningModal();
  });
}

function openLearningModal(moduleKey) {
  const data = LEARNING_DATABASE[moduleKey];
  if (!data) return;

  currentActiveModuleKey = moduleKey;
  currentActiveFilter = 'Todos';

  document.getElementById('modalCategoryBadge').textContent = data.category;
  document.getElementById('modalMainTitle').textContent = data.title;
  document.getElementById('modalTipText').textContent = data.tip;

  // Renderizar filtros
  const filterPillsContainer = document.getElementById('modalFilterPills');
  filterPillsContainer.innerHTML = '';

  data.filters.forEach(f => {
    const btn = document.createElement('button');
    btn.className = `filter-pill ${f === 'Todos' ? 'active' : ''}`;
    btn.textContent = f;
    btn.onclick = () => {
      document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentActiveFilter = f;
      renderModalItems();
    };
    filterPillsContainer.appendChild(btn);
  });

  // Limpiar buscador
  const searchInput = document.getElementById('modalSearchInput');
  if (searchInput) searchInput.value = '';

  renderModalItems();

  const modal = document.getElementById('learningModal');
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeLearningModal() {
  const modal = document.getElementById('learningModal');
  if (modal) {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = 'auto';
  }
}

function renderModalItems(searchQuery = '') {
  const data = LEARNING_DATABASE[currentActiveModuleKey];
  const container = document.getElementById('modalCardsContainer');
  if (!data || !container) return;

  container.innerHTML = '';

  let filtered = data.items;

  // Filtrar por categoría
  if (currentActiveFilter !== 'Todos') {
    filtered = filtered.filter(item => item.category === currentActiveFilter);
  }

  // Filtrar por texto de búsqueda
  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(item => 
      item.word.toLowerCase().includes(q) ||
      item.spanish.toLowerCase().includes(q) ||
      item.phonetic.toLowerCase().includes(q) ||
      (item.note && item.note.toLowerCase().includes(q))
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: var(--color-text-muted);">
        <i class="fa-solid fa-seedling" style="font-size: 2.5rem; color: var(--color-brown-primary); margin-bottom: 12px; display: block;"></i>
        <h4 style="font-size: 1.2rem; color: var(--color-selva-dark);">No encontramos resultados</h4>
        <p>Prueba buscando con otra palabra o revisa los filtros disponibles.</p>
      </div>
    `;
    return;
  }

  filtered.forEach(item => {
    const cardEl = document.createElement('div');
    cardEl.className = 'modal-item-card';
    cardEl.innerHTML = `
      <div class="card-top-row">
        <span class="card-index">${item.index}</span>
        <button class="card-play-audio-btn" title="Escuchar pronunciación" aria-label="Escuchar ${item.word}">
          <i class="fa-solid fa-volume-high"></i>
        </button>
      </div>
      <h4 class="card-kukama-word">${item.word}</h4>
      <span class="card-phonetic">${item.phonetic}</span>
      <p class="card-spanish-translation">${item.spanish}</p>
      <div class="card-usage-note">${item.note}</div>
    `;

    const audioBtn = cardEl.querySelector('.card-play-audio-btn');
    audioBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      playSpeechText(item.word, item.spanish);
    });

    container.appendChild(cardEl);
  });
}

function filterModalCards(query) {
  renderModalItems(query);
}

/* ==========================================================
   4. CUENTOS Y LEYENDAS AMAZÓNICAS (BILINGÜE)
   ========================================================== */
const STORIES_DATABASE = {
  tsuna: {
    titleKukama: 'Tsuna - Kupari Ta Ikiatu',
    titleSpanish: 'Tsuna, el Bufeo Colorado del Río',
    location: 'Río Marañón y Laguna Tipishca, Loreto',
    paragraphs: [
      {
        kukama: 'Uni kupari tsupi, Tsuna ipira katu mīra ta. Karuka tsupi, tsuna yapurika pacha mīra yapana watsënë.',
        spanish: 'En las hondas profundidades del río mora Tsuna, el delfín rosado. Al caer la tarde en los pueblos, Tsuna sube a la orilla con aspecto de un hombre apuesto y distinguido.',
        interlinear: 'Uni (Río) kupari (profundo) tsupi (en), Tsuna (Delfín rosado) ipira katu (pez bondadoso) mīra ta (persona es).'
      },
      {
        kukama: 'Aya mīra tsuna pawa wepe karipapa puka awape. Yatse yarawa tapiaka mukuika, iwititi kuema tsupi uni tsupi kutari.',
        spanish: 'Lleva un sombrero de paja blanca para cubrir su orificio respiratorio y una camisa de seda ribereña. Danza con alegría en las fiestas patronales con los jóvenes.',
        interlinear: 'Aya (Ese) mīra (hombre) tsuna (bufeo) pawa (lleva) wepe (un) karipapa (sombrero blanco)...'
      },
      {
        kukama: 'Koema pukuri, Tsuna wata uni tsupi, kupari yarawa pawa mīra yura mari ta tsana.',
        spanish: 'Pero antes de que despunte el primer rayo del amanecer, Tsuna regresa al agua, recordándonos que el río y la selva deben tratarse con respeto sagrado y nunca con vanidad.',
        interlinear: 'Koema (Amanecer) pukuri (antes), Tsuna (el bufeo) wata (va) uni tsupi (hacia el río)...'
      }
    ],
    culturalNote: 'Tsuna enseña la reverencia que el pueblo kukama guarda por los espíritus ribereños. En la cosmovisión tradicional, el río no es un recurso inerte, sino una urbe viva gobernada por sabios ancestros.'
  },

  serpiente: {
    titleKukama: 'Mai Kurua - Uni Yari Mama',
    titleSpanish: 'Mai Kurua: La Gran Serpiente y el Nacimiento de los Ríos',
    location: 'Confluencia del Marañón y Ucayali',
    paragraphs: [
      {
        kukama: 'Iwititi ipura tsupi, mai kurua yarawa wata. Pai tsupi, uni mari ta tsana: Marañón awape Ucayali pawa.',
        spanish: 'En el principio de los tiempos, la gran anaconda cósmica surcó la tierra virgen. Con el serpenteo de su inmenso cuerpo abrió las curvas de los ríos Marañón y Ucayali.',
        interlinear: 'Iwititi (En la tierra) ipura (antigua) tsupi, mai kurua (la gran serpiente) yarawa wata (caminó / navegó).'
      },
      {
        kukama: 'Aya mai kurua ipira pawa, uni yura kuema. Kukama mīra ta ikia uni tsupi pawa eraikatu.',
        spanish: 'De su lomo nacieron los peces plateados, las gamitanas y los paiches que nutren a las comunidades. Así el pueblo Kukama aprendió a navegar guiado por su estela.',
        interlinear: 'Aya (Aquella) mai kurua (madre serpiente) ipira pawa (dio a los peces), uni yura (ríos limpios).'
      }
    ],
    culturalNote: 'Mai Kurua representa el principio vital del agua (Uni). Los trazos ondulados en la cerámica y tejidos kukamas representan su camino sagrado que conecta el mundo visible con el inframundo acuático.'
  },

  lupuna: {
    titleKukama: 'Kumaka - Iwititi Yarawa Okani',
    titleSpanish: 'Kumaka: El Espíritu Colosal de la Lupuna',
    location: 'Selva Virgen de Requena y Nauta',
    paragraphs: [
      {
        kukama: 'Kumaka mira ta tsana iwititi tsupi yara. Yura watsapïri tsupi, ikatse awape iwititi wepe yarawa.',
        spanish: 'La Lupuna es el árbol más alto y majestuoso de toda la floresta. Sus raíces gigantes abrazan la tierra y sus ramas tocan el cielo (Ikatse).',
        interlinear: 'Kumaka (La Lupuna) mira ta (coloso es) iwititi tsupi (en la selva)...'
      },
      {
        kukama: 'Mīra kuranderu kumaka tsupi wata, ikia medicinaru pawa. Yura mari ta kurata yapurika.',
        spanish: 'Los sabios médicos y curanderos dialogan con su sombra en silencio antes de cortar lianas o extraer resinas medicinales, pidiendo permiso para mantener la salud comunal.',
        interlinear: 'Mīra (Hombres) kuranderu (curanderos) kumaka tsupi (hacia la lupuna) wata (van)...'
      }
    ],
    culturalNote: 'Talar una lupuna sin el consentimiento espiritual de los ancianos causa desequilibrio en la naturaleza. Es el pilar del cosmos vegetal en Loreto.'
  },

  picaflor: {
    titleKukama: 'Mainuma - Ikatse Yari Mīra',
    titleSpanish: 'Mainuma: El Picaflor que Trajo la Lluvia',
    location: 'Bosques de Varillal de Loreto',
    paragraphs: [
      {
        kukama: 'Wepe karuka tsupi, iwititi ipura tsapari uni mari. Mainuma wira ikatse tsupi wata uni yapurika.',
        spanish: 'En un año de gran sequía en que las flores del monte marchitaban y las cochas se secaban, el pequeño Mainuma (el colibrí) voló con valentía hacia el cielo más alto.',
        interlinear: 'Wepe (Una) karuka tsupi (época en), iwititi (la tierra) uni mari (sin agua estaba)...'
      },
      {
        kukama: 'Mainuma pawa uni tsutsuri tsupi, iwititi kuema eraikatu yapurika pawa.',
        spanish: 'Con su fino pico trajo una gota de rocío celeste que despertó a los nubarrones de lluvia bendita sobre la Amazonía.',
        interlinear: 'Mainuma (El colibrí) pawa (trajo) uni tsutsuri (gota de agua dulce)...'
      }
    ],
    culturalNote: 'Para los kukama, el tamaño de un ser vivo no define su grandeza: la perseverancia y solidaridad del picaflor salvaron a la selva entera.'
  }
};

let currentStoryKey = 'tsuna';
let currentStoryViewMode = 'bilingual'; // 'bilingual', 'kukama', 'spanish'

function initStories() {
  const tabs = document.querySelectorAll('.story-tab');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      currentStoryKey = tab.getAttribute('data-story');
      renderStoryCard();
    });
  });

  renderStoryCard();
}

function renderStoryCard() {
  const story = STORIES_DATABASE[currentStoryKey];
  const container = document.getElementById('storyDisplayContainer');
  if (!story || !container) return;

  let bodyHtml = '';

  if (currentStoryViewMode === 'bilingual') {
    bodyHtml = `
      <div class="story-body-grid">
        <div class="story-text-pane">
          <span class="pane-badge"><i class="fa-solid fa-feather"></i> Lengua Kokama (Kukama-Kukamiria)</span>
          ${story.paragraphs.map(p => `<p class="story-paragraph"><strong>${p.kukama}</strong></p>`).join('')}
        </div>
        <div class="story-text-pane" style="background-color: #FAF6F2;">
          <span class="pane-badge" style="background-color: rgba(140, 94, 60, 0.12); color: var(--color-brown-primary);"><i class="fa-solid fa-language"></i> Traducción al Español</span>
          ${story.paragraphs.map(p => `<p class="story-paragraph">${p.spanish}</p>`).join('')}
        </div>
      </div>
    `;
  } else if (currentStoryViewMode === 'kukama') {
    bodyHtml = `
      <div class="story-text-pane story-single-column">
        <span class="pane-badge"><i class="fa-solid fa-feather"></i> Texto en Lengua Ancestral Kokama</span>
        ${story.paragraphs.map(p => `
          <div style="margin-bottom: 20px;">
            <p class="story-paragraph" style="font-size: 1.18rem; color: var(--color-selva-dark);"><strong>${p.kukama}</strong></p>
            <p style="font-size: 0.85rem; color: var(--color-brown-primary); font-style: italic;">Glosa: ${p.interlinear}</p>
          </div>
        `).join('')}
      </div>
    `;
  } else {
    // Solo Español
    bodyHtml = `
      <div class="story-text-pane story-single-column">
        <span class="pane-badge" style="background-color: rgba(140, 94, 60, 0.12); color: var(--color-brown-primary);"><i class="fa-solid fa-language"></i> Narración en Español</span>
        ${story.paragraphs.map(p => `<p class="story-paragraph" style="font-size: 1.15rem; margin-bottom: 16px;">${p.spanish}</p>`).join('')}
      </div>
    `;
  }

  container.innerHTML = `
    <div class="story-card-top">
      <div class="story-titles">
        <h3>${story.titleKukama}</h3>
        <p>${story.titleSpanish} • <span style="font-size: 0.9rem; color: var(--color-text-muted);"><i class="fa-solid fa-location-dot"></i> ${story.location}</span></p>
      </div>

      <div class="story-controls">
        <button class="btn btn-sm btn-outline" onclick="playSpeechText('${story.titleKukama}', 'Cuento tradicional Kukama')" title="Escuchar título">
          <i class="fa-solid fa-volume-high"></i> Escuchar Título
        </button>

        <div class="view-mode-selector">
          <button class="mode-btn ${currentStoryViewMode === 'bilingual' ? 'active' : ''}" onclick="setStoryMode('bilingual')">Bilingüe</button>
          <button class="mode-btn ${currentStoryViewMode === 'kukama' ? 'active' : ''}" onclick="setStoryMode('kukama')">Solo Kokama</button>
          <button class="mode-btn ${currentStoryViewMode === 'spanish' ? 'active' : ''}" onclick="setStoryMode('spanish')">Español</button>
        </div>
      </div>
    </div>

    ${bodyHtml}

    <div class="story-footer-note">
      <i class="fa-solid fa-book-sparkles"></i>
      <div>
        <strong>Enseñanza y Cosmovisión de los Sabios:</strong>
        <p>${story.culturalNote}</p>
      </div>
    </div>
  `;
}

function setStoryMode(mode) {
  currentStoryViewMode = mode;
  renderStoryCard();
}

/* ==========================================================
   5. JUEGOS INTERACTIVOS (MEMORIA, TRIVIA, ADIVINANZAS)
   ========================================================== */
function switchGame(gameType) {
  document.querySelectorAll('.game-selector-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById('gameMemoryView').style.display = 'none';
  document.getElementById('gameTriviaView').style.display = 'none';
  document.getElementById('gameRiddleView').style.display = 'none';

  if (gameType === 'memory') {
    document.getElementById('btnGameMemory').classList.add('active');
    document.getElementById('gameMemoryView').style.display = 'block';
  } else if (gameType === 'trivia') {
    document.getElementById('btnGameTrivia').classList.add('active');
    document.getElementById('gameTriviaView').style.display = 'block';
  } else if (gameType === 'riddle') {
    document.getElementById('btnGameRiddle').classList.add('active');
    document.getElementById('gameRiddleView').style.display = 'block';
  }
}

/* --- JUEGO 1: MEMORIA DE PALABRAS --- */
const MEMORY_PAIRS = [
  { id: 1, kokama: 'Tsuna', spanish: 'Bufeo Colorado', icon: '🐬' },
  { id: 2, kokama: 'Yawaratara', spanish: 'Jaguar / Otorongo', icon: '🐆' },
  { id: 3, kokama: 'Wepe', spanish: 'Número Uno (1)', icon: '1️⃣' },
  { id: 4, kokama: 'Iwatsu', spanish: 'Paiche Gigante', icon: '🐟' },
  { id: 5, kokama: 'Mainuma', spanish: 'Picaflor / Colibrí', icon: '🐦' },
  { id: 6, kokama: 'Kumapa', spanish: 'Anaconda Sagrada', icon: '🐍' }
];

let memoryCardsState = [];
let flippedCards = [];
let memoryMoves = 0;
let memoryMatches = 0;
let isLockBoard = false;

function initMemoryGame() {
  const grid = document.getElementById('memoryGrid');
  if (!grid) return;

  memoryMoves = 0;
  memoryMatches = 0;
  flippedCards = [];
  isLockBoard = false;

  document.getElementById('memoryMoves').textContent = '0';
  document.getElementById('memoryMatches').textContent = '0 / 6';

  // Crear 12 cartas (6 pares: 6 con palabra en Kokama y 6 con significado en español)
  const deck = [];
  MEMORY_PAIRS.forEach(pair => {
    deck.push({
      pairId: pair.id,
      text: pair.kokama,
      sub: 'Kokama',
      icon: pair.icon,
      isKokama: true
    });
    deck.push({
      pairId: pair.id,
      text: pair.spanish,
      sub: 'Español',
      icon: pair.icon,
      isKokama: false
    });
  });

  // Mezclar baraja (Fisher-Yates)
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  memoryCardsState = deck;
  grid.innerHTML = '';

  deck.forEach((cardData, idx) => {
    const cardEl = document.createElement('div');
    cardEl.className = 'memory-card';
    cardEl.setAttribute('data-index', idx);
    cardEl.setAttribute('data-pair-id', cardData.pairId);

    cardEl.innerHTML = `
      <div class="memory-card-inner">
        <div class="memory-card-front">
          <div class="card-pattern-icon">🌿</div>
          <span class="card-back-hint">Kukama</span>
        </div>
        <div class="memory-card-back">
          <div style="font-size: 1.6rem; margin-bottom: 4px;">${cardData.icon}</div>
          <div class="memory-card-text">${cardData.text}</div>
          <span class="memory-card-sub">${cardData.sub}</span>
        </div>
      </div>
    `;

    cardEl.addEventListener('click', () => handleMemoryCardClick(cardEl, cardData));
    grid.appendChild(cardEl);
  });
}

function handleMemoryCardClick(cardEl, cardData) {
  if (isLockBoard) return;
  if (cardEl.classList.contains('flipped') || cardEl.classList.contains('matched')) return;

  // Voltear carta
  cardEl.classList.add('flipped');
  playClickTone();
  flippedCards.push({ element: cardEl, data: cardData });

  if (cardData.isKokama) {
    playSpeechText(cardData.text, cardData.sub);
  }

  if (flippedCards.length === 2) {
    memoryMoves++;
    document.getElementById('memoryMoves').textContent = memoryMoves;
    checkMemoryMatch();
  }
}

function checkMemoryMatch() {
  const [c1, c2] = flippedCards;
  const isMatch = c1.data.pairId === c2.data.pairId;

  if (isMatch) {
    c1.element.classList.add('matched');
    c2.element.classList.add('matched');
    memoryMatches++;
    document.getElementById('memoryMatches').textContent = `${memoryMatches} / 6`;
    flippedCards = [];

    showToast(`¡Par correcto! ${c1.data.text} = ${c2.data.text} ✨`);

    if (memoryMatches === 6) {
      setTimeout(() => {
        showToast(`🎉 ¡Felicitaciones! ¡Has completado la memoria en ${memoryMoves} movimientos! Eraikatu!`);
      }, 500);
    }
  } else {
    isLockBoard = true;
    setTimeout(() => {
      c1.element.classList.remove('flipped');
      c2.element.classList.remove('flipped');
      flippedCards = [];
      isLockBoard = false;
    }, 1100);
  }
}

/* --- JUEGO 2: TRIVIA AMAZÓNICA --- */
const TRIVIA_QUESTIONS = [
  {
    q: '¿A qué importante familia lingüística pertenece la lengua Kukama-Kukamiria?',
    options: ['Arawak', 'Tupí-Guaraní', 'Pano', 'Jíbaro'],
    correct: 1,
    explanation: 'Pertenece a la familia Tupí-Guaraní, con una historia ancestral de migraciones a lo largo de los ríos amazónicos.'
  },
  {
    q: '¿Cómo se dice el número "Uno" en Kokama?',
    options: ['Mukuika', 'Pichika', 'Wepe', 'Chunka'],
    correct: 2,
    explanation: '¡Exacto! "Wepe" significa uno. "Mukuika" es dos y "Pichika" es cinco.'
  },
  {
    q: '¿Qué animal sagrado del río representa la palabra "Tsuna"?',
    options: ['El Jaguar', 'El Bufeo Colorado', 'El Paiche', 'La Charapa'],
    correct: 1,
    explanation: 'Tsuna es el legendario delfín rosado (bufeo colorado) que habita en las ciudades submarinas del río Marañón.'
  },
  {
    q: '¿Cuántas grafías (letras) componen el alfabeto oficial del pueblo Kukama oficializado por el MINEDU?',
    options: ['12 grafías', '18 grafías', '24 grafías', '28 grafías'],
    correct: 1,
    explanation: 'El alfabeto oficial cuenta con 18 grafías: 5 vocales (a, ë, i, ɨ, u) y 13 consonantes.'
  },
  {
    q: 'En el idioma Kokama, ¿cuál es la respuesta a "Era na kuema" (buenos días) dicha por una mujer?',
    options: ['Era tsa kuema', 'Era ta kuema', 'Tsaniuri', 'Utsurpaki'],
    correct: 0,
    explanation: '¡Correcto! Las mujeres emplean "Era tsa kuema", mientras que los varones responden "Era ta kuema".'
  }
];

let triviaCurrentIndex = 0;
let triviaScore = 0;

function initTriviaGame() {
  triviaCurrentIndex = 0;
  triviaScore = 0;
  renderTriviaQuestion();
}

function renderTriviaQuestion() {
  const wrapper = document.getElementById('triviaWrapper');
  const scoreBadge = document.getElementById('triviaScore');
  const stepBadge = document.getElementById('triviaStep');

  if (!wrapper) return;

  scoreBadge.textContent = `${triviaScore} pts`;
  stepBadge.textContent = `${triviaCurrentIndex + 1} / ${TRIVIA_QUESTIONS.length}`;

  const currentQ = TRIVIA_QUESTIONS[triviaCurrentIndex];

  wrapper.innerHTML = `
    <h4 class="trivia-q-title">${triviaCurrentIndex + 1}. ${currentQ.q}</h4>
    <div class="trivia-options-grid">
      ${currentQ.options.map((opt, i) => `
        <button class="trivia-opt-btn" onclick="handleTriviaAnswer(${i})">
          <span class="trivia-opt-letter">${String.fromCharCode(65 + i)}</span>
          <span>${opt}</span>
        </button>
      `).join('')}
    </div>
    <div class="trivia-feedback-box" id="triviaFeedback"></div>
    <div id="triviaNextContainer" style="display: none; text-align: right; margin-top: 16px;">
      <button class="btn btn-primary btn-sm" onclick="nextTriviaQuestion()">
        ${triviaCurrentIndex < TRIVIA_QUESTIONS.length - 1 ? 'Siguiente Pregunta <i class="fa-solid fa-arrow-right"></i>' : 'Ver Resultado Final 🏆'}
      </button>
    </div>
  `;
}

function handleTriviaAnswer(selectedIndex) {
  const currentQ = TRIVIA_QUESTIONS[triviaCurrentIndex];
  const buttons = document.querySelectorAll('.trivia-opt-btn');
  const feedback = document.getElementById('triviaFeedback');
  const nextContainer = document.getElementById('triviaNextContainer');

  // Deshabilitar botones para evitar dobles clics
  buttons.forEach(btn => btn.disabled = true);

  const isCorrect = selectedIndex === currentQ.correct;

  if (isCorrect) {
    buttons[selectedIndex].classList.add('correct');
    triviaScore += 20;
    document.getElementById('triviaScore').textContent = `${triviaScore} pts`;
    feedback.className = 'trivia-feedback-box success active';
    feedback.innerHTML = `<strong>¡Eraikatu! (¡Excelente respuesta!)</strong><p>${currentQ.explanation}</p>`;
    playClickTone();
  } else {
    buttons[selectedIndex].classList.add('wrong');
    buttons[currentQ.correct].classList.add('correct');
    feedback.className = 'trivia-feedback-box error active';
    feedback.innerHTML = `<strong>Respuesta incorrecta:</strong><p>${currentQ.explanation}</p>`;
  }

  nextContainer.style.display = 'block';
}

function nextTriviaQuestion() {
  triviaCurrentIndex++;
  if (triviaCurrentIndex < TRIVIA_QUESTIONS.length) {
    renderTriviaQuestion();
  } else {
    // Pantalla final
    const wrapper = document.getElementById('triviaWrapper');
    wrapper.innerHTML = `
      <div style="text-align: center; padding: 24px;">
        <div style="font-size: 3.5rem; color: var(--color-brown-primary); margin-bottom: 12px;">🏆</div>
        <h3 style="font-family: var(--font-heading); font-size: 1.8rem; color: var(--color-selva-dark); margin-bottom: 8px;">¡Desafío Concluido!</h3>
        <p style="font-size: 1.1rem; color: var(--color-text-muted); margin-bottom: 24px;">
          Puntuación final: <strong>${triviaScore} de 100 puntos</strong>
        </p>
        <p style="font-size: 1.05rem; color: var(--color-selva-primary); font-weight: 700; margin-bottom: 24px;">
          ${triviaScore >= 80 ? '¡Eres un Yachachiq (Maestro) de la cultura Kokama!' : '¡Buen intento! Cada palabra aprendida mantiene viva la memoria de la selva.'}
        </p>
        <button class="btn btn-primary" onclick="initTriviaGame()">
          <i class="fa-solid fa-rotate-right"></i> Jugar Nuevamente
        </button>
      </div>
    `;
  }
}

/* --- JUEGO 3: ADIVINANZAS DE LA SELVA --- */
const RIDDLES = [
  {
    verse: '“Nado en las hondas cochas del río Marañón. Mi piel viste el color del atardecer y llevo un sombrero de paja cuando visito las fiestas ribereñas... ¿Quién soy?”',
    kukamaAnswer: 'Tsuna (Bufeo Colorado)',
    hint: 'Delfín rosado de agua dulce',
    revealed: false
  },
  {
    verse: '“Camino sigiloso con manchas de noche y sol sobre mi pelaje. Los abuelos me llaman señor y guardián supremo de la selva virgen... ¿Quién soy?”',
    kukamaAnswer: 'Yawaratara (El Jaguar / Otorongo)',
    hint: 'El felino más grande de la Amazonía',
    revealed: false
  },
  {
    verse: '“Soy tan diminuto como una hoja de bijao tierna, pero volé hasta el cielo más alto para traer la primera gota de agua cuando la selva tenía sed... ¿Quién soy?”',
    kukamaAnswer: 'Mainuma (El Picaflor / Colibrí)',
    hint: 'Ave mensajera',
    revealed: false
  }
];

let currentRiddleIndex = 0;

function initRiddles() {
  renderCurrentRiddle();
}

function renderCurrentRiddle() {
  const wrapper = document.getElementById('riddleWrapper');
  if (!wrapper) return;

  const riddle = RIDDLES[currentRiddleIndex];

  wrapper.innerHTML = `
    <div class="riddle-icon"><i class="fa-solid fa-feather-pointed"></i></div>
    <span style="font-size: 0.85rem; font-weight: 700; color: var(--color-brown-primary); text-transform: uppercase;">Adivinanza ${currentRiddleIndex + 1} de ${RIDDLES.length}</span>
    <p class="riddle-verse">${riddle.verse}</p>

    <div style="display: flex; justify-content: center; gap: 12px; margin-bottom: 16px;">
      <button class="btn btn-secondary btn-sm" onclick="revealRiddleAnswer()">
        <i class="fa-solid fa-eye"></i> Revelar Respuesta
      </button>
      <button class="btn btn-outline btn-sm" onclick="nextRiddle()">
        Siguiente Adivinanza <i class="fa-solid fa-forward-step"></i>
      </button>
    </div>

    <div class="riddle-reveal-box" id="riddleRevealBox">
      <h4 class="riddle-answer-title">${riddle.kukamaAnswer}</h4>
      <p style="color: var(--color-text-muted); font-size: 0.95rem;">Pista: ${riddle.hint}</p>
      <button class="audio-btn-sample" style="margin-top: 12px; color: var(--color-selva-dark); border-color: var(--color-brown-light);" onclick="playSpeechText('${riddle.kukamaAnswer}', 'Respuesta en Kokama')">
        <i class="fa-solid fa-volume-high"></i> Escuchar en Kokama
      </button>
    </div>
  `;
}

function revealRiddleAnswer() {
  const box = document.getElementById('riddleRevealBox');
  if (box) {
    box.classList.add('show');
    playClickTone();
  }
}

function nextRiddle() {
  currentRiddleIndex = (currentRiddleIndex + 1) % RIDDLES.length;
  renderCurrentRiddle();
}

/* ==========================================================
   6. FORMULARIO DE CONTACTO Y TOAST
   ========================================================== */
function handleContactSubmit(event) {
  event.preventDefault();

  const nameInput = document.getElementById('contactName');
  const emailInput = document.getElementById('contactEmail');
  const messageInput = document.getElementById('contactMessage');

  const name = nameInput.value.trim();

  // Animación de éxito
  showToast(`¡Utsurpaki (Muchas gracias), ${name}! Tu mensaje ha sido enviado al equipo del Proyecto Kokama.`);

  // Limpiar campos
  nameInput.value = '';
  emailInput.value = '';
  messageInput.value = '';
}

function showToast(message) {
  const toast = document.getElementById('toastNotification');
  const toastMsg = document.getElementById('toastMessage');

  if (!toast || !toastMsg) return;

  toastMsg.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}

