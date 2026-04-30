# LindEvol Simulation Parameters

This document provides a comprehensive overview of the parameters that configure the LindEvol artificial ecology simulation.

> **Note**: This document is auto-generated from `src/paramInfo.js`. Do not edit it directly.

## Parameter Definitions

| Parameter | Type | Description |
| :--- | :--- | :--- |
| **Random Seed** (`random_seed`) | `number` | Seed for the random number generator. Ensures reproducibility of simulations if all other parameters are identical. |
| **World Width** (`world_width`) | `number` | Width of the simulation grid (in cells). Defines the horizontal space available for plants to grow and spread. |
| **World Height** (`world_height`) | `number` | Height of the simulation grid (in cells). Defines the maximum vertical height a plant can grow towards the sunlight. |
| **Initial Population** (`initial_population`) | `number` | Number of seeds to plant at random locations on the ground when initializing a new simulation world. |
| **Energy Prob** (`energy_prob`) | `number` | Probability (0.0 to 1.0) of a cell capturing sunlight. Sunlight falls vertically down; if caught, the cell becomes energised and can perform actions. |
| **Death Factor** (`death_factor`) | `number` | Baseline probability factor influencing a plant's chance of dying in a given step. |
| **Natural Exp** (`natural_exp`) | `number` | Exponent for age-related death probability. Higher values increase the likelihood of older plants dying naturally. |
| **Energy Exp** (`energy_exp`) | `number` | Exponent for starvation-related death. Negative values indicate that lower energy reserves exponentially increase the risk of death. |
| **Leanover Factor** (`leanover_factor`) | `number` | Factor that penalizes structural instability. Increases the probability of death if the plant's center of mass leans too far from its root. |
| **Mut Replace Mode** (`mut_replace_mode`) | `select` | Mode of mutation replacement: 'bytewise' replaces entire bytes, 'bitwise' flips individual bits. |
| **Mut Replace** (`mut_replace`) | `number` | Probability of a replacement mutation occurring when copying the genome. |
| **Mut Insert** (`mut_insert`) | `number` | Probability of a new genetic unit being inserted into the genome during copying. |
| **Mut Delete** (`mut_delete`) | `number` | Probability of a genetic unit being deleted from the genome during copying. |
| **Mut Factor** (`mut_factor`) | `number` | Global scaling multiplier applied to all mutation probabilities. |
| **Initial Mut Exp** (`initial_mut_exp`) | `number` | The starting mutation exponent for new seeds. This exponent exponentially scales the plant's personal mutation rate and can be modified by the plant's genetic actions. |
| **Genome Interpreter** (`genome_interpreter`) | `select` | The genetic interpreter used ('block' or 'promotor') to translate the genome byte sequence into actionable state-rules. |
| **Initial Genome Length** (`initial_genome_length`) | `number` | Length of the initial random genome generated for the starting population. |
| **Action Map Probabilities** (`action_map`) | `array` | The mapping array that defines the probability weighting of specific actions (Divide, Flying Seed, Local Seed, Mut +, Mut -, State Bit) when a genetic rule is parsed. |

## Action Map Weights

The `action_map` parameter is an array of integer weights that define the probability of specific actions occurring when a genetic rule executes. The indices correspond to:

*   **[0] Divide**
*   **[1] Flying Seed**
*   **[2] Local Seed**
*   **[3] Mut +**
*   **[4] Mut -**
*   **[5] State Bit**
