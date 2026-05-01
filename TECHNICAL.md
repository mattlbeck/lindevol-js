# Technical Information

## Measuring Diversity

To understand the evolutionary dynamics of the LindEvol simulation, we track two complementary measures of genetic diversity. By monitoring both simultaneously, we can differentiate between populations that are structurally identical but functionally rich, versus those that are structurally chaotic but functionally impoverished.

### 1. Allele Richness (Shannon Entropy)

**Intuition:** 
A genome in LindEvol is an array of bytes (values 0–255), where each byte represents a potential action or genetic building block. Allele Richness measures the variety and evenness of these building blocks across the entire population. If a population relies on a wide variety of bytes, the entropy is high. If the population relies on only a few specific bytes (e.g., losing the ability to grow laterally), the entropy plummets.

**Implementation:**
We calculate the global frequency ($p_i$) of every byte ($0 \le i \le 255$) across a sample of genomes in the living population. We then compute the Shannon Entropy:
$$H = -\sum_{i=0}^{255} p_i \log_2(p_i)$$

**Mathematical Boundaries:**
- **Minimum (0):** Achieved when there is zero uncertainty. In the simulation, this occurs if every byte across the entire population's genome pool is exactly the same value (e.g., every byte is a 14).
- **Maximum (8):** The upper bound is $\log_2(N)$ where $N$ is the alphabet size. Since bytes range from 0–255, the maximum entropy is $\log_2(256) = 8$. This represents maximum randomness, where every byte value occurs with the exact same frequency.

**Insights:**
- **Plummeting Entropy:** Indicates a loss of functional diversity. The population has converged on a narrow "alphabet" of instructions.
- **High Entropy:** The population maintains a rich genetic toolkit, exploring many possible byte values.

### 2. Structural Divergence (Sampled Pairwise Levenshtein Distance)

**Intuition:**
While Shannon Entropy tells us *what* building blocks are present, it doesn't tell us *how* they are arranged. Two plants might have the exact same distribution of bytes, but in completely different orders. The Levenshtein distance (or edit distance) measures the minimum number of single-byte edits (insertions, deletions, or substitutions) required to change one genome into another. This gives us a direct measure of structural divergence.

**Implementation:**
Since comparing every pair of plants is computationally expensive ($O(N^2)$), we randomly sample a subset of plant pairs (e.g., 30 pairs) during each telemetry recording step. We calculate the Levenshtein distance for each pair and report the mean distance.

**Mathematical Boundaries:**
- **Minimum (0):** The distance is exactly 0 when two genomes are perfectly identical (same bytes, same sequence, same length).
- **Maximum:** Unlike Shannon Entropy, Levenshtein distance has no fixed global maximum. The upper bound between two genomes A and B is strictly $\max(\text{length}(A), \text{length}(B))$. As genomes grow indefinitely over generations via insertion/duplication mutations, the theoretical maximum edit distance scales dynamically with their size.

**Insights:**
- **Sudden Drop (Selective Sweep):** If the mean distance crashes to near zero, it indicates that a highly successful mutant has rapidly reproduced and outcompeted the rest of the population, resulting in a monoculture of near-clones.
- **High Distance:** The population is highly divergent, consisting of multiple distinct clades or highly mutated lineages.

### Interpreting the Interplay

- **High Entropy, Low Levenshtein:** A population of near-clones that happen to share a very complex, rich, and likely long genome.
- **Low Entropy, High Levenshtein:** The population uses a tiny alphabet of instructions, but has scrambled them into wildly different sequences and lengths. They are structurally distinct but functionally impoverished.
