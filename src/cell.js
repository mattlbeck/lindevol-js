
class Cell{
    constructor(plant, x, y){
        this.plant = plant
        this.x = x;
        this.y = y;
        this.energised = true;
    }

    draw(ctx, x, y, size, colour){
        ctx.fillStyle = colour;
        ctx.fillRect(x, y, size, size);
        ctx.strokeRect(x, y, size, size);
    }
}

module.exports = Cell;