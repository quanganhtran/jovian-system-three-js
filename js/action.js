// Constants and unit conversions
var G = 6.673e-11;
var kph = 0.277777778;
// Presentational scaling
var kmpp = 5000000;
var update_rate = 100;

function Body(x, y, vx, vy, mass) {
    this.x = x;    // holds the cartesian positions m
    this.y = y;
    this.vx = vx;   // velocity components m/s
    this.vy = vy;
    this.fx = 0.0;    // force components kg m/ s^2
    this.fy = 0.0;
    this.mass = mass;  // mass kg

    // update the velocity and position using a timestep dt
    this.update = function(dt) {
        this.vx += dt * this.fx / this.mass;
        this.vy += dt * this.fy / this.mass;
        this.x += dt * this.vx;
        this.y += dt * this.vy;
    };

    // returns the distance between two bodies
    this.distanceTo = function(b) {
        var dx = b.x - this.x;
        var dy = b.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    };

    // set the force to 0 for the next iteration
    this.resetForce = function() {
        this.fx = 0.0;
        this.fy = 0.0;
    };

    // compute the net force acting between the body a and b, and add to the net force acting on a
    this.addForce = function(b) {
        var EPS = 3E4;   // softening parameter (just to avoid infinities)
        var dx = b.x - this.x; // dx = x2 - x1
        var dy = b.y - this.y; // dy = y2 - y1
        var dist = Math.sqrt(dx * dx + dy * dy); // r = sqrt( dx^2 + dy^2 )
        var F = (G * this.mass * b.mass) / (dist * dist + EPS * EPS); // F = G.m1.m2 / r^2
        this.fx += F * dx / dist; // fx = F cos a
        this.fy += F * dy / dist; // fy = F sin a
        return [F * dx / dist, F * dy / dist];
    };
}

// Jupiter
var jupiter = new Body(0, 0, 0, 0, 1.8986e27);
// Io
var io = new Body(0, -421800e3, 62423.1 * kph, 0, 8.931e22);
// Europa
var europa = new Body(671100e3, 0, 0, 49476.1 * kph, 4.7998e22);
// Ganymede
var ganymede = new Body(0, 1070400e3, -39165.6 * kph, 0, 1.4819e23);
// Callisto
var callisto = new Body(-1882700e3, 0, 0, -29531.6 * kph, 1.0759e23);

// Jupiter and all satellites
var planets = [jupiter, io, europa, ganymede, callisto];

function calculate() {
    resetForceAll();
    addForceAll();
    updateAll();
    /*jupiter.update(updateRate);
    io.update(updateRate);
    europa.update(updateRate);*/
}

function resetForceAll() {
    for (var i = 0; i < planets.length; i++) {
        planets[i].resetForce();
    }
}

function addForceAll() {
    for (var i = 0; i < planets.length - 1; i++) {
        for (var j = i+1; j < planets.length; j++) {
            var tempForce = planets[i].addForce(planets[j]);
            planets[j].fx += -tempForce[0];
            planets[j].fy += -tempForce[1];
        }
    }
}

function updateAll() {
    for (var i = 0; i < planets.length; i++) {
            planets[i].update(update_rate);
    }
}

function init(){
  window.requestAnimationFrame(draw);
}

var c = document.getElementById('c');
var ctx = c.getContext('2d');

function draw() {
    calculate();
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0,0,c.width,c.height); // clear canvas
    ctx.save();
    ctx.translate(c.width / 2, c.height / 2);

    // Jupiter
    //ctx.drawImage(earth, jupiter.x - earth.width/2, jupiter.y - earth.height/2);
    ctx.beginPath();
    ctx.arc(jupiter.x / kmpp, jupiter.y / kmpp, 18, 0, Math.PI*2);
    ctx.closePath();
    ctx.stroke();

    // Io
    //ctx.drawImage(moon, io.x - moon.width/2, io.y - moon.height/2);
    ctx.beginPath();
    ctx.arc(io.x / kmpp, io.y / kmpp, 6, 0, Math.PI*2);
    ctx.closePath();
    ctx.fill();

    // Europa
    ctx.beginPath();
    ctx.arc(europa.x / kmpp, europa.y / kmpp, 5, 0, Math.PI*2);
    ctx.closePath();
    ctx.fill();

    // Ganymede
    ctx.beginPath();
    ctx.arc(ganymede.x / kmpp, ganymede.y / kmpp, 8, 0, Math.PI*2);
    ctx.closePath();
    ctx.fill();

    // Callisto
    ctx.beginPath();
    ctx.arc(callisto.x / kmpp, callisto.y / kmpp, 7, 0, Math.PI*2);
    ctx.closePath();
    ctx.fill();

    // Vectors
    drawVectors();

    //drawVelocity(jupiter);
    /*drawForce(jupiter);

    drawVelocity(io);
    drawForce(io);
    drawVelocity(europa);
    drawForce(europa);
    drawVelocity(ganymede);
    drawForce(ganymede);*/

    ctx.restore();

    stat();
    window.requestAnimationFrame(draw);
}

function drawVelocity(b) {
    var vector_scale = 500;
    ctx.beginPath();
    ctx.moveTo(b.x / kmpp, b.y / kmpp);
    ctx.lineTo(b.x / kmpp + b.vx / vector_scale, b.y / kmpp + b.vy / vector_scale);
    ctx.closePath();
    ctx.strokeStyle = '#ff0000';
    ctx.stroke();
}

function drawForce(b) {
    var vector_scale = 10e20;
    ctx.beginPath();
    ctx.moveTo(b.x / kmpp, b.y / kmpp);
    ctx.lineTo(b.x / kmpp + b.fx / vector_scale, b.y / kmpp + b.fy / vector_scale);
    ctx.closePath();
    ctx.strokeStyle = '#0000ff';
    ctx.stroke();
}

function drawVectors(drawJ) {
    if (drawJ) {
        drawVelocity(jupiter);
    }
    drawForce(jupiter);
    for (i = 1; i < planets.length; i++) {
        drawVelocity(planets[i]);
        drawForce(planets[i]);
    }
}

function stat() {
    document.getElementById("jx").innerHTML = jupiter.x;
    document.getElementById("jy").innerHTML = jupiter.y;
    document.getElementById("jvx").innerHTML = jupiter.vx;
    document.getElementById("jvy").innerHTML = jupiter.vy;
    document.getElementById("jfx").innerHTML = jupiter.fx;
    document.getElementById("jfy").innerHTML = jupiter.fy;
    document.getElementById("jm").innerHTML = jupiter.mass;

    document.getElementById("ix").innerHTML = io.x;
    document.getElementById("iy").innerHTML = io.y;
    document.getElementById("ivx").innerHTML = io.vx;
    document.getElementById("ivy").innerHTML = io.vy;
    document.getElementById("ifx").innerHTML = io.fx;
    document.getElementById("ify").innerHTML = io.fy;
    document.getElementById("im").innerHTML = io.mass;
}

init();