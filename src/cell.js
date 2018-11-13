
class Cell{
    constructor(plant, x, y){
        this.plant = plant;
        this.x = x;
        this.y = y;
        this.energised = false;
        this.internalState = 0;
        this.nextInternalState = 0;
    }

    updateState(){
        this.internalState = this.nextInternalState;
        this.nextInternalState = 0;
    }

    draw(ctx, x, y, size, colour){
        ctx.fillStyle = colour;
        ctx.fillRect(x, y, size, size);
        //ctx.strokeRect(x, y, size, size);
    }

    toString(){
        return `Cell at (${this.x}, ${this.y}) energy: ${this.energised}`;
    }
}

export {Cell};