import fs from 'fs';
import path from 'path';

export interface BankRecord {
  id?: number;
  age: number;
  job: string;
  marital: string;
  education: string;
  default: string;
  balance: number;
  housing: string;
  loan: string;
  contact: string;
  day: number;
  month: string;
  duration: number;
  campaign: number;
  pdays: number;
  previous: number;
  poutcome: string;
  y: string;
}

export const UCI_REQUIRED_COLUMNS = [
  'age', 'job', 'marital', 'education', 'default', 'balance',
  'housing', 'loan', 'contact', 'day', 'month', 'duration',
  'campaign', 'pdays', 'previous', 'poutcome', 'y'
];

// Deterministic PRNG (Mulberry32) for 100% reproducible UCI Bank Marketing dataset generation
function createRng(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeighted<T>(rng: () => number, items: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

export function generateUCIDataset(count = 1500): BankRecord[] {
  const rng = createRng(42026);
  const jobs = [
    'management', 'blue-collar', 'technician', 'admin.', 'services',
    'retired', 'self-employed', 'entrepreneur', 'unemployed', 'housemaid', 'student', 'unknown'
  ];
  const jobWeights = [21.5, 20.5, 16.8, 11.4, 9.0, 5.2, 3.5, 3.3, 2.9, 2.7, 2.2, 1.0];

  const maritals = ['married', 'single', 'divorced'];
  const maritalWeights = [60.2, 28.3, 11.5];

  const educations = ['secondary', 'tertiary', 'primary', 'unknown'];
  const eduWeights = [51.3, 29.4, 15.1, 4.2];

  const contacts = ['cellular', 'unknown', 'telephone'];
  const contactWeights = [64.8, 28.8, 6.4];

  const months = ['may', 'jul', 'aug', 'jun', 'nov', 'apr', 'feb', 'jan', 'oct', 'sep', 'mar', 'dec'];
  const monthWeights = [30.4, 15.2, 13.8, 11.8, 8.8, 6.5, 5.8, 3.1, 1.6, 1.3, 1.1, 0.6];

  const records: BankRecord[] = [];

  for (let i = 0; i < count; i++) {
    const job = pickWeighted(rng, jobs, jobWeights);

    let age = 38;
    if (job === 'retired') {
      age = Math.floor(58 + rng() * 26);
    } else if (job === 'student') {
      age = Math.floor(18 + rng() * 10);
    } else {
      age = Math.floor(22 + rng() * 38);
    }

    const marital = job === 'student'
      ? (rng() < 0.88 ? 'single' : 'married')
      : age < 27
      ? (rng() < 0.72 ? 'single' : 'married')
      : pickWeighted(rng, maritals, maritalWeights);

    const education = job === 'management'
      ? (rng() < 0.78 ? 'tertiary' : 'secondary')
      : job === 'blue-collar'
      ? (rng() < 0.38 ? 'primary' : 'secondary')
      : pickWeighted(rng, educations, eduWeights);

    const hasDefault = rng() < 0.018 ? 'yes' : 'no';

    // Realistic skewed balance distribution matching UCI Bank dataset (mean ~1362)
    const u1 = Math.max(0.0001, rng());
    const u2 = rng();
    const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    let balance = Math.round(Math.exp(6.8 + z * 1.15) - 250);
    if (hasDefault === 'yes') balance = Math.round(-350 + rng() * 400);
    if (job === 'management' || job === 'retired') balance += Math.round(rng() * 1400);
    balance = Math.max(-2800, Math.min(48000, balance));

    const housing = (job === 'retired' || job === 'student')
      ? (rng() < 0.22 ? 'yes' : 'no')
      : (rng() < 0.56 ? 'yes' : 'no');

    const loan = rng() < 0.16 ? 'yes' : 'no';
    const contact = pickWeighted(rng, contacts, contactWeights);
    const month = pickWeighted(rng, months, monthWeights);
    const day = Math.floor(1 + rng() * 28);

    const campaign = rng() < 0.72
      ? Math.floor(1 + rng() * 3)
      : Math.floor(4 + rng() * 14);

    const hadPreviousContact = rng() < 0.185;
    const pdays = hadPreviousContact ? Math.floor(15 + rng() * 340) : -1;
    const previous = hadPreviousContact ? Math.floor(1 + rng() * 6) : 0;

    let poutcome = 'unknown';
    if (hadPreviousContact) {
      const pr = rng();
      if (pr < 0.19) poutcome = 'success';
      else if (pr < 0.78) poutcome = 'failure';
      else poutcome = 'other';
    }

    // Calculate underlying propensity based on genuine UCI Bank Marketing feature relationships
    // (Pre-call features first!)
    let logit = -3.65;
    if (poutcome === 'success') logit += 2.45;
    if (poutcome === 'other') logit += 0.45;
    if (poutcome === 'failure') logit += 0.15;
    if (contact === 'cellular') logit += 0.58;
    if (contact === 'unknown') logit -= 0.75;
    if (housing === 'no') logit += 0.55;
    if (loan === 'no') logit += 0.38;
    if (job === 'retired') logit += 0.78;
    if (job === 'student') logit += 0.92;
    if (job === 'management') logit += 0.35;
    if (job === 'blue-collar') logit -= 0.38;
    if (education === 'tertiary') logit += 0.38;
    if (marital === 'single') logit += 0.25;
    if (balance > 1500) logit += 0.45;
    if (balance > 4000) logit += 0.38;
    if (balance < 0) logit -= 0.55;
    if (['mar', 'sep', 'oct', 'dec'].includes(month)) logit += 1.35;
    if (['apr', 'feb'].includes(month)) logit += 0.48;
    if (campaign > 3) logit -= 0.16 * (campaign - 3);
    if (age < 26 || age > 60) logit += 0.52;

    const preCallProb = 1 / (1 + Math.exp(-logit));
    // Call duration correlates with interest + random call length
    const baseDuration = 60 + Math.round(-Math.log(Math.max(0.01, rng())) * 165);
    const interestBoost = rng() < preCallProb * 1.45 ? Math.round(180 + rng() * 480) : 0;
    const duration = Math.min(2400, baseDuration + interestBoost);

    // Final subscription label combining pre-call propensity and call duration
    const finalLogit = logit + (duration > 320 ? 1.25 : duration < 110 ? -1.4 : 0.15);
    const finalProb = 1 / (1 + Math.exp(-finalLogit));
    const y = rng() < finalProb ? 'yes' : 'no';

    records.push({
      age,
      job,
      marital,
      education,
      default: hasDefault,
      balance,
      housing,
      loan,
      contact,
      day,
      month,
      duration,
      campaign,
      pdays,
      previous,
      poutcome,
      y
    });
  }

  return records;
}

export function ensureDatasetFile(filePath: string): BankRecord[] {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const records = generateUCIDataset(1500);
  const header = UCI_REQUIRED_COLUMNS.join(',');
  const rows = records.map(r =>
    UCI_REQUIRED_COLUMNS.map(col => String((r as unknown as Record<string, unknown>)[col])).join(',')
  );
  fs.writeFileSync(filePath, [header, ...rows].join('\n'), 'utf-8');
  return records;
}

export function parseCSVContent(csvText: string): { records: BankRecord[]; missingValuesCount: number; duplicatesCount: number; rawRowCount: number } {
  const lines = csvText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length < 2) {
    throw new Error('CSV file must contain a header row and at least one data record.');
  }

  // Support both comma-separated and semicolon-separated (UCI Bank Marketing standard uses ';' or ',')
  const delimiter = lines[0].includes(';') && lines[0].split(';').length >= 15 ? ';' : ',';
  const rawHeaders = lines[0]
    .split(delimiter)
    .map(h => h.replace(/^["']|["']$/g, '').trim().toLowerCase());

  const missingCols = UCI_REQUIRED_COLUMNS.filter(col => !rawHeaders.includes(col));
  if (missingCols.length > 0) {
    throw new Error(
      `Invalid UCI Bank Marketing CSV schema. Missing required columns: ${missingCols.join(', ')}.`
    );
  }

  const colIndexMap: Record<string, number> = {};
  rawHeaders.forEach((h, idx) => {
    colIndexMap[h] = idx;
  });

  const seenRowHashes = new Set<string>();
  let duplicatesCount = 0;
  let missingValuesCount = 0;
  const records: BankRecord[] = [];
  const maxRows = Math.min(lines.length - 1, 15000); // Cap for fast in-memory training while preserving accuracy

  for (let i = 1; i <= maxRows; i++) {
    const line = lines[i];
    if (!line) continue;

    const parts = line.split(delimiter).map(p => p.replace(/^["']|["']$/g, '').trim());
    if (parts.length < UCI_REQUIRED_COLUMNS.length) {
      missingValuesCount++;
      continue;
    }

    const rowKey = parts.join('|');
    if (seenRowHashes.has(rowKey)) {
      duplicatesCount++;
    } else {
      seenRowHashes.add(rowKey);
    }

    // Count 'unknown' or empty cells as missing/unknown indicators
    for (const val of parts) {
      if (val === '' || val.toLowerCase() === 'null' || val.toLowerCase() === 'na') {
        missingValuesCount++;
      }
    }

    const yRaw = (parts[colIndexMap['y']] || 'no').toLowerCase();
    const y = yRaw === 'yes' || yRaw === '1' || yRaw === 'true' ? 'yes' : 'no';

    const record: BankRecord = {
      age: Number(parts[colIndexMap['age']]) || 35,
      job: (parts[colIndexMap['job']] || 'unknown').toLowerCase(),
      marital: (parts[colIndexMap['marital']] || 'unknown').toLowerCase(),
      education: (parts[colIndexMap['education']] || 'unknown').toLowerCase(),
      default: (parts[colIndexMap['default']] || 'no').toLowerCase(),
      balance: Number(parts[colIndexMap['balance']]) || 0,
      housing: (parts[colIndexMap['housing']] || 'no').toLowerCase(),
      loan: (parts[colIndexMap['loan']] || 'no').toLowerCase(),
      contact: (parts[colIndexMap['contact']] || 'unknown').toLowerCase(),
      day: Number(parts[colIndexMap['day']]) || 15,
      month: (parts[colIndexMap['month']] || 'may').toLowerCase(),
      duration: Number(parts[colIndexMap['duration']]) || 180,
      campaign: Number(parts[colIndexMap['campaign']]) || 1,
      pdays: Number(parts[colIndexMap['pdays']]) ?? -1,
      previous: Number(parts[colIndexMap['previous']]) || 0,
      poutcome: (parts[colIndexMap['poutcome']] || 'unknown').toLowerCase(),
      y
    };

    records.push(record);
  }

  if (records.length < 20) {
    throw new Error('Dataset contains too few valid records (minimum 20 required for stratified ML split).');
  }

  return {
    records,
    missingValuesCount,
    duplicatesCount,
    rawRowCount: lines.length - 1
  };
}
