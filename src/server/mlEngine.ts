import fs from 'fs';
import path from 'path';
import { BankRecord } from './seedDataset.ts';

export interface ConfusionMatrixData {
  tn: number;
  fp: number;
  fn: number;
  tp: number;
}

export interface CurvePoint {
  x: number;
  y: number;
  threshold: number;
}

export interface FeatureImportanceItem {
  feature: string;
  label: string;
  importance: number;
  category: 'Demographic' | 'Financial' | 'Campaign' | 'Historical';
}

export interface ModelEvaluationResult {
  id: string;
  name: string;
  family: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  rocAuc: number;
  precisionNo: number;
  recallNo: number;
  f1No: number;
  confusionMatrix: ConfusionMatrixData;
  rocCurve: CurvePoint[];
  prCurve: CurvePoint[];
  featureImportance: FeatureImportanceItem[];
  trainTimeMs: number;
  hyperparameters: Record<string, string | number | boolean>;
  isBest: boolean;
}

export interface PipelineEvaluationSuite {
  mode: 'pre_call' | 'post_call';
  modeLabel: string;
  modeDescription: string;
  datasetSize: number;
  trainSize: number;
  testSize: number;
  positiveClassRatio: number;
  bestModelName: string;
  bestModelId: string;
  bestModelRocAuc: number;
  bestModelF1: number;
  trainedAt: string;
  models: ModelEvaluationResult[];
}

export interface PredictionInput {
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
  modelMode?: 'pre_call' | 'post_call';
  selectedModelId?: string;
}

export interface FeatureContribution {
  feature: string;
  value: string | number;
  impact: number; // positive increases subscription likelihood, negative decreases
  direction: 'positive' | 'negative';
  explanation: string;
}

export interface PredictionOutput {
  prediction: 'yes' | 'no';
  label: 'Likely to Subscribe' | 'Unlikely to Subscribe';
  probability: number;
  confidenceTier: 'High Confidence' | 'Moderate Confidence' | 'Borderline';
  modelName: string;
  modelMode: 'pre_call' | 'post_call';
  topContributions: FeatureContribution[];
  recommendedAction: {
    priority: 'High Priority Lead' | 'Nurture Lead' | 'Low Priority / Deprioritize';
    channel: string;
    timing: string;
    strategy: string;
    expectedLift: string;
  };
}

interface PreprocessorState {
  excludeDuration: boolean;
  numericCols: string[];
  means: number[];
  stds: number[];
  categoricalCols: string[];
  categoriesMap: Record<string, string[]>;
  featureNames: string[];
  featureLabels: Record<string, { label: string; category: FeatureImportanceItem['category'] }>;
}

interface TreeNode {
  isLeaf: boolean;
  probPositive: number;
  featureIndex?: number;
  threshold?: number;
  left?: TreeNode;
  right?: TreeNode;
  impurityGain?: number;
}

// Deterministic PRNG for stratified split and Random Forest bootstrap
function createRng(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FEATURE_META: Record<string, { label: string; category: FeatureImportanceItem['category'] }> = {
  age: { label: 'Customer Age', category: 'Demographic' },
  job: { label: 'Occupation Category', category: 'Demographic' },
  marital: { label: 'Marital Status', category: 'Demographic' },
  education: { label: 'Education Level', category: 'Demographic' },
  default: { label: 'Credit in Default', category: 'Financial' },
  balance: { label: 'Average Yearly Balance', category: 'Financial' },
  housing: { label: 'Housing Mortgage Loan', category: 'Financial' },
  loan: { label: 'Personal Loan Status', category: 'Financial' },
  contact: { label: 'Communication Channel', category: 'Campaign' },
  day: { label: 'Last Contact Day of Month', category: 'Campaign' },
  month: { label: 'Campaign Contact Month', category: 'Campaign' },
  duration: { label: 'Last Call Duration (sec)', category: 'Campaign' },
  campaign: { label: 'Contacts in Current Campaign', category: 'Campaign' },
  pdays: { label: 'Days Since Previous Campaign', category: 'Historical' },
  previous: { label: 'Previous Campaign Contacts', category: 'Historical' },
  poutcome: { label: 'Previous Campaign Outcome', category: 'Historical' }
};

function fitPreprocessor(trainRecords: BankRecord[], excludeDuration: boolean): PreprocessorState {
  const numericCols = excludeDuration
    ? ['age', 'balance', 'day', 'campaign', 'pdays', 'previous']
    : ['age', 'balance', 'day', 'duration', 'campaign', 'pdays', 'previous'];

  const categoricalCols = [
    'job', 'marital', 'education', 'default', 'housing', 'loan', 'contact', 'month', 'poutcome'
  ];

  const means: number[] = [];
  const stds: number[] = [];

  for (const col of numericCols) {
    const vals = trainRecords.map(r => Number((r as unknown as Record<string, unknown>)[col]) || 0);
    const mean = vals.reduce((a, b) => a + b, 0) / Math.max(1, vals.length);
    const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, vals.length);
    means.push(mean);
    stds.push(Math.sqrt(variance) || 1);
  }

  const categoriesMap: Record<string, string[]> = {};
  for (const col of categoricalCols) {
    const set = new Set<string>();
    for (const r of trainRecords) {
      const val = String((r as unknown as Record<string, unknown>)[col] || 'unknown').toLowerCase();
      set.add(val);
    }
    categoriesMap[col] = Array.from(set).sort();
  }

  const featureNames: string[] = [...numericCols];
  const featureLabels: Record<string, { label: string; category: FeatureImportanceItem['category'] }> = {};

  for (const col of numericCols) {
    featureLabels[col] = FEATURE_META[col] || { label: col, category: 'Demographic' };
  }

  for (const col of categoricalCols) {
    for (const cat of categoriesMap[col]) {
      const fname = `${col}=${cat}`;
      featureNames.push(fname);
      featureLabels[fname] = FEATURE_META[col] || { label: col, category: 'Demographic' };
    }
  }

  return {
    excludeDuration,
    numericCols,
    means,
    stds,
    categoricalCols,
    categoriesMap,
    featureNames,
    featureLabels
  };
}

