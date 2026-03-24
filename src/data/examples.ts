export interface Example {
  label: string;
  tag: 'Bad' | 'Mediocre' | 'Good';
  text: string;
}

export const examples: Example[] = [
  {
    label: 'Vague event invite',
    tag: 'Bad',
    text: `hey everyone

just wanted to let you know there is a big event happening soon. it should be really fun and we're expecting a lot of people. would love for everyone to be there if you can make it.

there'll be a lot of great stuff going on. more details coming later.

let me know if you're coming

bye`,
  },
  {
    label: 'Course announcement (PT)',
    tag: 'Mediocre',
    text: `Fala aí, beleza?

Acabei de disponibilizar um curso gratuito de Codex, onde tu vai aprender os principais recursos da ferramenta criando projetos

Vamos falar sobre: a interface, principais configurações, melhores estratégias para criação de projetos e uso do Codex, e muito mais

São 40 minutos, num ritmo bom de seguir, tudo passo a passo, desde a instalação da ferramenta

>>> Clique aqui para acessar

Obs: deixe aquela força dando um like no vídeo, e se não for inscrito: inscreva-se =)

Um abraço,
Matheus`,
  },
  {
    label: 'Well-structured order',
    tag: 'Good',
    text: `Subject: Your Order #12847 Has Been Shipped

From: support@store.com
To: customer@email.com

Hi Sarah,

Great news — your order has been shipped and is on its way.

Order Details:
- Order #12847
- Item: Blue Wireless Headphones (x1)
- Carrier: FedEx
- Tracking #: 1Z999AA10123456784

Estimated Delivery: March 26, 2026 by 8:00 PM EST

Track your package: https://track.fedex.com/1Z999AA10123456784

Questions? Reply to this email or contact support@store.com

Thanks for your order!
Store Support Team`,
  },
];
