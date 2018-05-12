This doesn't cover any THREEjs integration (as webworkers cant use this anyway)

### Types of Rigidbodies

* Static, no flags. Object isn't physic'd, object can't move, don't try to use setPosition() with this, it's hacky, it will internally set it to isKinematic
* Kinematic, `o.kinematic`. Object isn't physic'd, object can move w/ setPosition
* Dynamic, `o.move`. Object is physic'd, object can move w/ setPosition

Static is internally BODY_STATIC, while dynamic (move) is BODY_DYNAMIC. Kinematic is BODY_STATIC with isKinematic flag. There's also BODY_KINEMATIC which is unused. BODY_GHOST is also defined but unused.

There's also a neverSleep flag which will cuse the object to never sleep

### Getting and setting properties

* setPosition(vec3), sets the position of an object, must be kinematic or dynamic, otherwise you need hacky updatePosition() call (sets isKinematic if false, also sets controlPos for next frame). This also itself does a bunch of weird shit when setting position (including clearing velocities sometimes or changing them to some weird values) so don't use this
* setQuaternion(vec4), as above, w/ quaternion
* setRotation(r), as above, with euler angles
* reset\*, as above, though resetPosition and resetPosition take x,y,z and not vec3. Will zero out velocity, linear and angular
* getPosition, getQuaternion, these are seemingly fine
* applyImpulse(vec3:position, vec3:force), applies force scaled by 1/mass at position for that frame at global position
* .linearVelocity, .angularVelocity, vec3 with each quantity
* .position, vec3 with position
* .orientation, quat with quaternion

### Useful internals

* Each rigidbody has .mass, calculated from each shape in .shapes and its .massInfo (setup in calculateMassInfo)