const EPS: number = 1e-3;
const NEAR_CLIPPING_PLANE: number = 0.75;
const FOV = Math.PI * 0.5;

class Vector2 {
    x: number;
    y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
    static zero(): Vector2 {
        return new Vector2(0, 0);
    }
    static fromAngle(angle: number): Vector2 {
        return new Vector2(Math.cos(angle), Math.sin(angle));
    }
    add(that: Vector2): Vector2 {
        return new Vector2(this.x + that.x, this.y + that.y);
    }
    sub(that: Vector2): Vector2 {
        return new Vector2(this.x - that.x, this.y - that.y);
    }
    div(that: Vector2): Vector2 {
        return new Vector2(this.x / that.x, this.y / that.y);
    }
    mul(that: Vector2): Vector2 {
        return new Vector2(this.x * that.x, this.y * that.y);
    }
    lenght(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }
    norm(): Vector2 {
        const l = this.lenght();
        if (l == 0) return new Vector2(0, 0);
        return new Vector2(this.x / l, this.y / l);
    }
    scale(value: number): Vector2 {
        return new Vector2(this.x * value, this.y * value);
    }
    distanceTo(that: Vector2): number {
        return that.sub(this).lenght();
    }
    array(): [number, number] {
        return [this.x, this.y];
    }
}


function canvasSize(ctx: CanvasRenderingContext2D): Vector2 {
    return new Vector2(ctx.canvas.width, ctx.canvas.height);
}

function fillCircle(ctx: CanvasRenderingContext2D, center: Vector2, radius: number) {
    ctx.beginPath();
    ctx.arc(...center.array(), radius, 0, Math.PI * 2);
    ctx.fill();
}

function strokeLine(ctx: CanvasRenderingContext2D, p1: Vector2, p2: Vector2) {
    ctx.beginPath();
    ctx.moveTo(...p1.array());
    ctx.lineTo(...p2.array());
    ctx.stroke();
}

function snap(x: number, dx: number): number {
    if (dx > 0) return Math.ceil(x + Math.sign(dx) * EPS);
    if (dx < 0) return Math.floor(x + Math.sign(dx) * EPS);
    return x;
}

function hittingCell(p1: Vector2, p2: Vector2): Vector2 {
    const d = p2.sub(p1);
    return new Vector2(
        Math.floor(p2.x + Math.sign(d.x) * EPS),
        Math.floor(p2.y + Math.sign(d.y) * EPS)
    );

}

function rayStep(p1: Vector2, p2: Vector2): Vector2 {
    let p3 = p2;
    const d = p2.sub(p1);
    if (d.x !== 0) {
        const k = d.y / d.x;
        const c = p1.y - k * p1.x;

        {
            const x3 = snap(p2.x, d.x);
            const y3 = x3 * k + c;
            p3 = new Vector2(x3, y3);
        }

        if (k !== 0) {
            const y3 = snap(p2.y, d.y);
            const x3 = (y3 - c) / k;
            const p3t = new Vector2(x3, y3);
            if (p2.distanceTo(p3t) < p2.distanceTo(p3)) {
                p3 = p3t;
            }
        }
    } else {
        const y3 = snap(p2.y, d.y);
        const x3 = p2.x;
        p3 = new Vector2(x3, y3);
    }

    return p3;
}

type Scene = Array<Array<number>>

function sceneSize(scene: Scene): Vector2 {
    const y = scene.length;
    let x = Number.MIN_VALUE;
    for (let row of scene) {
        x = Math.max(x, row.length);
    }
    return new Vector2(x, y);
}

class Player {
    position: Vector2;
    direction: number;
    constructor(position: Vector2, direction: number) {
        this.position = position;
        this.direction = direction;
    }
}

function minimap(ctx: CanvasRenderingContext2D, player: Player, position: Vector2, size: Vector2, scene: Array<Array<number>>) {
    ctx.save();

    ctx.fillStyle = "#181818";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    const gridSize = sceneSize(scene);

    ctx.translate(...position.array());
    ctx.scale(...size.div(gridSize).array());
    ctx.lineWidth = 0.1;

    for (let y = 0; y < gridSize.y; y++) {
        for (let x = 0; x < gridSize.x; x++) {
            if (scene[y][x] !== 0) {
                ctx.fillStyle = "#303030";
                ctx.fillRect(x, y, 1, 1);
            }
        }
    }

    ctx.strokeStyle = "#303030";
    for (let x: number = 0; x <= gridSize.x; x++) {
        strokeLine(ctx, new Vector2(x, 0), new Vector2(x, gridSize.y))
    }
    for (let y: number = 0; y <= gridSize.y; y++) {
        strokeLine(ctx, new Vector2(0, y), new Vector2(gridSize.x, y));
    }

    ctx.fillStyle = "green";
    fillCircle(ctx, player.position, 0.2);
    ctx.strokeStyle = "green";
    strokeLine(ctx, player.position, player.position.add(Vector2.fromAngle(player.direction).scale(NEAR_CLIPPING_PLANE)));

    ctx.restore();
}



(() => {
    let scene = [
        [0, 0, 1, 1, 0, 0, 0, 0, 0],
        [0, 0, 0, 1, 0, 0, 0, 0, 0],
        [0, 1, 1, 1, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ]
    const game = document.getElementById("game") as (HTMLCanvasElement | null);
    if (game == null) {
        throw new Error("No canvas with id `game` is found");
    }

    const factor = 80;
    game.width = 16 * factor;
    game.height = 9 * factor;
    const ctx = game.getContext("2d");
    if (ctx == null) {
        throw new Error("2D context is not supported");
    }

    let player = new Player(
        sceneSize(scene).mul(new Vector2(0.63, 0.63)),
        Math.PI * 1.25)
    let minimapPosition = Vector2.zero().add(canvasSize(ctx).scale(0.03));
    let cellSize = ctx.canvas.width * 0.06
    let minimapSize = sceneSize(scene).scale(cellSize);

    minimap(ctx, player, minimapPosition, minimapSize, scene);

})()
