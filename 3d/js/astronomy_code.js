// Constants and unit conversions
var G = 6.673e-11;
var kph = 0.277777778;
var day = 86400;
// Presentational scaling
var mpp = 5000000;
var fps = 60;
var updateRate = 10e3 * (1/fps);

/* Calculation section */
/* Negligible variables include: axial tilts, eccentricity and orbital inclination */
function Body(x, z, vx, vz, mass, radius, rotation){
    this.x = x;    // holds the cartesian positions m
    this.z = z;
    this.vx = vx;   // velocity components m/s
    this.vz = vz;
    this.fx = 0.0;    // force components kg m/ s^2
    this.fz = 0.0;
    this.mass = mass;  // mass kg
    this.radius = radius || 4.0; // radius m
    this.rotation = rotation || 5; // sidereal rotation period s
    this.mesh = null;

    // update the velocity and position using a timestep dt (s)
    this.update = function(dt) {
        this.vx += dt * this.fx / this.mass;
        this.vz += dt * this.fz / this.mass;
        this.x += dt * this.vx;
        this.z += dt * this.vz;
        // Mesh update
        this.mesh.position.x = this.x / mpp;
        this.mesh.position.z = this.z / mpp;
        this.mesh.rotation.y -= 2 * Math.PI / this.rotation * dt;
    };

    // returns the distance between two bodies
    this.distanceTo = function(b) {
        var dx = b.x - this.x;
        var dz = b.z - this.z;
        return Math.sqrt(dx * dx + dz * dz);
    };

    // manually set force in optimization code
    this.setForce = function(fx, fz) {
        this.fx = fx;
        this.fz = fz;
    };

    // set the force to 0 for the next iteration
    this.resetForce = function() {
        this.fx = 0.0;
        this.fz = 0.0;
    };

    // compute the net force acting between the body a and b, and add to the net force acting on a
    this.addForce = function(b) {
        var EPS = 3E4;   // softening parameter (just to avoid infinities)
        var dx = b.x - this.x; // dx = x2 - x1
        var dz = b.z - this.z; // dy = y2 - y1
        var dist = Math.sqrt(dx * dx + dz * dz); // r = sqrt( dx^2 + dy^2 )
        var F = (G * this.mass * b.mass) / (dist * dist + EPS * EPS); // F = G.m1.m2 / r^2
        this.fx += F * dx / dist; // fx = F cos a
        this.fz += F * dz / dist; // fy = F sin a
        return [F * dx / dist, F * dz / dist];
    };

    this.locateMesh = function() {
        this.mesh.position.x = this.x / mpp;
        this.mesh.position.z = this.z / mpp;
    };

    this.rotate = function(dt) {
        this.mesh.rotation.y += 2 * Math.PI / this.rotation * dt;
    }
}

// Jupiter and all satellites
// var nB = new Body( x, z, vx, vz, mass, radius, rotation)
var jupiter = new Body(0, 0, 0, 0, 1.8986e27, /*radius and rotation follows*/
    20, 0.41354 * day);
var io = new Body(0, -421800e3, 62423.1 * kph, 0, 8.931e22,/**/
    3, 1.769 * day);
var europa = new Body(671100e3, 0, 0, 49476.1 * kph, 4.7998e22,/**/
    2, 3.551 * day);
var ganymede = new Body(0, 1070400e3, -39165.6 * kph, 0, 1.4819e23,/**/
    5, 7.155 * day);
var callisto = new Body(-1882700e3, 0, 0, -29531.6 * kph, 1.0759e23,/**/
    4, 16.6890184 * day);
var bodies = [jupiter, io, europa, ganymede, callisto];

function calculate(dt) {
    resetForceAll();
    addForceAll();
    updateAll(dt);
}
function resetForceAll() {
    for (var i = 0; i < bodies.length; i++) {
        bodies[i].resetForce();
    }
}
function addForceAll() {
    // Optimized
    for (var i = 0; i < bodies.length - 1; i++) {
        for (var j = i+1; j < bodies.length; j++) {
            var tempForce = bodies[i].addForce(bodies[j]);
            bodies[j].fx += -tempForce[0];
            bodies[j].fz += -tempForce[1];
        }
    }
}
function updateAll(dt) {
    for (var i = 0; i < bodies.length; i++) {
        bodies[i].update(dt);
    }
}