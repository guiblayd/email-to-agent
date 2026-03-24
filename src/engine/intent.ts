import type { ParsedData, EmailType, Intent } from '../types';

const TYPE_INTENT_MAP: Record<EmailType, Intent> = {
  event:         'invite',
  course:        'educate',
  content:       'inform',
  promotion:     'sell',
  newsletter:    'inform',
  billing:       'charge',
  alert:         'warn',
  transaction:   'confirm',
  informational: 'inform',
  unknown:       'unknown',
};

/** Reminder and other cross-type override phrases */
const REMINDER_PHRASES = [
  'reminder', 'just a reminder', "don't forget", 'final reminder', "don't miss",
  'lembrete', 'não esqueça', 'último aviso', 'não perca',
];

export function detectIntent(data: ParsedData, emailType: EmailType): Intent {
  const lower = data.rawText.toLowerCase();

  // Reminder override — applies across types unless alert/billing already has a stronger signal
  if (emailType !== 'alert' && emailType !== 'billing') {
    if (REMINDER_PHRASES.some(p => lower.includes(p))) return 'remind';
  }

  return TYPE_INTENT_MAP[emailType];
}