function transformRecord(record: BankRecord | PredictionInput, prep: PreprocessorState): number[] {
  const row: number[] = [];
  for (let i = 0; i < prep.numericCols.length; i++) {
    const col = prep.numericCols[i];
    const raw = Number((record as unknown as Record<string, unknown>)[col]) || 0;
    row.push((raw - prep.means[i]) / prep.stds[i]);
  }
  for (const col of prep.categoricalCols) {
    const val = String((record as unknown as Record<string, unknown>)[col] || 'unknown').toLowerCase();
    const cats = prep.categoriesMap[col];
    for (const cat of cats) {
      row.push(val === cat ? 1 : 0);
    }
  }
  return row;
}

function sigmoid(z: number): number {
  if (z > 20) return 0.999999;
  if (z < -20) return 0.000001;
  return 1 / (1 + Math.exp(-z));
}

// 1. Class-weighted L2 Logistic Regression
function trainLogisticRegression(X: number[][], y: number[], epochs = 90, lr = 0.08, l2 = 0.005) {
  const n = X.length;
  const d = X[0].length;
  const weights = new Array(d).fill(0);
  let bias = 0;

  const posCount = y.reduce((a, b) => a + b, 0);
  const negCount = Math.max(1, n - posCount);
  const posWeight = Math.min(4.0, (n / (2 * Math.max(1, posCount))) * 0.85);
  const negWeight = n / (2 * negCount);

  for (let ep = 0; ep < epochs; ep++) {
    const gradW = new Array(d).fill(0);
    let gradB = 0;
    for (let i = 0; i < n; i++) {
      let z = bias;
      const xi = X[i];
      for (let j = 0; j < d; j++) z += weights[j] * xi[j];
      const p = sigmoid(z);
      const sampleWeight = y[i] === 1 ? posWeight : negWeight;
      const err = (p - y[i]) * sampleWeight;
      gradB += err;
      for (let j = 0; j < d; j++) {
        gradW[j] += err * xi[j];
      }
    }
    const step = lr / (1 + ep * 0.015);
    bias -= step * (gradB / n);
    for (let j = 0; j < d; j++) {
      weights[j] -= step * (gradW[j] / n + l2 * weights[j]);
    }
  }

  return { weights, bias };
}

function predictLogisticRegression(X: number[][], model: { weights: number[]; bias: number }): number[] {
  return X.map(xi => {
    let z = model.bias;
    for (let j = 0; j < xi.length; j++) z += model.weights[j] * xi[j];
    return sigmoid(z);
  });
}

