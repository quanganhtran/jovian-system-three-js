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

// Jupiter and all satellites
var jupiter = new Body(0, 0, 0, 0, 1.8986e27);
var io = new Body(0, -421800e3, 62423.1 * kph, 0, 8.931e22);
var europa = new Body(671100e3, 0, 0, 49476.1 * kph, 4.7998e22);
var ganymede = new Body(0, 1070400e3, -39165.6 * kph, 0, 1.4819e23);
var callisto = new Body(-1882700e3, 0, 0, -29531.6 * kph, 1.0759e23);
var planets = [jupiter, io, europa, ganymede, callisto];

function calculate() {
    resetForceAll();
    addForceAll();
    updateAll();
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

function Body3D(body, mesh, rotation) {
    this.body = body;
    this.mesh = mesh;
    this.rotation = rotation;
}

var jupiter3d = new Body3D(jupiter, null, 0.25);
var io3d = new Body3D(io, null, 0.25);
var europa3d = new Body3D(europa, null, 0.25);
var ganymede3d = new Body3D(ganymede, null, 0.25);
var callisto3d = new Body3D(callisto, null, 0.25);

/* 3D Section */
var renderer = null,
    scene = null,
    camera = null,
    cube = null;
var sphere = null;

var duration = 5000; // ms
var currentTime = Date.now();
function animate() {
    var now = Date.now();
    var deltat = now - currentTime;
    currentTime = now;
    var fract = deltat / duration;
    var angle = Math.PI * 2 * fract;
    sphere.rotation.y += angle;
}
function run() {
    requestAnimationFrame(function() { run(); });
    // Render the scene
    renderer.render( scene, camera );
    // Spin the cube for next frame
    animate();
}
$(document).ready(
    function() {
        var canvas = document.getElementById("glc");
        // Create the Three.js renderer and attach it to our canvas
        renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );
        // Set the viewport size
        renderer.setSize(canvas.width, canvas.height);
        // Create a new Three.js scene
        scene = new THREE.Scene();
        // Add a camera so we can view the scene
        //camera = new THREE.PerspectiveCamera( 45, canvas.width / canvas.height, 1, 4000 );
        camera = new THREE.PerspectiveCamera(45, canvas.width / canvas.height, 1, 4000);
        camera.position.z = 40;
        camera.position.y = 10;
        camera.rotation.x = -0.1;
        scene.add(camera);
        // Create a texture-mapped cube and add it to the scene
        // First, create the texture map
        var mapUrl = "texture/crate.jpg";
        var map = THREE.ImageUtils.loadTexture(mapUrl);
        var mapUrl2 = "texture/jupiter.jpg";
        var map2 = THREE.ImageUtils.loadTexture(mapUrl2);
        // Now, create a Basic material; pass in the map
        var material = new THREE.MeshBasicMaterial({ map: map });
        var mat2 = new THREE.MeshBasicMaterial({map: map2});

        // Create the cube geometry
        var geo2 = new THREE.SphereGeometry(2, 50, 50);

        // And put the geometry and material together into a mesh
        sphere = new THREE.Mesh(geo2, mat2);

        // Move the mesh back from the camera and tilt it toward
        // the viewer
        sphere.rotation.y = Math.PI / 5;
        // Finally, add the mesh to our scene
        scene.add(sphere);

        // Run the run loop
        run();
    }
);
