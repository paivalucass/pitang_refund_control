import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import dayjs from "dayjs";

export type ExtractedEntities = {
  text: string;
  amount?: number;
  expenseDate?: string;
  description?: string;
  descriptionMatchScore?: number;
  categoryName?: string;
  categoryConfidence?: number;
  matchedKeywords?: string[];
};

export type AnalysisInput = {
  amount: number;
  expenseDate: Date | string;
  description: string;
  categoryName?: string;
};

export type AnalysisResult = {
  score: number;
  matches: {
    amount: boolean;
    expenseDate: boolean;
    descriptionSimilarity: number;
  };
  extracted: ExtractedEntities;
};

type PdfParse = (buffer: Buffer) => Promise<{ text?: string }>;
type TesseractModule = {
  recognize: (
    buffer: Buffer,
    language?: string,
    options?: { cachePath?: string; langPath?: string }
  ) => Promise<{ data?: { text?: string } }>;
};

const MONEY_REGEX = /(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2}|\d+\.\d{2})/g;
const DATE_REGEX = /\b(?:(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})|(\d{4})-(\d{1,2})-(\d{1,2}))\b/g;
const DOCUMENT_ID_REGEX = /\b(?:cpf|cnpj)?\s*\d{2,3}\.?\d{3}\.?\d{3}[\/.-]?\d{2,4}-?\d{2}\b/i;
const TOTAL_CONTEXT_REGEX = /\b(?:total|valor\s*(?:total|pago)?|pagamento|liquido|líquido|a\s*pagar|importe)\b/i;
const WEAK_AMOUNT_CONTEXT_REGEX = /\b(?:subtotal|desconto|troco|taxa|acrescimo|acréscimo)\b/i;
const DESCRIPTION_STOPWORDS = new Set([
  "com",
  "da",
  "das",
  "de",
  "despesa",
  "do",
  "dos",
  "empresa",
  "firma",
  "na",
  "no",
  "para",
]);
const CATEGORY_PROFILES = [
  {
    categoryName: "Transporte",
    label: "transporte",
    keywords: [
      "99 app",
      "99 taxi",
      "99 táxi",
      "abastecimento",
      "aeroporto",
      "app",
      "cabify",
      "combustivel",
      "combustível",
      "corrida",
      "estacionamento",
      "gasolina",
      "guiche",
      "guichê",
      "in drive",
      "indrive",
      "metro",
      "metrô",
      "mobilidade",
      "onibus",
      "ônibus",
      "passagem",
      "pedagio",
      "pedágio",
      "posto",
      "shell",
      "taxi",
      "táxi",
      "transporte",
      "uber",
      "veiculo",
      "veículo",
    ],
  },
  {
    categoryName: "Alimentação",
    label: "alimentação",
    keywords: [
      "acai",
      "açaí",
      "alimento",
      "almoco",
      "almoço",
      "bar",
      "burguer",
      "burger",
      "cafe",
      "café",
      "cafeteria",
      "cantina",
      "churrascaria",
      "delivery",
      "ifood",
      "janta",
      "jantar",
      "lanche",
      "lanchonete",
      "marmita",
      "padaria",
      "pizzaria",
      "pizza",
      "pizzas",
      "burguer",
      "burguers",
      "hamburguer",
      "refeicao",
      "refeição",
      "restaurante",
      "sorveteria",
      "supermercado",
      "99 food"
    ],
  },
  {
    categoryName: "Hospedagem",
    label: "hospedagem",
    keywords: [
      "airbnb",
      "apart hotel",
      "booking",
      "diaria",
      "diária",
      "flat",
      "hospedagem",
      "hostel",
      "hotel",
      "inn",
      "pousada",
      "reserva",
    ],
  },
  {
    categoryName: "Cursos e Certificações",
    label: "curso ou certificação",
    keywords: [
      "aula",
      "certificacao",
      "certificação",
      "certificado",
      "congresso",
      "curso",
      "evento",
      "inscricao",
      "inscrição",
      "palestra",
      "seminario",
      "seminário",
      "treinamento",
      "workshop",
    ],
  },
  {
    categoryName: "Equipamentos",
    label: "equipamento",
    keywords: [
      "adaptador",
      "cabo",
      "carregador",
      "computador",
      "equipamento",
      "fone",
      "hardware",
      "headset",
      "monitor",
      "mouse",
      "notebook",
      "periferico",
      "periférico",
      "teclado",
      "webcam",
    ],
  },
] as const;
const CATEGORY_KEYWORDS = new Set(CATEGORY_PROFILES.flatMap((profile) => profile.keywords.map((keyword) => stripAccents(keyword).toLowerCase())));

