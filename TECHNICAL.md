# Technical Information

## Simulation Parameters & Core Equations

The LindEvol engine uses several configurable parameters (defined in the JSON Configuration) to govern the lifecycle of plants and their genetic mutation rates. Below are the core equations and the parameters that drive them.

### Plant Lifecycle & Death Probability

Every simulation step, a plant evaluates its probability of dying. The death probability $P(\text{death})$ is calculated based on its physical size, its energy reserves, and how structurally unbalanced (leaning) it is.

**Equation:**

$$P(\text{death}) = D_f \times N^{N_{exp}} \times (E + 1)^{E_{exp}} + L_f \times \text{LeanTerm}$$


**Parameters:**
- $D_f$ (`death_factor`): The base multiplier for death probability.
- $N_{exp}$ (`natural_exp`): The exponent applied to the total number of cells ($N$) in the plant. A higher exponent aggressively penalizes larger plants.
- $E_{exp}$ (`energy_exp`): The exponent applied to the number of energised cells ($E$). Because this value is typically negative, more energy *reduces* the death probability.
- $L_f$ (`leanover_factor`): A multiplier penalizing unbalanced growth.

*Note on LeanTerm:* The `LeanTerm` is an internal calculation representing the physical torque on the plant. It scales with the number of cells (specifically $2 / (N(N-1))$) and the horizontal distance of each cell from the root.

### Competition & Killing Probability

When a plant attempts to grow into a space already occupied by another plant's cell, an attack occurs. 

**Equation:**

$$P(\text{kill}) = \frac{1}{E_{\text{target}}}$$


**Parameters/Variables:**
- $E_{\text{target}}$: The number of energised cells possessed by the defending plant. The more energy the defender has, the lower the probability the attacker succeeds in killing it. If the defender has 0 energy, the attacker's success is guaranteed (evaluates to Infinity mathematically, capped to 1.0 probability).

### Genetic Mutations

When a seed is spawned, its genome is subjected to potential mutations. The probability of any specific mutation event (replacement, insertion, or deletion) depends on the base probabilities defined in the config, scaled by the plant's inherited mutation exponent.

**Equation:**

$$P(\text{event}) = p_{\text{event}} \times (\text{mut\_prob})^{\text{mut\_exp}}$$


**Parameters:**
- $p_{\text{event}}$: The base probability of the specific event type (`mut_replace`, `mut_insert`, or `mut_delete`).
- `mut_prob`: The global base modifier for mutation scaling.
- `mut_exp`: An inherited, evolvable trait specific to the individual genome. It acts as the exponent to `mut_prob`. A higher `mut_exp` (when `mut_prob < 1`) exponentially decreases the overall probability of a mutation occurring.

*Note:* If an event occurs, `mut_units` determines how many bytes are inserted or deleted in a single event.

## Genomic Interpreters, States, and Actions

In LindEvol, a plant's genome is a raw sequence of bytes. How these bytes translate into behaviors depends on the **Genomic Interpreter**, which reads the genome and compiles it into a set of conditional `Rules`. Each rule pairs an environmental **State** condition with a corresponding **Action**.

### Genomic Interpreters

There are currently two ways to compile a genome into rules:

1. **Block Interpreter (`"block"`):**
   A simpler, rigid interpreter. It reads the genome in two-byte chunks (blocks). 
   - The first byte defines the exact **state** condition.
   - The second byte defines the **action** to take if that state is met.
   - Every state bit must match exactly for the rule to trigger (an equality mask of 255).

2. **Promotor/Terminator Interpreter (`"promotor"`):**
   A biologically inspired interpreter that mimics gene transcription.
   - It scans the genome for a specific byte signature denoting a **Promotor** (start codon).
   - Once a promotor is found, it reads subsequent "operator" bytes to construct a state matching mask. This allows for partial matching (e.g., "if there is light, regardless of neighbours").
   - Transcription stops when it hits a **Terminator** byte signature. The terminator byte determines the action.

### States

When evaluating rules, a plant assesses its environment and constructs a 16-bit state integer for each of its cells. This state comprises:
- **Bits 0–7 (Neighbourhood):** An 8-bit mask representing the 8 adjacent spaces around the cell. A `1` means the space is occupied.
- **Bits 8–14 (Internal State):** An arbitrary internal memory space that the plant can read from and write to (via `StateBitN` actions).
- **Bit 15 (Energised):** A `1` indicates the cell currently possesses sunlight energy.

### Actions

If a rule's state condition matches the cell's current state, the corresponding action is executed. Actions generally consume the cell's energy.

The translation of a byte to an action is handled by the **Action Map**. The configuration defines weights (e.g., `action_map: [200, 20, 0, 18, 18, 0]`) that partition the 0–255 byte range into sections corresponding to specific actions:

1. **`Divide`**: Grows the plant by spawning a new cell in an adjacent space. The 3 least significant bits of the action byte dictate the direction (0–7).
2. **`FlyingSeed`**: Disperses a copy of the plant's genome into the world, spawning a new plant at a random location.
3. **`LocalSeed`**: Drops a seed directly adjacent to the plant.
4. **`MutatePlus` (`mut+`)**: Increases the genome's mutation exponent, making future genetic mutations *less* likely (increasing stability).
5. **`MutateMinus` (`mut-`)**: Decreases the mutation exponent, making future genetic mutations *more* likely (increasing adaptability/chaos).
6. **`StateBitN`**: Toggles a bit within the cell's internal state memory. The 4 least significant bits dictate which bit to flip. This does not consume energy.

## Measuring Diversity

To understand the evolutionary dynamics of the LindEvol simulation, we track two complementary measures of genetic diversity. By monitoring both simultaneously, we can differentiate between populations that are structurally identical but functionally rich, versus those that are structurally chaotic but functionally impoverished.

### 1. Allele Richness (Shannon Entropy)

**Intuition:** 
A genome in LindEvol is an array of bytes (values 0–255), where each byte represents a potential action or genetic building block. Allele Richness measures the variety and evenness of these building blocks across the entire population. If a population relies on a wide variety of bytes, the entropy is high. If the population relies on only a few specific bytes (e.g., losing the ability to grow laterally), the entropy plummets.

**Implementation:**
We calculate the global frequency ($p_i$) of every byte (`0 <= i <= 255`) across a sample of genomes in the living population. We then compute the Shannon Entropy:

$$H = -\sum_{i=0}^{255} p_i \log_2(p_i)$$

**Mathematical Boundaries:**
- **Minimum (0):** Achieved when there is zero uncertainty. In the simulation, this occurs if every byte across the entire population's genome pool is exactly the same value (e.g., every byte is a 14).
- **Maximum (8):** The upper bound is $\log_2(N)$ where $N$ is the alphabet size. Since bytes range from `0 <= i <= 255`, the maximum entropy is $\log_2(256) = 8$. This represents maximum randomness, where every byte value occurs with the exact same frequency.

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