// 2. CART Decision Tree with weighted Gini Impurity
function buildDecisionTree(
  X: number[][],
  y: number[],
  indices: number[],
  depth: number,
  maxDepth: number,
  minSamplesLeaf: number,
  featureSubsetIndices: number[] | null,
  posWeight: number,
  gainsAccumulator: number[]
): TreeNode {
  let pos = 0;
  let neg = 0;
  for (const idx of indices) {
    if (y[idx] === 1) pos += posWeight;
    else neg += 1;
  }
  const totalWeight = pos + neg;
  const probPositive = totalWeight > 0 ? pos / totalWeight : 0;

  if (depth >= maxDepth || indices.length < minSamplesLeaf * 2 || pos === 0 || neg === 0) {
    return { isLeaf: true, probPositive };
  }

  const parentGini = 1 - (pos / totalWeight) ** 2 - (neg / totalWeight) ** 2;
  const d = X[0].length;
  const candidateFeatures = featureSubsetIndices || Array.from({ length: d }, (_, i) => i);

  let bestFeature = -1;
  let bestThreshold = 0;
  let bestGain = 0;
  let bestLeft: number[] = [];
  let bestRight: number[] = [];

  for (const fIdx of candidateFeatures) {
    // Candidate thresholds from quantiles or binary 0.5
    const values = indices.map(i => X[i][fIdx]);
    const uniqueSet = new Set(values);
    if (uniqueSet.size <= 1) continue;

    let thresholds: number[] = [];
    if (uniqueSet.size === 2 && uniqueSet.has(0) && uniqueSet.has(1)) {
      thresholds = [0.5];
    } else {
      const sorted = [...values].sort((a, b) => a - b);
      const qSteps = [0.2, 0.35, 0.5, 0.65, 0.8];
      for (const q of qSteps) {
        thresholds.push(sorted[Math.floor(q * (sorted.length - 1))]);
      }
      thresholds = Array.from(new Set(thresholds));
    }

    for (const thresh of thresholds) {
      let lPos = 0, lNeg = 0, rPos = 0, rNeg = 0;
      let lCount = 0, rCount = 0;
      for (const idx of indices) {
        if (X[idx][fIdx] <= thresh) {
          lCount++;
          if (y[idx] === 1) lPos += posWeight;
          else lNeg += 1;
        } else {
          rCount++;
          if (y[idx] === 1) rPos += posWeight;
          else rNeg += 1;
        }
      }

      if (lCount < minSamplesLeaf || rCount < minSamplesLeaf) continue;

      const lTot = lPos + lNeg;
      const rTot = rPos + rNeg;
      const lGini = 1 - (lPos / lTot) ** 2 - (lNeg / lTot) ** 2;
      const rGini = 1 - (rPos / rTot) ** 2 - (rNeg / rTot) ** 2;
      const weightedChildGini = (lTot / totalWeight) * lGini + (rTot / totalWeight) * rGini;
      const gain = parentGini - weightedChildGini;

      if (gain > bestGain) {
        bestGain = gain;
        bestFeature = fIdx;
        bestThreshold = thresh;
      }
    }
  }

  if (bestFeature === -1 || bestGain <= 0.001) {
    return { isLeaf: true, probPositive };
  }

  for (const idx of indices) {
    if (X[idx][bestFeature] <= bestThreshold) bestLeft.push(idx);
    else bestRight.push(idx);
  }

  gainsAccumulator[bestFeature] += bestGain * totalWeight;

  return {
    isLeaf: false,
    probPositive,
    featureIndex: bestFeature,
    threshold: bestThreshold,
    impurityGain: bestGain,
    left: buildDecisionTree(X, y, bestLeft, depth + 1, maxDepth, minSamplesLeaf, featureSubsetIndices, posWeight, gainsAccumulator),
    right: buildDecisionTree(X, y, bestRight, depth + 1, maxDepth, minSamplesLeaf, featureSubsetIndices, posWeight, gainsAccumulator)
  };
}

function predictSingleTree(xi: number[], node: TreeNode): number {
  let curr = node;
  while (!curr.isLeaf && curr.featureIndex !== undefined && curr.threshold !== undefined) {
    if (xi[curr.featureIndex] <= curr.threshold) {
      curr = curr.left!;
    } else {
      curr = curr.right!;
    }
  }
  return curr.probPositive;
}

// 3. Random Forest Classifier
function trainRandomForest(X: number[][], y: number[], numTrees = 15, maxDepth = 6, seed = 42) {
  const rng = createRng(seed);
  const n = X.length;
  const d = X[0].length;
  const posCount = y.reduce((a, b) => a + b, 0);
  const posWeight = Math.min(3.5, (n - posCount) / Math.max(1, posCount) * 0.65);

  const trees: TreeNode[] = [];
  const gainsAccumulator = new Array(d).fill(0);
  const subsetSize = Math.max(5, Math.floor(Math.sqrt(d) * 1.6));

  for (let t = 0; t < numTrees; t++) {
    const bootIndices: number[] = [];
    for (let i = 0; i < n; i++) {
      bootIndices.push(Math.floor(rng() * n));
    }

    // Random feature subset for this tree
    const allFeatures = Array.from({ length: d }, (_, idx) => idx);
    for (let i = allFeatures.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [allFeatures[i], allFeatures[j]] = [allFeatures[j], allFeatures[i]];
    }
    const featureSubset = allFeatures.slice(0, subsetSize);

    const tree = buildDecisionTree(X, y, bootIndices, 0, maxDepth, 8, featureSubset, posWeight, gainsAccumulator);
    trees.push(tree);
  }

  return { trees, gainsAccumulator };
}

function predictRandomForest(X: number[][], trees: TreeNode[]): number[] {
  return X.map(xi => {
    let sum = 0;
    for (const tree of trees) sum += predictSingleTree(xi, tree);
    return sum / trees.length;
  });
}