type ExtractEntitiesOptions = {
  userDescription?: string;
  expectedAmount?: number;
};

export async function extractText(fileBuffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === "application/pdf") {
    return extractPdfText(fileBuffer);
  }

  if (mimeType === "image/jpeg" || mimeType === "image/png") {
    return extractImageText(fileBuffer);
  }

  return fallbackBufferText(fileBuffer);
}

async function extractPdfText(fileBuffer: Buffer): Promise<string> {
  const cliText = await extractPdfTextWithCli(fileBuffer);
  if (hasUsefulText(cliText)) return normalizeText(cliText);

  try {
    const pdfParse = await loadModuleDefault<PdfParse>("pdf-parse");
    const parsed = await pdfParse(fileBuffer);
    const text = normalizeText(parsed.text ?? "");
    if (hasUsefulText(text)) return text;
  } catch {
    // Try the OCR fallback below.
  }

  const ocrText = await extractPdfTextWithOcr(fileBuffer);
  if (hasUsefulText(ocrText)) return normalizeText(ocrText);

  return "";
}

async function extractImageText(fileBuffer: Buffer): Promise<string> {
  try {
    const tesseract = await loadModuleDefault<TesseractModule>("tesseract.js");
    const langPath = await ensureTesseractLangPath();
    const result = await tesseract.recognize(fileBuffer, "por+eng", {
      cachePath: path.join(os.tmpdir(), "pitang-tesseract-cache"),
      langPath,
    });
    return normalizeText(result.data?.text ?? "");
  } catch {
    return normalizeText(fallbackBufferText(fileBuffer));
  }
}

async function ensureTesseractLangPath() {
  const targetDir = path.join(os.tmpdir(), "pitang-tesseract-data");
  await fs.mkdir(targetDir, { recursive: true });
  await Promise.all([
    ensureTesseractLanguageFile("eng", targetDir),
    ensureTesseractLanguageFile("por", targetDir),
  ]);
  return targetDir;
}

async function ensureTesseractLanguageFile(language: "eng" | "por", targetDir: string) {
  const targetPath = path.join(targetDir, `${language}.traineddata.gz`);
  try {
    await fs.access(targetPath);
    return;
  } catch {
    // Copy the bundled language file below.
  }

  const sourcePath = path.resolve(
    process.cwd(),
    "node_modules",
    "@tesseract.js-data",
    language,
    "4.0.0",
    `${language}.traineddata.gz`
  );
  await fs.copyFile(sourcePath, targetPath);
}

