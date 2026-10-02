export const LANGS = ['es', 'pt'];

export const strings = {
  es: {
    contactTitle: '¿Hablamos? Déjame tu correo',
    namePlaceholder: 'Tu nombre',
    emailPlaceholder: 'Tu correo',
    submit: 'Enviar',
    sending: 'Enviando…',
    success: '¡Gracias! Te escribiré pronto.',
    invalidName: 'Escribe tu nombre.',
    invalidEmail: 'Correo no válido.',
    error: 'No se pudo enviar. Inténtalo de nuevo.',
    loadError: 'No se pudieron cargar los links.',
    retry: 'Reintentar',
  },
  pt: {
    contactTitle: 'Vamos conversar? Deixe seu e-mail',
    namePlaceholder: 'Seu nome',
    emailPlaceholder: 'Seu e-mail',
    submit: 'Enviar',
    sending: 'Enviando…',
    success: 'Obrigado! Vou te escrever em breve.',
    invalidName: 'Digite seu nome.',
    invalidEmail: 'E-mail inválido.',
    error: 'Não foi possível enviar. Tente novamente.',
    loadError: 'Não foi possível carregar os links.',
    retry: 'Tentar novamente',
  },
};

export function initialLang() {
  const fromQuery = new URLSearchParams(window.location.search).get('lang');
  if (LANGS.includes(fromQuery)) return fromQuery;
  try {
    const saved = localStorage.getItem('lang');
    if (LANGS.includes(saved)) return saved;
  } catch {
    /* storage no disponible */
  }
  return navigator.language?.toLowerCase().startsWith('pt') ? 'pt' : 'es';
}

export function persistLang(lang) {
  try {
    localStorage.setItem('lang', lang);
  } catch {
    /* storage no disponible */
  }
}