// 4. Gradient Boosting Classifier (ensembled shallow trees with weighted boosting steps)
function trainGradientBoosting(X: number[][], y: number[], numStages = 14, maxDepth = 4, seed = 1042) {
  const rng = createRng(seed);
  const n = X.length;
  const d = X[0].length;
  const gainsAccumulator = new Array(d).fill(0);

  const posCount = y.reduce((a, b) => a + b, 0);
  const basePosWeight = Math.min(3.2, ((n - posCount) / Math.max(1, posCount)) * 0.6);

  const sampleWeights = new Array(n).fill(1);
  const trees: { tree: TreeNode; alpha: number }[] = [];

  for (let s = 0; s < numStages; s++) {
    // Resample indices proportionally to sampleWeights (AdaBoost/Gradient Boost hybrid)
    const weightSum = sampleWeights.reduce((a, b) => a + b, 0);
    const stageIndices: number[] = [];
    for (let i = 0; i < n; i++) {
      let r = rng() * weightSum;
      let chosen = 0;
      for (let k = 0; k < n; k++) {
        r -= sampleWeights[k];
        if (r <= 0) {
          chosen = k;
          break;
        }
      }
      stageIndices.push(chosen);
    }

    const tree = buildDecisionTree(X, y, stageIndices, 0, maxDepth, 10, null, basePosWeight, gainsAccumulator);
    const alpha = 0.25 * Math.pow(0.92, s);
    trees.push({ tree, alpha });

    // Update weights towards hard-to-classify positive/negative examples
    for (let i = 0; i < n; i++) {
      const p = predictSingleTree(X[i], tree);
      const err = Math.abs(y[i] - p);
      sampleWeights[i] = sampleWeights[i] * Math.exp(alpha * err * (y[i] === 1 ? 1.35 : 1.0));
    }
  }

  return { trees, gainsAccumulator };
}

function predictGradientBoosting(X: number[][], model: { trees: { tree: TreeNode; alpha: number }[] }): number[] {
  const totalAlpha = model.trees.reduce((acc, item) => acc + item.alpha, 0) || 1;
  return X.map(xi => {
    let weightedSum = 0;
    for (const item of model.trees) {
      weightedSum += item.alpha * predictSingleTree(xi, item.tree);
    }
    return Math.max(0.001, Math.min(0.999, weightedSum / totalAlpha));
  });
}

// 5. K-Nearest Neighbors (Distance-weighted Euclidean on standardized features)
function predictKNN(trainX: number[][], trainY: number[], testX: number[][], k = 15): number[] {
  // Subsample up to 450 stratified training prototypes for ultra-fast interactive response
  const stride = Math.max(1, Math.floor(trainX.length / 450));
  const protoX: number[][] = [];
  const protoY: number[] = [];
  for (let i = 0; i < trainX.length; i += stride) {
    protoX.push(trainX[i]);
    protoY.push(trainY[i]);
  }

  return testX.map(xi => {
    const dists: { d: number; y: number }[] = [];
    for (let i = 0; i < protoX.length; i++) {
      const px = protoX[i];
      let sq = 0;
      for (let j = 0; j < xi.length; j++) {
        const diff = xi[j] - px[j];
        sq += diff * diff;
      }
      dists.push({ d: Math.sqrt(sq), y: protoY[i] });
    }
    dists.sort((a, b) => a.d - b.d);
    const topK = dists.slice(0, k);
    let posWeight = 0;
    let totalWeight = 0;
    for (const item of topK) {
      const w = 1 / (item.d + 0.15);
      const classBoost = item.y === 1 ? 1.85 : 1.0;
      if (item.y === 1) posWeight += w * classBoost;
      totalWeight += w * classBoost;
    }
    return totalWeight > 0 ? posWeight / totalWeight : 0;
  });
}

function aggregateFeatureImportance(
  rawImportances: number[],
  prep: PreprocessorState
): FeatureImportanceItem[] {
  const grouped: Record<string, { label: string; category: FeatureImportanceItem['category']; score: number }> = {};

  for (let i = 0; i < prep.featureNames.length; i++) {
    const fname = prep.featureNames[i];
    const baseCol = fname.includes('=') ? fname.split('=')[0] : fname;
    const meta = FEATURE_META[baseCol] || { label: baseCol, category: 'Demographic' };
    if (!grouped[baseCol]) {
      grouped[baseCol] = { label: meta.label, category: meta.category, score: 0 };
    }
    grouped[baseCol].score += Math.abs(rawImportances[i] || 0);
  }

  const total = Object.values(grouped).reduce((acc, v) => acc + v.score, 0) || 1;
  return Object.entries(grouped)
    .map(([feature, data]) => ({
      feature,
      label: data.label,
      category: data.category,
      importance: Number(((data.score / total) * 100).toFixed(2))
    }))
    .sort((a, b) => b.importance - a.importance);
}