async function extractPdfTextWithCli(fileBuffer: Buffer) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "pitang-pdf-text-"));
  const pdfPath = path.join(tempDir, "receipt.pdf");
  try {
    await fs.writeFile(pdfPath, fileBuffer);
    return await runCommand("pdftotext", ["-layout", pdfPath, "-"], 8000);
  } catch {
    return "";
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

async function extractPdfTextWithOcr(fileBuffer: Buffer) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "pitang-pdf-ocr-"));
  const pdfPath = path.join(tempDir, "receipt.pdf");
  const imagePrefix = path.join(tempDir, "page");
  try {
    await fs.writeFile(pdfPath, fileBuffer);
    await runCommand("pdftoppm", ["-png", "-r", "200", "-f", "1", "-l", "2", pdfPath, imagePrefix], 15000);
    const files = (await fs.readdir(tempDir))
      .filter((fileName) => fileName.endsWith(".png"))
      .sort();
    const texts = await Promise.all(
      files.map(async (fileName) => extractImageText(await fs.readFile(path.join(tempDir, fileName))))
    );
    return texts.join("\n");
  } catch {
    return "";
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

async function loadModuleDefault<T>(moduleName: string): Promise<T> {
  const dynamicImport = new Function("moduleName", "return import(moduleName)");
  const imported = await dynamicImport(moduleName);
  return (imported.default ?? imported) as T;
}

function fallbackBufferText(fileBuffer: Buffer) {
  return fileBuffer.toString("utf8").replace(/[^\x09\x0A\x0D\x20-\x7EÀ-ÿ]/g, " ");
}

export function extractEntities(text: string, options?: string | ExtractEntitiesOptions): ExtractedEntities {
  const extractionOptions = typeof options === "string" ? { userDescription: options } : options;
  const normalizedText = normalizeText(text);
  const amount = extractAmount(normalizedText, extractionOptions?.expectedAmount);
  const expenseDate = extractDate(normalizedText);
  const category = inferCategory(normalizedText);
  const matchedDescription = findBestDescriptionMatch(normalizedText, extractionOptions?.userDescription);

  return {
    text: normalizedText,
    amount,
    expenseDate,
    description: matchedDescription?.description ?? buildDescription(category),
    descriptionMatchScore: matchedDescription?.score,
    categoryName: category?.categoryName,
    categoryConfidence: category?.confidence,
    matchedKeywords: category?.matchedKeywords,
  };
}

function extractAmount(text: string, expectedAmount?: number): number | undefined {
  const candidates = moneyCandidates(text);

  if (expectedAmount !== undefined) {
    const matchingCandidate = candidates.find((candidate) => amountsMatch(candidate.value, expectedAmount));
    return matchingCandidate ? expectedAmount : undefined;
  }

  const reliableCandidates = candidates
    .filter((candidate) => candidate.score >= 2)
    .sort((left, right) => right.score - left.score || right.value - left.value);

  return reliableCandidates[0]?.value;
}

function extractDate(text: string): string | undefined {
  for (const match of text.matchAll(DATE_REGEX)) {
    const day = match[1] ?? match[6];
    const month = match[2] ?? match[5];
    const year = normalizeYear(match[3] ?? match[4]);
    const parsed = dayjs(`${year}-${month?.padStart(2, "0")}-${day?.padStart(2, "0")}`);
    if (parsed.isValid()) return parsed.format("YYYY-MM-DD");
  }
  return undefined;
}

function normalizeYear(year = "") {
  return year.length === 2 ? `20${year}` : year;
}

type MoneyCandidate = {
  value: number;
  score: number;
  line: string;
};

function moneyCandidates(text: string): MoneyCandidate[] {
  const candidates: MoneyCandidate[] = [];
  for (const line of text.split(/\n+/)) {
    const trimmedLine = line.trim();
    if (!trimmedLine || DOCUMENT_ID_REGEX.test(trimmedLine)) continue;

    MONEY_REGEX.lastIndex = 0;
    for (const match of trimmedLine.matchAll(MONEY_REGEX)) {
      const raw = match[0];
      if (!hasSafeMoneyBoundaries(trimmedLine, match.index ?? 0, raw.length)) continue;

      const value = parseMoney(raw);
      if (value === undefined) continue;

      const hasCurrencySymbol = raw.includes("R$");
      const hasTotalContext = TOTAL_CONTEXT_REGEX.test(trimmedLine);
      const hasWeakContext = WEAK_AMOUNT_CONTEXT_REGEX.test(trimmedLine);
      const score = (hasCurrencySymbol ? 3 : 0) + (hasTotalContext ? 5 : 0) + (hasWeakContext ? 1 : 0);

      candidates.push({ value, score, line: trimmedLine });
    }
  }
  return candidates;
}

function parseMoney(raw: string) {
  const numeric = raw.replace(/R\$/i, "").trim();
  const normalized = numeric.includes(",")
    ? numeric.replace(/\./g, "").replace(",", ".")
    : numeric;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : undefined;
}

function hasSafeMoneyBoundaries(line: string, index: number, length: number) {
  const before = line[index - 1] ?? "";
  const after = line[index + length] ?? "";
  return !/[0-9./-]/.test(before) && !/[0-9./-]/.test(after);
}

function amountsMatch(left: number, right: number) {
  return Math.abs(left - right) < 0.01;
}

type InferredCategory = {
  categoryName: string;
  label: string;
  confidence: number;
  matchedKeywords: string[];
};

function inferCategory(text: string): InferredCategory | undefined {
  const normalized = stripAccents(textWithoutDocumentIds(text)).toLowerCase();
  const candidates = CATEGORY_PROFILES.map((profile) => {
    const matchedKeywords = profile.keywords
      .filter((keyword) => containsKeyword(normalized, keyword))
      .sort((left, right) => keywordIndex(normalized, left) - keywordIndex(normalized, right));
    return {
      categoryName: profile.categoryName,
      label: profile.label,
      matchedKeywords,
      confidence: Math.min(1, 0.7 + Math.max(0, matchedKeywords.length - 1) * 0.15),
    };
  })
    .filter((profile) => profile.matchedKeywords.length > 0)
    .sort((left, right) => right.confidence - left.confidence || right.matchedKeywords.length - left.matchedKeywords.length);

  return candidates[0];
}

function textWithoutDocumentIds(text: string) {
  return text
    .split(/\n+/)
    .filter((line) => !DOCUMENT_ID_REGEX.test(line))
    .join("\n");
}

function containsKeyword(normalizedText: string, keyword: string) {
  const pattern = stripAccents(keyword)
    .toLowerCase()
    .split(/\s+/)
    .map(escapeRegExp)
    .join("\\s+");
  return new RegExp(`\\b${pattern}\\b`).test(normalizedText);
}

function keywordIndex(normalizedText: string, keyword: string) {
  const normalizedKeyword = stripAccents(keyword).toLowerCase();
  const index = normalizedText.indexOf(normalizedKeyword);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function buildDescription(category?: InferredCategory) {
  if (!category) return undefined;
  const keyword = category.matchedKeywords[0];
  const suffix = keyword ? ` - ${toTitleCase(keyword)}` : "";
  return `Despesa de ${category.label}${suffix}`;
}

function findBestDescriptionMatch(text: string, userDescription?: string) {
  if (!userDescription?.trim()) return undefined;

  const candidates = descriptionCandidates(text);
  const evidenceTokens = descriptionEvidenceTokens(userDescription);
  const scored = candidates
    .map((candidate) => ({
      description: candidate,
      score: Math.max(
        localTokenSimilarity(userDescription, candidate),
        merchantEvidenceScore(candidate, evidenceTokens)
      ),
    }))
    .filter((candidate) => candidate.score >= 0.2)
    .sort((left, right) => right.score - left.score || left.description.length - right.description.length);

  return scored[0];
}

function descriptionEvidenceTokens(description: string) {
  return normalizedTokens(description).filter(
    (token) => token.length >= 5 && !DESCRIPTION_STOPWORDS.has(token) && !CATEGORY_KEYWORDS.has(token)
  );
}

function merchantEvidenceScore(candidate: string, evidenceTokens: string[]) {
  if (evidenceTokens.length === 0) return 0;

  const candidateTokens = normalizedTokens(candidate);
  const hasMerchantEvidence = evidenceTokens.some((token) =>
    candidateTokens.some((candidateToken) => tokensMatch(token, candidateToken))
  );

  return hasMerchantEvidence ? 1 : 0;
}

function tokensMatch(left: string, right: string) {
  if (left === right) return true;
  if (left.length < 6 || right.length < 6) return false;
  return levenshteinDistance(left, right) <= 1;
}

function descriptionCandidates(text: string) {
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 4 && line.length <= 120 && !hasCurrency(line) && !hasDate(line));

  const windows: string[] = [];
  for (let index = 0; index < lines.length - 1; index += 1) {
    const window = `${lines[index]} ${lines[index + 1]}`.trim();
    if (window.length <= 160) windows.push(window);
  }

  return [...new Set([...lines, ...windows])];
}

function hasCurrency(text: string) {
  MONEY_REGEX.lastIndex = 0;
  return MONEY_REGEX.test(text);
}

function hasDate(text: string) {
  DATE_REGEX.lastIndex = 0;
  return DATE_REGEX.test(text);
}

export async function analyzeDocument(
  fileBuffer: Buffer,
  mimeType: string,
  input: AnalysisInput
): Promise<AnalysisResult> {
  const text = await extractText(fileBuffer, mimeType);
  const extracted = extractEntities(text, {
    userDescription: input.description,
    expectedAmount: Number(input.amount),
  });
  return calculateConfiabilityScore(extracted, input);
}

export async function calculateConfiabilityScore(
  extracted: ExtractedEntities,
  input: AnalysisInput
): Promise<AnalysisResult> {
  const amountMatches =
    extracted.amount !== undefined && Math.abs(extracted.amount - Number(input.amount)) < 0.01;
  const inputDate = dayjs(input.expenseDate).format("YYYY-MM-DD");
  const dateMatches = Boolean(extracted.expenseDate && extracted.expenseDate === inputDate);
  const descriptionSimilarity = await calculateDescriptionScore(extracted, input);
  const score =
    (amountMatches ? 33.3 : 0) +
    (dateMatches ? 33.3 : 0) +
    (Math.max(0, Math.min(1, descriptionSimilarity)) * 33.4);

  return {
    score: Number(score.toFixed(1)),
    matches: {
      amount: amountMatches,
      expenseDate: dateMatches,
      descriptionSimilarity: Number(descriptionSimilarity.toFixed(3)),
    },
    extracted,
  };
}

async function calculateDescriptionScore(extracted: ExtractedEntities, input: AnalysisInput) {
  if (extracted.descriptionMatchScore !== undefined) {
    return extracted.descriptionMatchScore;
  }

  if (input.categoryName && extracted.categoryName) {
    const sameCategory = normalizeCategory(input.categoryName) === normalizeCategory(extracted.categoryName);
    return sameCategory ? (extracted.categoryConfidence ?? 1) : 0;
  }

  return calculateSimilarity(extracted.text, input.description);
}

function hasUsefulText(text: string) {
  return normalizedTokens(text).length >= 3;
}

export async function calculateSimilarity(left: string, right: string): Promise<number> {
  const scriptPath = path.resolve(process.cwd(), "scripts", "similarity.py");
  try {
    await fs.access(scriptPath);
    return await runSimilarityScript(scriptPath, left, right);
  } catch {
    return tokenSimilarity(left, right);
  }
}

function runSimilarityScript(scriptPath: string, left: string, right: string): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn("python3", [scriptPath], { stdio: ["pipe", "pipe", "ignore"] });
    let output = "";
    const timeout = setTimeout(() => {
      child.kill();
      resolve(tokenSimilarity(left, right));
    }, 5000);

    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.on("error", () => {
      clearTimeout(timeout);
      resolve(tokenSimilarity(left, right));
    });
    child.on("close", () => {
      clearTimeout(timeout);
      const score = Number(output.trim());
      resolve(Number.isFinite(score) ? Math.max(0, Math.min(1, score)) : tokenSimilarity(left, right));
    });
    child.stdin.end(JSON.stringify({ left, right }));
  });
}

