/**
 * Created by Anh on 5/1/2015.
 */
// Constants and unit conversions
var G = 6.673e-11;
var kph = 0.277777778;
var hour = 3600;
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

/* 3D rendering section */
var renderer = null,
    scene = null,
    camera = null,
    controls = null;
var milkyWay = {mesh: null};
var sun = null;
    sunlight = null;

var duration = 5000; // ms
var currentTime = Date.now();
function animate() {
    var now = Date.now();
    var dt = now - currentTime;
    currentTime = now;
    var angle = Math.PI * 2 * (dt / duration);
    sun.lookAt(camera.position);
    calculate(updateRate);
    controls.update();
}
function run() { // The render loop
    requestAnimationFrame(function() { window.setTimeout(run, 1000 / fps); }); // This function reads milliseconds.
    // Render the scene
    renderer.render( scene, camera );
    // Animation calculation
    animate();
}

function planetMesh(texture, radius) {
    var map = THREE.ImageUtils.loadTexture(texture);
    var mat = new THREE.MeshLambertMaterial({map: map});
    var geo = new THREE.SphereGeometry(radius);
    //return new THREE.Mesh(geo, mat);
    var mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}

$(document).ready(
    function() {
        var canvas = document.getElementById("glc");
        // Create the Three.js renderer and attach it to our canvas
        renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true, alpha: true  } );
        renderer.setSize(canvas.width, canvas.height); // Set the viewport size
        renderer.shadowMapEnabled = true;
        renderer.shadowMapType = THREE.PCFSoftShadowMap;
        scene = new THREE.Scene(); // Create a new Three.js scene

        // Add a camera so we can view the scene
        camera = new THREE.PerspectiveCamera(45, canvas.width / canvas.height, 1, 6000);
        //camera = new THREE.OrthographicCamera(width / - 2, width / 2, height / 2, height / - 2, 1, 1000);
        defaultCamera();
        controls = new THREE.OrbitControls(camera, canvas);
        //controls.damping = 0.2;
        scene.add(camera);

        // Add light from the Sun

        sunlight = new THREE.DirectionalLight(0xffffff, 1.5);
        sunlight.position.set(0, 0, 500); // Sun shines from z as infinite positive towards the origin
        sunlight.castShadow = true;
        sunlight.shadowDarkness = 1;

        sunlight.shadowCameraNear = 200;
        sunlight.shadowCameraFar = 1000;
        sunlight.shadowCameraLeft = -400;
        sunlight.shadowCameraRight = 400;
        sunlight.shadowCameraTop = 400;
        sunlight.shadowCameraBottom = -400;
        sunlight.shadowMapWidth = 2048;
        sunlight.shadowMapHeight = 2048;

        scene.add(sunlight);

        // Add the Sun
        var textureFlare = THREE.ImageUtils.loadTexture( "textures/lensflare/sun_alpha.png" );
        var material = new THREE.SpriteMaterial( { map: textureFlare, color: 0xffffff, fog: true } );
        sun = new THREE.Sprite( material );
        sun.position.z = 2800;
        sun.scale.set( 400, 400, 1.0 );
        scene.add( sun );

        // Create texture-mapped universe and add it to the scene
        var mapUrl = "textures/milkyway_ultra.jpg"; // First, create the texture map
        var map = THREE.ImageUtils.loadTexture(mapUrl);
        var mat = new THREE.MeshBasicMaterial({ map: map });
        //mat.side = THREE.BackSide;

        // Create the geometry
        var geo = new THREE.SphereGeometry(3000, 80, 80);
        geo.applyMatrix( new THREE.Matrix4().makeScale( -1, 1, 1 ) );

        // And put the geometry and material together into a mesh
        milkyWay.mesh = new THREE.Mesh(geo, mat);
        milkyWay.mesh.rotation.x = - 0.8;
        milkyWay.mesh.rotation.y = - 0.3;
        milkyWay.mesh.rotation.z = - 1.3;

        jupiter.mesh = planetMesh("textures/jupiter.jpg", 20);
        jupiter.locateMesh();

        io.mesh = planetMesh("textures/io.jpg", io.radius);
        io.locateMesh();

        europa.mesh = planetMesh("textures/europa.jpg", europa.radius);
        europa.locateMesh();

        ganymede.mesh = planetMesh("textures/ganymede.jpg", ganymede.radius);
        ganymede.locateMesh();

        callisto.mesh = planetMesh("textures/callisto.jpg", callisto.radius);
        callisto.locateMesh();

        // Finally, add the mesh to our scene
        setQuality(2);
        scene.add(milkyWay.mesh);
        for (var i = 0; i < bodies.length; i++) {
            scene.add(bodies[i].mesh);
        }

        // Run the run loop
        run();
    }
);

/* Custom settings */
function topDownCamera() {
    camera.position.z = 0;
    camera.position.y = 600;
    camera.rotation.x = - Math.PI / 2;
}
function frontCamera() {
    camera.position.z = 600;
    camera.position.y = 0;
    camera.rotation.x = 0;
}
function defaultCamera() {
    camera.position.z = 600;
    camera.position.y = 150;
    camera.lookAt(new THREE.Vector3(0, 0, 0));
}

function setQuality(qual) {
    jupiter.mesh.geometry = new THREE.SphereGeometry(20, 20 * qual, 20 * qual);
    for (var i = 1; i < bodies.length; i++) {
        var rad = bodies[i].radius;
        bodies[i].mesh.geometry = new THREE.SphereGeometry(rad, (rad + 5) * qual, (rad + 5) * qual);
    }
}
function defaultQuality() {
    jupiter.mesh.geometry = new THREE.SphereGeometry(20);
    for (var i = 1; i < bodies.length; i++) {
        var rad = bodies[i].radius;
        bodies[i].mesh.geometry = new THREE.SphereGeometry(rad);
    }
}

function setRadius(type) {
    var arrayOfSize = [1, 1, 1, 1, 1];
    switch (type) {
        case "real":
            arrayOfSize = [
                69911e3 / mpp,
                1821.6e3 / mpp,
                1560.8e3 / mpp,
                2631.2e3 / mpp,
                2410.3e3 / mpp
            ];
            break;
        case "easy":
            arrayOfSize = [20, 3, 2, 5, 4];
            break;
        case "large":
            arrayOfSize = [60, 9, 6, 15, 12];
            break;
    }
    jupiter.radius = arrayOfSize[0];
    io.radius = arrayOfSize[1];
    europa.radius = arrayOfSize[2];
    ganymede.radius = arrayOfSize[3];
    callisto.radius = arrayOfSize[4];
    for (var i = 0; i < bodies.length; i++) {
        var rad = bodies[i].radius;
        bodies[i].mesh.geometry = new THREE.SphereGeometry(rad, (rad + 5) * 2, (rad + 5) * 2);
    }
}

function turnOnOffBg() {
    milkyWay.mesh.geometry.applyMatrix(new THREE.Matrix4().makeScale( -1, 1, 1 ));
}
