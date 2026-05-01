# LindEvol-JS

A JavaScript implementation of the LindEvol artificial life simulation.

<img width="1248" height="130" alt="Screenshot 2026-05-01 at 23 56 41" src="https://github.com/user-attachments/assets/67ab8569-b083-4591-8e39-c52555f0961d" />

**[▶️ Play Live Simulation](https://mattlbeck.github.io/lindevol-js/)**

## Documentation

- [Technical Guide (`TECHNICAL.md`)](TECHNICAL.md): Detailed explanation of core simulation equations, genomic interpreters, and genetic diversity metrics.
- [Parameter Reference (`PARAMETERS.md`)](PARAMETERS.md): Complete list of configuration parameters and their effects.

## Setup

To setup a development environment:

``
npm install
``

Build the webpack and run the simulation:

``
npm run build
npm run start
``

## Brief Simulation Manual

### LindEvol Agents (Plants)

In the LindEvol simulation, the "agents" are the artificial plants that populate the 2D world. Each plant is a collection of cells that grow, reproduce, and die according to their genetic code and environmental conditions.

#### Anatomy of an Agent

*   **Genome:** A sequence of bytes (`ByteArray`) that dictates the plant's behavior. The genome length is configurable (default is 400).
*   **Cells:** The structural units of the plant. A plant starts as a single cell and can divide to grow.
*   **Energy:** Plants gain energy through simulated sunlight. Cells that are "energised" can perform actions.
*   **State / Neighbourhood:** The plant's behavior is influenced by its local environment (neighbourhood) or internal state bits.

#### Genetics and Interpretation

The plant's genome is interpreted into a set of **Rules** (`state -> action`). There are two interpreters available:
1.  **Block Interpreter:** Interprets pairs of bytes as rules. One byte specifies the state condition (based on the immediate neighbourhood), and the other specifies the action.
2.  **Promotor Interpreter:** A more complex interpreter that looks for specific bit patterns (promotors/terminators) to define "genes".

#### Actions

Plants can perform the following actions, determined by their genetic rules mapping to the `ActionMap`:
*   `divide`: Grow by creating a new adjacent cell.
*   `flyingseed`: Disperse a seed to a random location in the world.
*   `localseed`: Drop a seed near the parent plant.
*   `mut+` / `mut-`: Increase or decrease the plant's mutation exponent.
*   `statebit`: Modify internal state bits.

#### Lifecycle and Evolution

*   **Mutation:** During each simulation step, genomes are subjected to mutations (replacements, insertions, deletions). The rates are configurable.
*   **Death:** Plants have a probability of dying based on factors like:
    *   Age/natural lifespan (`natural_exp`).
    *   Energy starvation (`energy_exp`).
    *   Structural instability (leaning too far over, `leanover_factor`).
    *   A baseline `death_factor`.
*   **Reproduction:** Successful plants disperse seeds (via `flyingseed` or `localseed`) that inherit the parent's genome (with potential mutations), driving the evolutionary process.


## Further resources

[Read the original paper.](https://ueaeprints.uea.ac.uk/id/eprint/22512/)

[LindEvol homepage.](http://www2.cmp.uea.ac.uk/~jtk/lindevol/)