function runCommand(command: string, args: string[], timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "ignore"] });
    let output = "";
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error(`${command} timed out`));
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });
    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve(output);
        return;
      }
      reject(new Error(`${command} exited with code ${code}`));
    });
  });
}

function tokenSimilarity(left: string, right: string) {
  return localTokenSimilarity(left, right);
}

function localTokenSimilarity(left: string, right: string) {
  const leftCounts = countTokens(left);
  const rightCounts = countTokens(right);
  const terms = new Set([...leftCounts.keys(), ...rightCounts.keys()]);
  if (terms.size === 0) return 0;

  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  for (const term of terms) {
    const leftValue = leftCounts.get(term) ?? 0;
    const rightValue = rightCounts.get(term) ?? 0;
    dot += leftValue * rightValue;
  }
  for (const value of leftCounts.values()) leftNorm += value * value;
  for (const value of rightCounts.values()) rightNorm += value * value;
  if (leftNorm === 0 || rightNorm === 0) return 0;
  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}

function countTokens(text: string) {
  const counts = new Map<string, number>();
  for (const token of normalizedTokens(text)) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  return counts;
}

function normalizedTokens(text: string) {
  return stripAccents(normalizeText(text)).toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

function normalizeText(text: string) {
  return text.replace(/\r/g, "\n").replace(/[ \t]+/g, " ").trim();
}

function normalizeCategory(value: string) {
  return stripAccents(value).toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function stripAccents(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toTitleCase(value: string) {
  return value.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
}

function levenshteinDistance(left: string, right: string) {
  const previous = Array.from({ length: right.length + 1 }, (_value, index) => index);

  for (let leftIndex = 0; leftIndex < left.length; leftIndex += 1) {
    const current = [leftIndex + 1];
    for (let rightIndex = 0; rightIndex < right.length; rightIndex += 1) {
      const insertion = (current[rightIndex] ?? Number.MAX_SAFE_INTEGER) + 1;
      const deletion = (previous[rightIndex + 1] ?? Number.MAX_SAFE_INTEGER) + 1;
      const substitution = (previous[rightIndex] ?? Number.MAX_SAFE_INTEGER) + (left[leftIndex] === right[rightIndex] ? 0 : 1);
      current.push(Math.min(insertion, deletion, substitution));
    }
    previous.splice(0, previous.length, ...current);
  }

  return previous[right.length] ?? Number.MAX_SAFE_INTEGER;
}
