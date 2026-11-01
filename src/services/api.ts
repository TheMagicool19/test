import { SystemTelemetry, RoutingLogItem, FeynmanChallengeResponse } from '../types/navicella';

export async function fetchSystemState(): Promise<SystemTelemetry> {
  const res = await fetch('/api/system/state');
  if (!res.ok) throw new Error('Impossibile recuperare lo stato del sistema');
  return res.json();
}

export async function sendNicoMessage(message: string, contextHistory: any[] = []): Promise<{
  success: boolean;
  rawUserMessage: string;
  intentClassification: string;
  functionCalls: any[];
  executionLogs: any[];
  subRoutines: any[];
  telegramReply: string;
  systemState: SystemTelemetry;
}> {
  const res = await fetch('/api/nico/route', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, contextHistory }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Errore di routing N.I.C.O.');
  }
  return res.json();
}

export async function sendErmesWebhook(payload: any): Promise<any> {
  const res = await fetch('/api/ermes/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function transcribeAudio(audioBase64: string, mimeType: string = 'audio/webm'): Promise<{ text: string; source: string }> {
  const res = await fetch('/api/ermes/transcribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ audioBase64, mimeType }),
  });
  if (!res.ok) throw new Error('Errore trascrizione audio');
  return res.json();
}

export async function analyzeVision(imageBase64: string, mode: 'general' | 'molecule' = 'general'): Promise<{ analysis: string; source: string }> {
  const res = await fetch('/api/ermes/vision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mode }),
  });
  if (!res.ok) throw new Error('Errore analisi immagine');
  return res.json();
}

export async function runEnzymaticFilter(rawNote: string): Promise<{ typedMarkdown: string; status: string }> {
  const res = await fetch('/api/dna/enzymatic-filter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rawNote }),
  });
  if (!res.ok) throw new Error('Errore filtro enzimatico');
  return res.json();
}

export async function runFeynmanChallenge(topic: string, explanation: string, rigorLevel: string = 'Severo'): Promise<FeynmanChallengeResponse> {
  const res = await fetch('/api/lewis/feynman', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, explanation, rigorLevel }),
  });
  if (!res.ok) throw new Error('Errore valutazione Feynman');
  return res.json();
}

export async function submitFaradayCheckin(answers: { sleepHours: number; mentalFatigue: number; stressScore: number }): Promise<any> {
  const res = await fetch('/api/faraday/checkin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers }),
  });
  if (!res.ok) throw new Error('Errore check-in F.A.R.A.D.A.Y.');
  return res.json();
}

export async function fetchWhitelist(): Promise<any> {
  const res = await fetch('/api/security/whitelist');
  return res.json();
}

export async function updateWhitelist(data: { allowedChatIds?: string[]; allowedUserIds?: string[]; authEnabled?: boolean }): Promise<any> {
  const res = await fetch('/api/security/whitelist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}