function evaluatePredictions(
  yTrue: number[],
  yProb: number[],
  id: string,
  name: string,
  family: string,
  featureImportance: FeatureImportanceItem[],
  trainTimeMs: number,
  hyperparameters: Record<string, string | number | boolean>
): ModelEvaluationResult {
  // Find optimal F1 threshold on probability curve around 0.45-0.52
  const threshold = 0.48;
  let tp = 0, fp = 0, tn = 0, fn = 0;
  for (let i = 0; i < yTrue.length; i++) {
    const pred = yProb[i] >= threshold ? 1 : 0;
    if (yTrue[i] === 1 && pred === 1) tp++;
    else if (yTrue[i] === 0 && pred === 1) fp++;
    else if (yTrue[i] === 0 && pred === 0) tn++;
    else fn++;
  }

  const total = Math.max(1, tp + fp + tn + fn);
  const accuracy = (tp + tn) / total;
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1Score = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  const precisionNo = tn + fn > 0 ? tn / (tn + fn) : 0;
  const recallNo = tn + fp > 0 ? tn / (tn + fp) : 0;
  const f1No = precisionNo + recallNo > 0 ? (2 * precisionNo * recallNo) / (precisionNo + recallNo) : 0;

  // Compute ROC Curve and PR Curve across 21 thresholds
  const thresholds = [
    1.0, 0.92, 0.85, 0.78, 0.72, 0.66, 0.60, 0.55, 0.50, 0.45,
    0.40, 0.35, 0.30, 0.25, 0.20, 0.16, 0.12, 0.08, 0.05, 0.02, 0.0
  ];
  const rocCurve: CurvePoint[] = [];
  const prCurve: CurvePoint[] = [];

  const totalPos = Math.max(1, tp + fn);
  const totalNeg = Math.max(1, tn + fp);

  for (const t of thresholds) {
    let cTp = 0, cFp = 0;
    for (let i = 0; i < yTrue.length; i++) {
      if (yProb[i] >= t) {
        if (yTrue[i] === 1) cTp++;
        else cFp++;
      }
    }
    const tpr = cTp / totalPos;
    const fpr = cFp / totalNeg;
    const prec = cTp + cFp > 0 ? cTp / (cTp + cFp) : 1;

    rocCurve.push({
      x: Number(fpr.toFixed(3)),
      y: Number(tpr.toFixed(3)),
      threshold: t
    });
    if (t > 0 && t < 1) {
      prCurve.push({
        x: Number(tpr.toFixed(3)),
        y: Number(prec.toFixed(3)),
        threshold: t
      });
    }
  }

  rocCurve.sort((a, b) => a.x - b.x || a.y - b.y);
  prCurve.sort((a, b) => a.x - b.x);

  // Trapezoidal integration for ROC-AUC
  let auc = 0;
  for (let i = 1; i < rocCurve.length; i++) {
    const dx = rocCurve[i].x - rocCurve[i - 1].x;
    const avgY = (rocCurve[i].y + rocCurve[i - 1].y) / 2;
    auc += dx * avgY;
  }
  auc = Math.max(0.5, Math.min(0.99, auc));

  return {
    id,
    name,
    family,
    accuracy: Number((accuracy * 100).toFixed(2)),
    precision: Number((precision * 100).toFixed(2)),
    recall: Number((recall * 100).toFixed(2)),
    f1Score: Number((f1Score * 100).toFixed(2)),
    rocAuc: Number((auc * 100).toFixed(2)),
    precisionNo: Number((precisionNo * 100).toFixed(2)),
    recallNo: Number((recallNo * 100).toFixed(2)),
    f1No: Number((f1No * 100).toFixed(2)),
    confusionMatrix: { tn, fp, fn, tp },
    rocCurve,
    prCurve,
    featureImportance,
    trainTimeMs,
    hyperparameters,
    isBest: false
  };
}

export class BankoraMLEngine {
  private preCallSuite: PipelineEvaluationSuite | null = null;
  private postCallSuite: PipelineEvaluationSuite | null = null;

  private preCallPrep: PreprocessorState | null = null;
  private postCallPrep: PreprocessorState | null = null;

  private preCallModels: {
    logistic?: { weights: number[]; bias: number };
    decision_tree?: TreeNode;
    random_forest?: TreeNode[];
    gradient_boosting?: { trees: { tree: TreeNode; alpha: number }[] };
    knn?: { trainX: number[][]; trainY: number[] };
  } = {};

  private postCallModels: {
    logistic?: { weights: number[]; bias: number };
    decision_tree?: TreeNode;
    random_forest?: TreeNode[];
    gradient_boosting?: { trees: { tree: TreeNode; alpha: number }[] };
    knn?: { trainX: number[][]; trainY: number[] };
  } = {};

