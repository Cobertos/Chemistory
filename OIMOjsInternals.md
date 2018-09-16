This doesn't cover any THREEjs integration (as webworkers cant use this anyway)

### Types of Rigidbodies

* Static, no flags. Object isn't physic'd, object can't move, don't try to use setPosition() with this, it's hacky, it will internally set it to isKinematic
* Kinematic, `o.kinematic`. Object isn't physic'd, object can move w/ setPosition
* Dynamic, `o.move`. Object is physic'd, object can move w/ setPosition

Static is internally BODY_STATIC, while dynamic (move) is BODY_DYNAMIC. Kinematic is BODY_STATIC with isKinematic flag. There's also BODY_KINEMATIC which is unused. BODY_GHOST is also defined but unused.

### Getting and setting properties

* setPosition(vec3), sets the position of an object, must be kinematic or dynamic, otherwise you need hacky updatePosition() call (sets isKinematic to true automatically, also sets controlPos for next frame which idk wtf that does). This also itself does a bunch of weird shit when setting position (including clearing velocities sometimes or changing them to some weird values) so don't use this
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

### Rigidbody properties quickreference
The docs has this info too but the docs are annoying to use and not complete

* `.type` -  the type of shape 'box' 'sphere' 'cylinder' can be a array of shape for compound object
* `.move` - static or dynamic object (not the only possibilities, see the undocumented section + see the section at the top. 
* `.size` - array of size of shape [ x, y, z ]
* `.pos` - array of position of shape [ x, y, z ]
* `.rot` - array of rotation in degree of shape [ x, y, z ]
* `.density` - density of the shape. With the volume, this will calculate mass, idk why you cant just set mass directly... :/ (maybe you can, I forgot)
* `.friction` - coefficient of friction of the shape, which is mass dependant (normal force * coefficient of friction), and can be 0-Inf. Lower is slipperier. Default is 0.2, which is about the friction of wet wood on metal according to Wikipedia. Probably best to define a new one!
* `.restitution` - coefficient of restitution of the shape, which defines how much momentum (?) it will keep after a collision. 1 is perfectly elastic, 0 is perfectly inelastic.
* `.belongsTo` - bits of the collision groups to which the shape belongs. Hex bitmask
* `.collidesWith` - bits of the collision groups with which the shape collides. Hex bitmask

#### Undocumented! But super useful
* `.kinematic` - Sets the object to kinematic mode. Position can change in the physics engine but doesn't have physics simulated.
* `.move` - Object will have physics simulated, can have position changed.
* `.neverSleep` - Object will never fall asleep