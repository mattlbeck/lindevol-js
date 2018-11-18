import {stats} from "stats-lite";

class SimData{

    constructor(simulation){
        this.sim = simulation;
        this.data = {"stepnum": []};
        this.collectors = [
            new Collector("population", AsIs, function(sim){
                return sim.world.plants.length;
            })
        ];
    }

    /**
     * Collect data for the current step
     */
    recordStep(){
        var stepData = {};
        this.collectors.forEach(function(c){
            var values = c.collect(this.sim);
            Object.assign(stepData, values);
        }, this);

        this.data["stepnum"].push(this.sim.stepnum);
        Object.keys(stepData).forEach(function(k){
            if (!(k in this.data)){
                this.data[k] = [];
            }
            this.data[k].push(stepData[k]); 
        }, this);
    }
}

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