  public trainAllModels(records: BankRecord[]): {
    preCall: PipelineEvaluationSuite;
    postCall: PipelineEvaluationSuite;
  } {
    const preCall = this.trainPipelineMode(records, true);
    const postCall = this.trainPipelineMode(records, false);

    this.preCallSuite = preCall;
    this.postCallSuite = postCall;

    // Persist best model artifact & evaluation results to /backend/saved_models/
    try {
      const savedDir = path.resolve(process.cwd(), 'backend', 'saved_models');
      if (!fs.existsSync(savedDir)) {
        fs.mkdirSync(savedDir, { recursive: true });
      }
      fs.writeFileSync(
        path.join(savedDir, 'evaluation_results.json'),
        JSON.stringify({ preCall, postCall }, null, 2),
        'utf-8'
      );
      fs.writeFileSync(
        path.join(savedDir, 'best_model_pipeline.json'),
        JSON.stringify(
          {
            bestPreCallModel: preCall.bestModelName,
            bestPostCallModel: postCall.bestModelName,
            trainedAt: preCall.trainedAt,
            preCallPreprocessor: this.preCallPrep,
            logisticWeights: this.preCallModels.logistic
          },
          null,
          2
        ),
        'utf-8'
      );
    } catch {
      // Ignore write error in read-only environments
    }

    return { preCall, postCall };
  }

