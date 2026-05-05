#!/usr/bin/env python3
import json
import math
import re
import sys
from collections import Counter


def tokenize(text):
    return re.findall(r"[\wÀ-ÿ]+", text.lower())


def token_similarity(left, right):
    left_counts = Counter(tokenize(left))
    right_counts = Counter(tokenize(right))
    if not left_counts or not right_counts:
        return 0.0

    terms = set(left_counts) | set(right_counts)
    dot = sum(left_counts[term] * right_counts[term] for term in terms)
    left_norm = math.sqrt(sum(value * value for value in left_counts.values()))
    right_norm = math.sqrt(sum(value * value for value in right_counts.values()))
    if left_norm == 0 or right_norm == 0:
        return 0.0
    return dot / (left_norm * right_norm)


def transformer_similarity(left, right):
    from sentence_transformers import SentenceTransformer, util

    model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
    embeddings = model.encode([left, right], convert_to_tensor=True)
    return float(util.cos_sim(embeddings[0], embeddings[1]).item())


def main():
    payload = json.loads(sys.stdin.read() or "{}")
    left = payload.get("left", "")
    right = payload.get("right", "")

    try:
        score = transformer_similarity(left, right)
    except Exception:
        score = token_similarity(left, right)

    print(max(0.0, min(1.0, score)))


if __name__ == "__main__":
    main()
