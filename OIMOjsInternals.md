This doesn't cover any THREEjs integration (as webworkers cant use this anyway)

### Types of Rigidbodies

* Static, no flags. Object isn't physic'd, object can't move, don't try to use setPosition() with this, it's hacky
* Kinematic, `o.kinematic`. Object isn't physic'd, object can move w/ setPosition
* Dynamic, `o.move`. Object is physic'd, object can move w/ setPosition

Static is internally BODY_STATIC, while dynamic is BODY_DYNAMIC. Kinematic is BODY_DYNAMIC with isKinematic flag. There's also BODY_KINEMATIC which is unused. BODY_GHOST is also defined but unused

### Getting and setting properties

* setPosition(vec3), sets the position of an object, must be kinematic or dynamic, otherwise you need hacky updatePosition() call (sets isKinematic if false, also sets controlPos for next frame)
* setQuaternion(vec4), as above, w/ quaternion
* setRotation(r), as above, with euler angles
* reset\*, as above, though resetPosition and resetPosition take x,y,z and not vec3. Will zero out velocity, linear and angular
* getPosition, getQuaternion
* applyImpulse(vec3:position, vec3:force), applies force scaled by 1/m at position for that frame at global position
* .linearVelocity, .angularVelocity, vec3 with each quantity

### Useful internals

* Each rigidbody has .mass, calculated from each shape in .shapes and its .massInfo (setup in calculateMassInfo)