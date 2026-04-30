export const paramInfo = [
    {
        id: "random_seed",
        label: "Random Seed",
        type: "number",
        attrs: {},
        description: "Seed for the random number generator. Ensures reproducibility of simulations if all other parameters are identical."
    },
    {
        id: "world_width",
        label: "World Width",
        type: "number",
        attrs: {},
        description: "Width of the simulation grid (in cells). Defines the horizontal space available for plants to grow and spread."
    },
    {
        id: "world_height",
        label: "World Height",
        type: "number",
        attrs: {},
        description: "Height of the simulation grid (in cells). Defines the maximum vertical height a plant can grow towards the sunlight."
    },
    {
        id: "initial_population",
        label: "Initial Population",
        type: "number",
        attrs: {},
        description: "Number of seeds to plant at random locations on the ground when initializing a new simulation world."
    },
    {
        id: "energy_prob",
        label: "Energy Prob",
        type: "number",
        attrs: { step: "0.01" },
        description: "Probability (0.0 to 1.0) of a cell capturing sunlight. Sunlight falls vertically down; if caught, the cell becomes energised and can perform actions."
    },
    {
        id: "death_factor",
        label: "Death Factor",
        type: "number",
        attrs: { step: "0.01" },
        description: "Baseline probability factor influencing a plant's chance of dying in a given step."
    },
    {
        id: "natural_exp",
        label: "Natural Exp",
        type: "number",
        attrs: { step: "0.1" },
        description: "Exponent for age-related death probability. Higher values increase the likelihood of older plants dying naturally."
    },
    {
        id: "energy_exp",
        label: "Energy Exp",
        type: "number",
        attrs: { step: "0.1" },
        description: "Exponent for starvation-related death. Negative values indicate that lower energy reserves exponentially increase the risk of death."
    },
    {
        id: "leanover_factor",
        label: "Leanover Factor",
        type: "number",
        attrs: { step: "0.01" },
        description: "Factor that penalizes structural instability. Increases the probability of death if the plant's center of mass leans too far from its root."
    },
    {
        id: "mut_replace_mode",
        label: "Mut Replace Mode",
        type: "select",
        options: ["bytewise", "bitwise"],
        attrs: {},
        description: "Mode of mutation replacement: 'bytewise' replaces entire bytes, 'bitwise' flips individual bits."
    },
    {
        id: "mut_replace",
        label: "Mut Replace",
        type: "number",
        attrs: { step: "0.0001" },
        description: "Probability of a replacement mutation occurring when copying the genome."
    },
    {
        id: "mut_insert",
        label: "Mut Insert",
        type: "number",
        attrs: { step: "0.0001" },
        description: "Probability of a new genetic unit being inserted into the genome during copying."
    },
    {
        id: "mut_delete",
        label: "Mut Delete",
        type: "number",
        attrs: { step: "0.0001" },
        description: "Probability of a genetic unit being deleted from the genome during copying."
    },
    {
        id: "mut_factor",
        label: "Mut Factor",
        type: "number",
        attrs: { step: "0.1" },
        description: "Global scaling multiplier applied to all mutation probabilities."
    },
    {
        id: "initial_mut_exp",
        label: "Initial Mut Exp",
        type: "number",
        attrs: { step: "0.1" },
        description: "The starting mutation exponent for new seeds. This exponent exponentially scales the plant's personal mutation rate and can be modified by the plant's genetic actions."
    },
    {
        id: "genome_interpreter",
        label: "Genome Interpreter",
        type: "select",
        options: ["block", "promotor"],
        attrs: {},
        description: "The genetic interpreter used ('block' or 'promotor') to translate the genome byte sequence into actionable state-rules."
    },
    {
        id: "initial_genome_length",
        label: "Initial Genome Length",
        type: "number",
        attrs: {},
        description: "Length of the initial random genome generated for the starting population."
    },
    {
        id: "action_map",
        label: "Action Map Probabilities",
        type: "array",
        labels: ["Divide", "Flying Seed", "Local Seed", "Mut +", "Mut -", "State Bit"],
        attrs: {},
        description: "The mapping array that defines the probability weighting of specific actions (Divide, Flying Seed, Local Seed, Mut +, Mut -, State Bit) when a genetic rule is parsed."
    }
];
