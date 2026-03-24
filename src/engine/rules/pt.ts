import type { Rules } from './types';

const w = (word: string, weight: 1 | 2 | 3) => ({ word, weight });

export const ptRules: Rules = {
  indicatorWords: [
    'de', 'para', 'que', 'com', 'não', 'uma', 'por', 'você', 'está',
    'são', 'mais', 'como', 'mas', 'seu', 'sua', 'isso', 'bem', 'ou',
    'em', 'no', 'na', 'os', 'as', 'ao', 'às', 'pelo', 'pela', 'aqui',
    'esse', 'essa', 'nós', 'nos', 'um', 'o', 'a', 'e', 'do', 'da',
    'dos', 'das', 'tu', 'vai', 'tudo', 'muito', 'também', 'já', 'foi',
  ],

  typeKeywords: {
    event: [
      w('transmissão ao vivo', 3), w('evento ao vivo', 3), w('ir ao vivo', 3),
      w('webinar', 3), w('conferência', 3), w('seminário', 3), w('palestra', 3),
      w('workshop ao vivo', 3),
      w('evento', 2), w('reunião', 2), w('encontro', 2), w('sessão', 2),
      w('cerimônia', 2), w('lançamento', 2),
      w('live', 2), w('ao vivo', 2), w('acontecimento', 1),
    ],
    course: [
      w('você vai aprender', 3), w('você aprenderá', 3), w('recursos da ferramenta', 3),
      w('principais recursos', 3), w('instalação da ferramenta', 3),
      w('criando projetos', 3), w('certificação', 3), w('bootcamp', 3),
      w('masterclass', 3), w('mentoria', 3), w('imersão', 3), w('trilha', 3),
      w('curso', 2), w('treinamento', 2), w('aula', 2), w('módulo', 2),
      w('turma', 2), w('passo a passo', 2), w('do zero', 2), w('aprenda', 2),
      w('programa', 1), w('para iniciantes', 1),
    ],
    content: [
      w('acabei de disponibilizar', 3), w('acabei de lançar', 3),
      w('acabei de publicar', 3), w('like no vídeo', 3), w('novo episódio', 3),
      w('youtube', 3), w('se inscrever no canal', 3),
      w('vídeo', 2), w('video', 2), w('podcast', 2), w('episódio', 2),
      w('novo vídeo', 2), w('assista', 2), w('ouça', 2), w('canal', 2),
      w('publicado', 2),
      w('artigo', 1), w('curta', 1),
    ],
    promotion: [
      w('acesso gratuito', 3), w('de graça', 3), w('frete grátis', 3),
      w('preço especial', 2), w('desconto', 2), w('oferta', 2),
      w('promoção', 2), w('cupom', 2), w('economia', 2), w('liquidação', 2),
      w('compre agora', 2), w('imperdível', 2),
      w('grátis', 2), w('gratuito', 2), w('economize', 1), w('aproveite', 1),
      w('exclusivo', 1),
    ],
    newsletter: [
      w('resumo semanal', 3), w('resumo mensal', 3), w('curadoria', 3),
      w('seleção da semana', 3), w('conteúdos da semana', 3),
      w('links da semana', 3), w('mais lidos', 3),
      w('newsletter', 3), w('destaques', 2), w('selecionados', 2), w('edição', 2),
    ],
    billing: [
      w('valor em aberto', 3), w('pagamento em atraso', 3), w('nota fiscal', 3),
      w('débito automático', 3), w('fatura', 2), w('boleto', 2),
      w('cobrança', 2), w('mensalidade', 2), w('comprovante', 2),
      w('vencimento', 2), w('renovação', 2), w('assinatura', 2), w('pagamento', 1),
    ],
    alert: [
      w('aviso de segurança', 3), w('atividade incomum', 3), w('acesso suspeito', 3),
      w('conta bloqueada', 3), w('senha alterada', 3), w('risco de segurança', 3),
      w('não autorizado', 3), w('comprometido', 3),
      w('alerta', 2), w('suspeito', 2), w('detectado', 2), w('verifique', 2),
      w('atenção', 1),
    ],
    transaction: [
      w('pedido confirmado', 3), w('pedido enviado', 3), w('código de rastreio', 3),
      w('reserva confirmada', 3), w('download disponível', 3),
      w('redefinição de senha', 3), w('compra aprovada', 3),
      w('número de confirmação', 3), w('seu pedido foi', 3),
      w('conta criada', 2), w('enviamos seu', 2),
      w('bem-vindo', 1),
    ],
    informational: [
      w('gostaríamos de informar', 3), w('é para informar', 3),
      w('ficou disponível', 3), w('informação importante', 3),
      w('vamos falar sobre', 2), w('principais configurações', 2),
      w('melhores estratégias', 2), w('desde a instalação', 2),
      w('atualização', 1), w('comunicado', 1), w('aviso', 1), w('lembrete', 1),
    ],
  },

  subtypeKeywords: {
    'event/live': [
      w('transmissão ao vivo', 3), w('ir ao vivo', 3), w('evento ao vivo', 3),
      w('ao vivo', 2), w('live', 2),
    ],
    'event/webinar': [
      w('webinar', 3), w('evento virtual', 2), w('link do zoom', 3),
      w('participe online', 2), w('online ao vivo', 2),
    ],
    'event/meeting': [
      w('reunião', 3), w('reunião de equipe', 3), w('conversa individual', 3),
      w('call', 2), w('sincronização', 1),
    ],
    'course/mentorship': [
      w('mentoria', 3), w('mentorado', 3),
      w('mentor', 2), w('coaching', 3), w('orientação personalizada', 2),
    ],
    'course/workshop': [
      w('workshop', 3), w('prático', 2), w('sessão prática', 2),
      w('laboratório', 2),
    ],
    'course/bootcamp': [
      w('bootcamp', 3), w('imersão', 3), w('intensivo', 2), w('programa completo', 2),
    ],
    'course/recorded': [
      w('no seu ritmo', 3), w('disponível agora', 3), w('gravado', 3),
      w('assista quando quiser', 3), w('aula gravada', 2),
    ],
    'promotion/discount': [
      w('desconto', 3), w('cupom', 3), w('de graça', 3),
      w('economize', 2), w('% de desconto', 3),
    ],
    'promotion/flash_sale': [
      w('só hoje', 3), w('por tempo limitado', 3), w('nas próximas 24h', 3),
      w('tempo limitado', 2), w('24 horas', 2),
    ],
    'billing/reminder': [
      w('lembrete de pagamento', 3), w('vence em breve', 3),
      w('próximo vencimento', 2), w('lembrete', 2),
    ],
    'billing/overdue': [
      w('pagamento em atraso', 3), w('valor em aberto', 3),
      w('último aviso', 3), w('cobrança pendente', 3),
    ],
    'billing/renewal': [
      w('renovação automática', 3), w('sua assinatura renova', 3),
      w('renovação da assinatura', 3), w('débito automático', 2),
    ],
  },

  intentSignals: {
    invite: [
      w('você está convidado', 3), w('participe', 3), w('junte-se a nós', 3),
      w('compareça', 2), w('venha', 2),
    ],
    sell: [
      w('compre agora', 3), w('adquira', 3), w('de graça', 3),
      w('oferta', 2), w('desconto', 2), w('aproveite', 1),
    ],
    remind: [
      w('não esqueça', 3), w('um lembrete', 3), w('último aviso', 3),
      w('não perca', 2), w('lembrete', 2),
    ],
    charge: [
      w('vencimento', 3), w('fatura', 3), w('boleto', 3),
      w('pague agora', 3), w('pagamento em atraso', 3),
    ],
    inform: [
      w('gostaríamos de informar', 3), w('é para informar', 3),
      w('comunicamos', 2), w('informamos', 2), w('saiba que', 2),
    ],
    warn: [
      w('aviso de segurança', 3), w('atividade suspeita', 3), w('comprometido', 3),
      w('alerta', 2), w('risco de segurança', 3),
    ],
    confirm: [
      w('pedido confirmado', 3), w('reserva confirmada', 3),
      w('confirmamos', 2), w('confirmado', 3), w('com sucesso', 2),
    ],
    educate: [
      w('você vai aprender', 3), w('você aprenderá', 3),
      w('passo a passo', 2), w('aula', 2), w('aprenda', 2),
    ],
  },

  enrollmentWords: [
    'inscreva-se', 'cadastre-se', 'matricule-se', 'garanta sua vaga',
    'reserve seu lugar', 'participe', 'vagas limitadas', 'vagas disponíveis',
    'inscrições abertas', 'faça sua inscrição', 'acesso gratuito',
    'acesse agora', 'se inscrever', 'fazer a inscrição',
  ],

  ctaWords: [
    'clique aqui', 'clique abaixo', 'inscreva-se', 'cadastre-se',
    'acesse', 'acesse agora', 'compre agora', 'baixe agora', 'baixe',
    'assine', 'pague agora', 'confirme', 'verifique', 'comece agora',
    'saiba mais', 'veja mais', 'acesse o link', 'entre agora', 'participe',
    'garanta sua vaga', 'reserve seu lugar', 'clique para', 'leia mais',
    'assista agora', 'clique aqui para acessar', 'acesse o curso',
    'acesse o vídeo',
  ],

  urgencyHigh: [
    'urgente', 'imediatamente', 'agora mesmo', 'emergência',
    'última chance', 'expira hoje', 'só hoje', 'ação necessária',
    'não ignore', 'resposta necessária', 'encerra hoje', 'prazo hoje',
  ],
  urgencyMedium: [
    'expira', 'expirando', 'prazo', 'não perca', 'corra',
    '24 horas', '48 horas', 'apenas essa semana', 'termina em breve',
    'último aviso', 'último dia', 'tempo limitado',
  ],

  ambiguousTerms: [
    'em breve', 'logo mais', 'eventualmente', 'a qualquer momento',
    'vamos avisar', 'mais detalhes em breve', 'fique atento', 'aguarde',
    'a definir', 'a confirmar', 'próximos dias', 'num futuro próximo',
    'em breve mais detalhes',
  ],

  monthNames: {
    janeiro: 1, fevereiro: 2, março: 3, marco: 3, abril: 4, maio: 5,
    junho: 6, julho: 7, agosto: 8, setembro: 9, outubro: 10,
    novembro: 11, dezembro: 12,
    jan: 1, fev: 2, mar: 3, abr: 4, mai: 5, jun: 6, jul: 7,
    ago: 8, set: 9, out: 10, nov: 11, dez: 12,
  },

  relativeToday: ['hoje'],
  relativeTomorrow: ['amanhã', 'amanha'],
  relativeDayAfterTomorrow: ['depois de amanhã', 'depois de amanha'],
  relativeNextWeek: [
    'semana que vem', 'próxima semana', 'proxima semana',
    'próxima segunda', 'próxima terça', 'próxima quarta',
    'próxima quinta', 'próxima sexta',
  ],

  greetingPattern:  /^(oi|olá|ola|fala|e aí|e ai|bom dia|boa tarde|boa noite|prezado|prezada|caro|cara|tudo bem|beleza|como vai)/im,
  signaturePattern: /\b(um abraço|abraços|atenciosamente|cordialmente|obrigado|obrigada|até mais|grande abraço|forte abraço|tchau|valeu|att)\b/i,
};
