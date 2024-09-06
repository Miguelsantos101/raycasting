"use strict";
class Vector2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    add(that) {
        return new Vector2(this.x + that.x, this.y + that.y);
    }
    sub(that) {
        return new Vector2(this.x - that.x, this.y - that.y);
    }
    div(that) {
        return new Vector2(this.x / that.x, this.y / that.y);
    }
    mul(that) {
        return new Vector2(this.x * that.x, this.y * that.y);
    }
    lenght() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    norm() {
        const l = this.lenght();
        if (l == 0)
            return new Vector2(0, 0);
        return new Vector2(this.x / l, this.y / l);
    }
    scale(value) {
        return new Vector2(this.x * value, this.y * value);
    }
    array() {
        return [this.x, this.y];
    }
}
const GRID_ROWS = 10;
const GRID_COLS = 10;
const GRID_SIZE = new Vector2(GRID_COLS, GRID_ROWS);
function canvasSize(ctx) {
    return new Vector2(ctx.canvas.width, ctx.canvas.height);
}
function fillCircle(ctx, center, radius) {
    ctx.beginPath();
    ctx.arc(...center.array(), radius, 0, Math.PI * 2);
    ctx.fill();
}
function strokeLine(ctx, p1, p2) {
    ctx.beginPath();
    ctx.moveTo(...p1.array());
    ctx.lineTo(...p2.array());
    ctx.stroke();
}
function snap(x, dx) {
    if (dx > 0)
        return Math.ceil(x);
    if (dx < 0)
        return Math.floor(x);
    return x;
}
function rayStep(ctx, p1, p2) {
    const d = p2.sub(p1);
    if (d.x != 0) {
        const k = d.y / d.x;
        const c = p1.y - k * p1.x;
        const x3 = snap(p2.x, d.x);
        const y3 = x3 * k + c;
        ctx.fillStyle = "red";
        fillCircle(ctx, new Vector2(x3, y3), 0.2);
    }
    return p2;
}
// drawGrid
function grid(ctx, p2) {
    ctx.reset();
    ctx.fillStyle = "#181818";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.scale(ctx.canvas.width / GRID_COLS, ctx.canvas.height / GRID_ROWS);
    ctx.lineWidth = 0.02;
    ctx.strokeStyle = "#303030";
    for (let x = 0; x <= GRID_COLS; x++) {
        strokeLine(ctx, new Vector2(x, 0), new Vector2(x, GRID_ROWS));
    }
    for (let y = 0; y <= GRID_ROWS; y++) {
        strokeLine(ctx, new Vector2(0, y), new Vector2(GRID_COLS, y));
    }
    const p1 = new Vector2(GRID_COLS * 0.43, GRID_ROWS * 0.33);
    ctx.fillStyle = "green";
    fillCircle(ctx, p1, 0.2);
    if (p2 !== undefined) {
        fillCircle(ctx, p2, 0.2);
        ctx.strokeStyle = "green";
        strokeLine(ctx, p1, p2);
        const p3 = rayStep(ctx, p1, p2);
        ctx.fillStyle = "blue";
        fillCircle(ctx, p3, 0.2);
        strokeLine(ctx, p2, p3);
    }
}
(() => {
    const game = document.getElementById("game");
    if (game == null) {
        throw new Error("No canvas with id `game` is found");
    }
    game.width = 800;
    game.height = 800;
    const ctx = game.getContext("2d");
    if (ctx == null) {
        throw new Error("2D context is not supported");
    }
    const p2 = undefined;
    game.addEventListener("mousemove", (event) => {
        const p2 = new Vector2(event.offsetX, event.offsetY)
            .div(canvasSize(ctx))
            .mul(new Vector2(GRID_COLS, GRID_ROWS));
        grid(ctx, p2);
    });
    grid(ctx, p2);
})();