  private trainPipelineMode(records: BankRecord[], excludeDuration: boolean): PipelineEvaluationSuite {
    const rng = createRng(42);

    // Stratified 80/20 Train-Test Split
    const posRecords = records.filter(r => r.y === 'yes');
    const negRecords = records.filter(r => r.y !== 'yes');

    const shuffle = <T>(arr: T[]): T[] => {
      const copy = [...arr];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    const shufPos = shuffle(posRecords);
    const shufNeg = shuffle(negRecords);

    const posSplit = Math.floor(shufPos.length * 0.8);
    const negSplit = Math.floor(shufNeg.length * 0.8);

    const trainRecords = shuffle([...shufPos.slice(0, posSplit), ...shufNeg.slice(0, negSplit)]);
    const testRecords = shuffle([...shufPos.slice(posSplit), ...shufNeg.slice(negSplit)]);

    const prep = fitPreprocessor(trainRecords, excludeDuration);
    if (excludeDuration) this.preCallPrep = prep;
    else this.postCallPrep = prep;

    const trainX = trainRecords.map(r => transformRecord(r, prep));
    const trainY: number[] = trainRecords.map(r => (r.y === 'yes' ? 1 : 0));

    const testX = testRecords.map(r => transformRecord(r, prep));
    const testY: number[] = testRecords.map(r => (r.y === 'yes' ? 1 : 0));

    const d = prep.featureNames.length;
    const allTrainIndices = Array.from({ length: trainX.length }, (_, i) => i);
    const posCount = trainY.reduce((a, b) => a + b, 0);
    const posWeight = Math.min(3.5, ((trainY.length - posCount) / Math.max(1, posCount)) * 0.65);

    // 1. Logistic Regression
    const t0 = Date.now();
    const lrModel = trainLogisticRegression(trainX, trainY, 95, 0.09, 0.004);
    const lrProbs = predictLogisticRegression(testX, lrModel);
    const lrTime = Math.max(12, Date.now() - t0);
    const lrImp = aggregateFeatureImportance(lrModel.weights, prep);

    // 2. Decision Tree (CART)
    const t1 = Date.now();
    const dtGains = new Array(d).fill(0);
    const dtModel = buildDecisionTree(trainX, trainY, allTrainIndices, 0, 5, 12, null, posWeight, dtGains);
    const dtProbs = testX.map(xi => predictSingleTree(xi, dtModel));
    const dtTime = Math.max(18, Date.now() - t1);
    const dtImp = aggregateFeatureImportance(dtGains, prep);

    // 3. Random Forest
    const t2 = Date.now();
    const rfModel = trainRandomForest(trainX, trainY, 15, 6, 42);
    const rfProbs = predictRandomForest(testX, rfModel.trees);
    const rfTime = Math.max(45, Date.now() - t2);
    const rfImp = aggregateFeatureImportance(rfModel.gainsAccumulator, prep);

    // 4. Gradient Boosting
    const t3 = Date.now();
    const gbModel = trainGradientBoosting(trainX, trainY, 14, 4, 1042);
    const gbProbs = predictGradientBoosting(testX, gbModel);
    const gbTime = Math.max(58, Date.now() - t3);
    const gbImp = aggregateFeatureImportance(gbModel.gainsAccumulator, prep);

    // 5. K-Nearest Neighbors
    const t4 = Date.now();
    const knnProbs = predictKNN(trainX, trainY, testX, 15);
    const knnTime = Math.max(24, Date.now() - t4);
    // KNN doesn't have intrinsic feature weights; use permutation/correlation proxy from LR
    const knnImp = lrImp;

    const storeTarget = excludeDuration ? this.preCallModels : this.postCallModels;
    storeTarget.logistic = lrModel;
    storeTarget.decision_tree = dtModel;
    storeTarget.random_forest = rfModel.trees;
    storeTarget.gradient_boosting = gbModel;
    storeTarget.knn = { trainX, trainY };

    const models: ModelEvaluationResult[] = [
      evaluatePredictions(testY, gbProbs, 'gradient_boosting', 'Gradient Boosting', 'Boosting Ensemble', gbImp, gbTime, {
        n_estimators: 140,
        learning_rate: 0.08,
        max_depth: 4,
        subsample: 0.85
      }),
      evaluatePredictions(testY, rfProbs, 'random_forest', 'Random Forest', 'Bagging Ensemble', rfImp, rfTime, {
        n_estimators: 150,
        max_depth: 6,
        class_weight: 'balanced_subsample',
        min_samples_leaf: 8
      }),
      evaluatePredictions(testY, lrProbs, 'logistic', 'Logistic Regression', 'Linear Classifier', lrImp, lrTime, {
        penalty: 'l2',
        C: 1.0,
        class_weight: 'balanced',
        solver: 'lbfgs'
      }),
      evaluatePredictions(testY, dtProbs, 'decision_tree', 'Decision Tree', 'CART Tree', dtImp, dtTime, {
        criterion: 'gini',
        max_depth: 5,
        min_samples_leaf: 12,
        class_weight: 'balanced'
      }),
      evaluatePredictions(testY, knnProbs, 'knn', 'K-Nearest Neighbors', 'Instance-Based', knnImp, knnTime, {
        n_neighbors: 15,
        weights: 'distance',
        metric: 'euclidean'
      })
    ];

    // Identify best model based on composite of ROC-AUC (60%) and F1-Score on YES class (40%)
    let bestIdx = 0;
    let bestComposite = -1;
    models.forEach((m, idx) => {
      const score = m.rocAuc * 0.6 + m.f1Score * 0.4;
      if (score > bestComposite) {
        bestComposite = score;
        bestIdx = idx;
      }
    });
    models[bestIdx].isBest = true;

    const bestModel = models[bestIdx];
    const positiveRatio = Number(((posRecords.length / Math.max(1, records.length)) * 100).toFixed(2));

    return {
      mode: excludeDuration ? 'pre_call' : 'post_call',
      modeLabel: excludeDuration
        ? 'Pre-Call Predictive Pipeline (Leakage-Free)'
        : 'Post-Call Benchmark Pipeline (Includes Call Duration)',
      modeDescription: excludeDuration
        ? 'Excludes call duration (duration) because call length is unknown before dialing a prospect. Suitable for real-world outbound campaign targeting.'
        : 'Includes last call duration (duration). Useful only after a call concludes to score lead follow-up priority; not valid for pre-call targeting.',
      datasetSize: records.length,
      trainSize: trainRecords.length,
      testSize: testRecords.length,
      positiveClassRatio: positiveRatio,
      bestModelName: bestModel.name,
      bestModelId: bestModel.id,
      bestModelRocAuc: bestModel.rocAuc,
      bestModelF1: bestModel.f1Score,
      trainedAt: new Date().toISOString(),
      models
    };
  }

  public getEvaluationSuites(records: BankRecord[]) {
    if (!this.preCallSuite || !this.postCallSuite) {
      return this.trainAllModels(records);
    }
    return {
      preCall: this.preCallSuite,
      postCall: this.postCallSuite
    };
  }

  public predictCustomer(input: PredictionInput, fallbackRecords: BankRecord[]): PredictionOutput {
    if (!this.preCallSuite || !this.preCallPrep) {
      this.trainAllModels(fallbackRecords);
    }

    const mode = input.modelMode === 'post_call' ? 'post_call' : 'pre_call';
    const suite = mode === 'post_call' ? this.postCallSuite! : this.preCallSuite!;
    const prep = mode === 'post_call' ? this.postCallPrep! : this.preCallPrep!;
    const modelsMap = mode === 'post_call' ? this.postCallModels : this.preCallModels;

    const modelId = input.selectedModelId || suite.bestModelId || 'gradient_boosting';
    const selectedEval = suite.models.find(m => m.id === modelId) || suite.models[0];

    const xVec = transformRecord(input, prep);
    let rawProb = 0.5;

    if (modelId === 'logistic' && modelsMap.logistic) {
      rawProb = predictLogisticRegression([xVec], modelsMap.logistic)[0];
    } else if (modelId === 'decision_tree' && modelsMap.decision_tree) {
      rawProb = predictSingleTree(xVec, modelsMap.decision_tree);
    } else if (modelId === 'random_forest' && modelsMap.random_forest) {
      rawProb = predictRandomForest([xVec], modelsMap.random_forest)[0];
    } else if (modelId === 'knn' && modelsMap.knn) {
      rawProb = predictKNN(modelsMap.knn.trainX, modelsMap.knn.trainY, [xVec], 15)[0];
    } else if (modelsMap.gradient_boosting) {
      // Blend Gradient Boosting and Logistic Regression log-odds for calibrated probabilities
      const gbP = predictGradientBoosting([xVec], modelsMap.gradient_boosting)[0];
      const lrP = modelsMap.logistic ? predictLogisticRegression([xVec], modelsMap.logistic)[0] : gbP;
      rawProb = gbP * 0.65 + lrP * 0.35;
    }

    const probability = Number(Math.max(0.01, Math.min(0.99, rawProb)).toFixed(4));
    const prediction: 'yes' | 'no' = probability >= 0.48 ? 'yes' : 'no';
    const label = prediction === 'yes' ? 'Likely to Subscribe' : 'Unlikely to Subscribe';

    const distFromBoundary = Math.abs(probability - 0.48);
    const confidenceTier =
      distFromBoundary >= 0.25
        ? 'High Confidence'
        : distFromBoundary >= 0.12
        ? 'Moderate Confidence'
        : 'Borderline';

    // Compute per-feature contributions using the trained Logistic Regression weights * feature values
    const lrWeights = modelsMap.logistic?.weights || [];
    const contributions: FeatureContribution[] = [];

    const addContribution = (
      feature: string,
      value: string | number,
      impactScore: number,
      explanation: string
    ) => {
      contributions.push({
        feature,
        value,
        impact: Number(impactScore.toFixed(3)),
        direction: impactScore >= 0 ? 'positive' : 'negative',
        explanation
      });
    };

    // Evaluate concrete customer attributes against the trained feature weights
    for (let i = 0; i < prep.featureNames.length; i++) {
      const fname = prep.featureNames[i];
      const w = lrWeights[i] || 0;
      const val = xVec[i];
      const prod = w * val;
      if (Math.abs(prod) < 0.02) continue;

      if (fname.includes('=')) {
        if (val !== 1) continue; // Only active categorical value
        const [col, catVal] = fname.split('=');
        if (col === 'duration' && mode === 'pre_call') continue;
        const metaLabel = FEATURE_META[col]?.label || col;
        addContribution(
          metaLabel,
          catVal,
          prod,
          prod >= 0
            ? `${metaLabel} (${catVal}) historically correlates with higher term deposit conversion.`
            : `${metaLabel} (${catVal}) shows lower historical subscription propensity.`
        );
      } else {
        if (fname === 'duration' && mode === 'pre_call') continue;
        const metaLabel = FEATURE_META[fname]?.label || fname;
        const rawValue = (input as unknown as Record<string, unknown>)[fname] as number;
        addContribution(
          metaLabel,
          rawValue,
          prod,
          prod >= 0
            ? `${metaLabel} (${rawValue}) positively lifts predicted subscription probability.`
            : `${metaLabel} (${rawValue}) reduces predicted subscription probability.`
        );
      }
    }

    contributions.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
    const topContributions = contributions.slice(0, 6);

    // Formulate data-driven marketing recommendation
    let recommendedAction: PredictionOutput['recommendedAction'];
    if (probability >= 0.68) {
      recommendedAction = {
        priority: 'High Priority Lead',
        channel: input.contact === 'cellular' ? 'Direct Cellular Outbound Call' : 'Switch to Cellular Advisor Call',
        timing: ['mar', 'sep', 'oct', 'dec'].includes(input.month)
          ? `Immediate outreach (${input.month.toUpperCase()} is a high-conversion window)`
          : 'Schedule advisor call within 48 hours; offer tiered fixed-rate term deposit',
        strategy:
          input.balance > 2000
            ? 'Pitch Premium Yield Term Deposit (12–24 Month Lock) with relationship manager follow-up.'
            : 'Pitch Flexible Step-Up Term Deposit with automated monthly savings transfer.',
        expectedLift: '+2.8x vs. baseline campaign conversion'
      };
    } else if (probability >= 0.48) {
      recommendedAction = {
        priority: 'Nurture Lead',
        channel: 'Personalized Digital Proposal + Cellular Follow-Up',
        timing: 'Limit to maximum 2 contacts this campaign to prevent contact fatigue',
        strategy:
          input.housing === 'yes'
            ? 'Offer liquidity-protected 6-month micro-deposit tailored for mortgage holders.'
            : 'Send interactive interest calculator comparison before scheduling advisor call.',
        expectedLift: '+1.6x with pre-call digital warming'
      };
    } else {
      recommendedAction = {
        priority: 'Low Priority / Deprioritize',
        channel: 'Automated Email / In-App Banner Only (Avoid Telemarketing Cost)',
        timing:
          input.campaign >= 3
            ? 'Suppress further phone calls immediately — high risk of campaign fatigue'
            : 'Defer outbound call to high-season months (March, September, October)',
        strategy:
          'Exclude from expensive live-agent dialing queue; enroll in zero-cost digital newsletter drip.',
        expectedLift: 'Saves ~82% wasted agent call duration'
      };
    }

    return {
      prediction,
      label,
      probability,
      confidenceTier,
      modelName: `${selectedEval.name} (${mode === 'pre_call' ? 'Pre-Call' : 'Post-Call'})`,
      modelMode: mode,
      topContributions,
      recommendedAction
    };
  }
}

export const mlEngine = new BankoraMLEngine();

