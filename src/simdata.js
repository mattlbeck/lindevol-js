import * as stats from "stats-lite";

function levenshtein(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    let matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b[i - 1] === a[j - 1]) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(
                        matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1  // deletion
                    )
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

function calculateAlleleEntropy(plants) {
    if (plants.length === 0) return 0;
    const counts = new Array(256).fill(0);
    let total = 0;
    plants.forEach(p => {
        for (let i = 0; i < p.genome.length; i++) {
            counts[p.genome[i]]++;
            total++;
        }
    });
    if (total === 0) return 0;
    let entropy = 0;
    for (let i = 0; i < 256; i++) {
        if (counts[i] > 0) {
            const p = counts[i] / total;
            entropy -= p * Math.log2(p);
        }
    }
    return entropy;
}

class SimData{

    constructor(simulation){
        this.sim = simulation;
        this.data = {"stepnum": []};
        this.lastStep = 0;
        this.collectors = [
            new Collector("population", AsIs, function(sim){
                return sim.world.plants.length;
            }),
            new Collector("unique_genotypes", AsIs, function(sim){
                const seen = new Set();
                sim.world.plants.forEach(p => seen.add(p.genome.serialize()));
                return seen.size;
            }),
            new Collector("total_cells", AsIs, function(sim){
                return sim.world.cellCount;
            }),
            new Collector("avg_size", AsIs, function(sim){
                if (sim.world.plants.length === 0) return 0;
                return sim.world.cellCount / sim.world.plants.length;
            }),
            new Collector("avg_energised", AsIs, function(sim){
                if (sim.world.plants.length === 0) return 0;
                const total = sim.world.plants.reduce((sum, p) => sum + p.energisedCount, 0);
                return total / sim.world.plants.length;
            }),
            new Collector("avg_active_genes", AsIs, function(sim){
                if (sim.world.plants.length === 0) return 0;
                const total = sim.world.plants.reduce((sum, p) => sum + (p.rules ? p.rules.length : 0), 0);
                return total / sim.world.plants.length;
            }),
            new Collector("avg_age", AsIs, function(sim){
                if (sim.world.plants.length === 0) return 0;
                const total = sim.world.plants.reduce((sum, p) => sum + (sim.stepnum - p.birthStep), 0);
                return total / sim.world.plants.length;
            }),
            new Collector("total_seeds", AsIs, function(sim){ return sim.stats.totalSeeds; }),
            new Collector("flying_seeds", AsIs, function(sim){ return sim.stats.flyingSeeds; }),
            new Collector("new_plants", AsIs, function(sim){ return sim.stats.newPlants; }),
            new Collector("deaths", AsIs, function(sim){ return sim.stats.deaths; }),
            new Collector("attacks", AsIs, function(sim){ return sim.stats.attacks; }),
            new Collector("avg_death_prob", AsIs, function(sim){
                if (sim.world.plants.length === 0) return 0;
                const total = sim.world.plants.reduce((sum, p) => {
                    return sum + p.getDeathProbability(
                        sim.params.death_factor,
                        sim.params.natural_exp,
                        sim.params.energy_exp,
                        sim.params.leanover_factor
                    ).prob;
                }, 0);
                return total / sim.world.plants.length;
            }),
            new Collector("plant_size_", Summary, function(sim){
                if (sim.world.plants.length === 0) return [0];
                return sim.world.plants.map(p => p.cells.length);
            }),
            new Collector("genome_size_", Summary, function(sim){
                if (sim.world.plants.length === 0) return [0];
                return sim.world.plants.map(p => p.genome.length);
            }),
            new Collector("mut_exp_", Summary, function(sim){
                if (sim.world.plants.length === 0) return [0];
                return sim.world.plants.map(p => p.genome.mut_exp);
            }),
            new Collector("plant_height_", Summary, function(sim){
                if (sim.world.plants.length === 0) return [0];
                return sim.world.plants.map(p => {
                    let maxH = 0;
                    for (let i = 0; i < p.cells.length; i++) if (p.cells[i].y > maxH) maxH = p.cells[i].y;
                    return maxH;
                });
            }),
            new Collector("genetic_distance_mean", AsIs, function(sim) {
                const plants = sim.world.plants;
                if (plants.length < 2) return 0;
                let sumDist = 0;
                let sampleSize = Math.min(30, plants.length);
                let pairs = 0;
                for (let i = 0; i < sampleSize; i++) {
                    const p1 = plants[Math.floor(Math.random() * plants.length)];
                    const p2 = plants[Math.floor(Math.random() * plants.length)];
                    if (p1 !== p2) {
                        sumDist += levenshtein(p1.genome, p2.genome);
                        pairs++;
                    }
                }
                return pairs > 0 ? sumDist / pairs : 0;
            }),
            new Collector("allele_entropy", AsIs, function(sim) {
                return calculateAlleleEntropy(sim.world.plants);
            })
        ];
    }

    /**
     * Collect data for the current step
     */
    recordStep(){
        const delta = this.sim.stepnum - this.lastStep;
        this.lastStep = this.sim.stepnum;

        var stepData = {};
        this.collectors.forEach(function(c){
            var values = c.collect(this.sim);
            Object.assign(stepData, values);
        }, this);

        // Normalize rate-based metrics by the number of steps since the last record
        if (delta > 0) {
            const rateKeys = ["new_plants", "deaths", "attacks", "total_seeds", "flying_seeds"];
            rateKeys.forEach(k => {
                if (stepData[k] !== undefined) {
                    stepData[k] /= delta;
                }
            });
        }

        // Reset incremental stats for the next interval
        this.sim.stats.newPlants = 0;
        this.sim.stats.deaths = 0;
        this.sim.stats.attacks = 0;
        this.sim.stats.totalSeeds = 0;
        this.sim.stats.flyingSeeds = 0;

        this.data["stepnum"].push(this.sim.stepnum);
        if (this.data["stepnum"].length > SimData.MAX_DATA_POINTS) {
            this.data["stepnum"].shift();
        }
        Object.keys(stepData).forEach(function(k){
            if (!(k in this.data)){
                this.data[k] = [];
            }
            this.data[k].push(stepData[k]);
            if (this.data[k].length > SimData.MAX_DATA_POINTS) {
                this.data[k].shift();
            }
        }, this);
    }
}
SimData.MAX_DATA_POINTS = 2000;

class Collector{
    constructor(name, typecls, collectFunc){
        this.name = name;
        this.type = new typecls(name);
        this.func = collectFunc;
    }

    collect(sim){
        var data = this.func(sim);
        return this.type.transform(data);
    }
}

class CollectorType{
    constructor(name){
        this.name = name;
    }

    transformData(data){
        throw new Error("Unimplemented method");
    }

    transform(data){
        var values = this.transformData(data);
        var transformed_data = {};
        Object.keys(values).forEach(function(k){
            transformed_data[this.name + k] = values[k];
        }, this);
        return transformed_data;
    }
}

class AsIs extends CollectorType {

    transformData(data){
        return {"": data};
    }
}

class Summary extends CollectorType {

    transformData(data){
        return {"min": Math.min(data), "mean": stats.mean(data), "max": Math.max(data)};
    }
}
export {SimData};