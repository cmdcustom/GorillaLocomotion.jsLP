const CNV = {
  Vector_AmmoToThree: [c => c.x(), c => c.y(), c => c.z()]
}

function normalizeV3(v) {
  //v: THREE.Vector3
  return new THREE.Vector3().copy(v).normalize()
}

function tp(collider){
  return VecToThree(collider.getWorldTransform().getOrigin(), CNV.Vector_AmmoToTHREE)
}
function VecToThree(v, fx, fy, fz) {
  return new THREE.Vector3(fx(v), fy(v), fz(v))
}

function PositionWithOffset(t, o) {
  //t: THREE.Mesh
  //o: THREE.Vector3
  return new THREE.Vector3().copy(t.position).times(t.rotation).add(o)
}
class Player {
  Player; //player "instance", unknown
  Instance; //player instance, unknown 
  ammoRb //Ammo.btRigidBody
  headCollider; //Ammo.btRigidBody (previous: unknown, possibly related to Ammo.btSphereShape)
  bodyCollider; //Ammo.btRigidBody (previous: unknown, possibly related to Ammo.btSphereShape)
  leftHandFollower; //THREE.Mesh
  rightHandFollower; //THREE.Mesh
  rightHandTransform; //THREE.Mesh
  leftHandTransform; //THREE.Mesh
  lastLeftHandPosition; //THREE.Vector3
  lastRightHandPosition; //THREE.Vector3
  lastHeadPosition; //THREE.Vector3
  playerRigidBody; //Ammo.btRigidBody
  velocityHistorySize; //Number, parseInt
  maxArmLength = 1.5; //Number, parseFloat
  unStickDistance = 1; //Number, parseFloat
  velocityLimit; //Number, parseFloat
  maxJumpSpeed; //Number, parseFloat
  jumpMultiplier; //Number, parseFloat
  minimumRaycastDistance = 0.05 //Number, parseFloat;
  defaultSlideFactor = 0.03; //Number, parseFloat
  defaultPrecision = 0.995; //Number, parseFloat
  velocityHistory; //THREE.Vector3[]
  velocityIndex; //Number, parseInt
  currentVelocity; //THREE.Vector3
  denormalizedVelocityAverage; //THREE.Vector3
  jumpHandIsLeft; //Boolean
  lastPosition; //THREE.Vector3
  rightHandOffset; //THREE.Vector3
  leftHandOffset; //THREE.Vector3
  locomotionEnabledLayers; //Original: LayerMask, 32 bit integer, possibly variation of Number
  wasLeftHandTouching; //Boolean
  wasRightHandTouching; //Boolean
  disableMovement = false; //Boolean
  object //THREE.Mesh
  #Awake() {
    //             if (this.#Player != null && this.#Player != this)
    //             {
    //                 Scene.remove(this.object);
    //             }
    //             else
    //             {
    //                 _instance = this;
    //             }
    this.InitializeValues();
  }
  
  constructor(o) {
    this.object = o;
  }
  InitializeValues() {
    this.playerRigidBody = this.ammoRb;
    this.velocityHistory = Array(this.velocityHistorySize).fill(new THREE.Vector3);
    this.lastLeftHandPosition = this.leftHandFollower.position;
    this.lastRightHandPosition = this.rightHandFollower.position;
    this.lastHeadPosition = tp(this.headCollider)
    this.velocityIndex = 0;
    this.lastPosition = this.object.position
  }
  
  #CurrentLeftHandPosition() {
    if ((PositionWithOffset(this.leftHandTransform, this.leftHandOffset) - tp(this.headCollider)).magnitude < this.maxArmLength) {
      return PositionWithOffset(this.leftHandTransform, this.leftHandOffset);
    } else {
      return tp(this.headCollider) + normalizeV3(PositionWithOffset(this.leftHandTransform, this.leftHandOffset) - tp(this.headCollider)) * this.maxArmLength;
    }
  }
  
  #CurrentRightHandPosition() {
    if ((PositionWithOffset(this.rightHandTransform, this.rightHandOffset) - tp(this.headCollider)).magnitude < this.maxArmLength) {
      return PositionWithOffset(this.rightHandTransform, this.rightHandOffset);
    } else {
      return tp(this.headCollider) + normalizeV3(PositionWithOffset(this.rightHandTransform, this.rightHandOffset) - tp(this.headCollider)) * this.maxArmLength;
    }
  }
}
