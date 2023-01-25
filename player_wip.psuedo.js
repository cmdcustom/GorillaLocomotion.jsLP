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
  locomotionEnabledLayers; //Original: LayerMask, 32 bit integer, THREE.Layers.Mask?
  wasLeftHandTouching; //Boolean
  wasRightHandTouching; //Boolean
  disableMovement = false; //Boolean
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
  InitializeValues() {
    this.playerRigidBody = ammoRb;
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
  
  #CurrentLeftHandPosition() {
    if ((PositionWithOffset(this.leftHandTransform, this.leftHandOffset) - tp(this.headCollider)).magnitude < this.maxArmLength) {
      return PositionWithOffset(this.leftHandTransform, this.leftHandOffset);
    } else {
      return tp(this.headCollider) + normalizeV3(PositionWithOffset(this.leftHandTransform, this.leftHandOffset) - tp(this.headCollider)) * this.maxArmLength;
    }
  }


        private void Update()
        {
            bool leftHandColliding = false;
            bool rightHandColliding = false;
            Vector3 finalPosition;
            Vector3 rigidBodyMovement = Vector3.zero;
            Vector3 firstIterationLeftHand = Vector3.zero;
            Vector3 firstIterationRightHand = Vector3.zero;
            RaycastHit hitInfo;

            bodyCollider.transform.eulerAngles = new Vector3(0, headCollider.transform.eulerAngles.y, 0);

            //left hand

            Vector3 distanceTraveled = CurrentLeftHandPosition() - lastLeftHandPosition + Vector3.down * 2f * 9.8f * Time.deltaTime * Time.deltaTime;

            if (IterativeCollisionSphereCast(lastLeftHandPosition, minimumRaycastDistance, distanceTraveled, defaultPrecision, out finalPosition, true))
            {
                //this lets you stick to the position you touch, as long as you keep touching the surface this will be the zero point for that hand
                if (wasLeftHandTouching)
                {
                    firstIterationLeftHand = lastLeftHandPosition - CurrentLeftHandPosition();
                }
                else
                {
                    firstIterationLeftHand = finalPosition - CurrentLeftHandPosition();
                }
                playerRigidBody.velocity = Vector3.zero;

                leftHandColliding = true;
            }

            //right hand

            distanceTraveled = CurrentRightHandPosition() - lastRightHandPosition + Vector3.down * 2f * 9.8f * Time.deltaTime * Time.deltaTime;

            if (IterativeCollisionSphereCast(lastRightHandPosition, minimumRaycastDistance, distanceTraveled, defaultPrecision, out finalPosition, true))
            {
                if (wasRightHandTouching)
                {
                    firstIterationRightHand = lastRightHandPosition - CurrentRightHandPosition();
                }
                else
                {
                    firstIterationRightHand = finalPosition - CurrentRightHandPosition();
                }

                playerRigidBody.velocity = Vector3.zero;

                rightHandColliding = true;
            }

            //average or add

            if ((leftHandColliding || wasLeftHandTouching) && (rightHandColliding || wasRightHandTouching))
            {
                //this lets you grab stuff with both hands at the same time
                rigidBodyMovement = (firstIterationLeftHand + firstIterationRightHand) / 2;
            }
            else
            {
                rigidBodyMovement = firstIterationLeftHand + firstIterationRightHand;
            }

            //check valid head movement

            if (IterativeCollisionSphereCast(lastHeadPosition, headCollider.radius, headCollider.transform.position + rigidBodyMovement - lastHeadPosition, defaultPrecision, out finalPosition, false))
            {
                rigidBodyMovement = finalPosition - lastHeadPosition;
                //last check to make sure the head won't phase through geometry
                if (Physics.Raycast(lastHeadPosition, headCollider.transform.position - lastHeadPosition + rigidBodyMovement, out hitInfo, (headCollider.transform.position - lastHeadPosition + rigidBodyMovement).magnitude + headCollider.radius * defaultPrecision * 0.999f, locomotionEnabledLayers.value))
                {
                    rigidBodyMovement = lastHeadPosition - headCollider.transform.position;
                }
            }

            if (rigidBodyMovement != Vector3.zero)
            {
                transform.position = transform.position + rigidBodyMovement;
            }

            lastHeadPosition = headCollider.transform.position;

            //do final left hand position

            distanceTraveled = CurrentLeftHandPosition() - lastLeftHandPosition;

            if (IterativeCollisionSphereCast(lastLeftHandPosition, minimumRaycastDistance, distanceTraveled, defaultPrecision, out finalPosition, !((leftHandColliding || wasLeftHandTouching) && (rightHandColliding || wasRightHandTouching))))
            {
                lastLeftHandPosition = finalPosition;
                leftHandColliding = true;
            }
            else
            {
                lastLeftHandPosition = CurrentLeftHandPosition();
            }

            //do final right hand position

            distanceTraveled = CurrentRightHandPosition() - lastRightHandPosition;

            if (IterativeCollisionSphereCast(lastRightHandPosition, minimumRaycastDistance, distanceTraveled, defaultPrecision, out finalPosition, !((leftHandColliding || wasLeftHandTouching) && (rightHandColliding || wasRightHandTouching))))
            {
                lastRightHandPosition = finalPosition;
                rightHandColliding = true;
            }
            else
            {
                lastRightHandPosition = CurrentRightHandPosition();
            }

            StoreVelocities();

            if ((rightHandColliding || leftHandColliding) && !disableMovement)
            {
                if (denormalizedVelocityAverage.magnitude > velocityLimit)
                {
                    if (denormalizedVelocityAverage.magnitude * jumpMultiplier > maxJumpSpeed)
                    {
                        playerRigidBody.velocity = denormalizedVelocityAverage.normalized * maxJumpSpeed;
                    }
                    else
                    {
                        playerRigidBody.velocity = jumpMultiplier * denormalizedVelocityAverage;
                    }
                }
            }

            //check to see if left hand is stuck and we should unstick it

            if (leftHandColliding && (CurrentLeftHandPosition() - lastLeftHandPosition).magnitude > unStickDistance && !Physics.SphereCast(headCollider.transform.position, minimumRaycastDistance * defaultPrecision, CurrentLeftHandPosition() - headCollider.transform.position, out hitInfo, (CurrentLeftHandPosition() - headCollider.transform.position).magnitude - minimumRaycastDistance, locomotionEnabledLayers.value))
            {
                lastLeftHandPosition = CurrentLeftHandPosition();
                leftHandColliding = false;
            }

            //check to see if right hand is stuck and we should unstick it

            if (rightHandColliding && (CurrentRightHandPosition() - lastRightHandPosition).magnitude > unStickDistance && !Physics.SphereCast(headCollider.transform.position, minimumRaycastDistance * defaultPrecision, CurrentRightHandPosition() - headCollider.transform.position, out hitInfo, (CurrentRightHandPosition() - headCollider.transform.position).magnitude - minimumRaycastDistance, locomotionEnabledLayers.value))
            {
                lastRightHandPosition = CurrentRightHandPosition();
                rightHandColliding = false;
            }

            leftHandFollower.position = lastLeftHandPosition;
            rightHandFollower.position = lastRightHandPosition;

            wasLeftHandTouching = leftHandColliding;
            wasRightHandTouching = rightHandColliding;
        }

        private bool IterativeCollisionSphereCast(Vector3 startPosition, float sphereRadius, Vector3 movementVector, float precision, out Vector3 endPosition, bool singleHand)
        {
            RaycastHit hitInfo;
            Vector3 movementToProjectedAboveCollisionPlane;
            Surface gorillaSurface;
            float slipPercentage;
            //first spherecast from the starting position to the final position
            if (CollisionsSphereCast(startPosition, sphereRadius * precision, movementVector, precision, out endPosition, out hitInfo))
            {
                //if we hit a surface, do a bit of a slide. this makes it so if you grab with two hands you don't stick 100%, and if you're pushing along a surface while braced with your head, your hand will slide a bit

                //take the surface normal that we hit, then along that plane, do a spherecast to a position a small distance away to account for moving perpendicular to that surface
                Vector3 firstPosition = endPosition;
                gorillaSurface = hitInfo.collider.GetComponent<Surface>();
                slipPercentage = gorillaSurface != null ? gorillaSurface.slipPercentage : (!singleHand ? defaultSlideFactor : 0.001f);
                movementToProjectedAboveCollisionPlane = Vector3.ProjectOnPlane(startPosition + movementVector - firstPosition, hitInfo.normal) * slipPercentage;
                if (CollisionsSphereCast(endPosition, sphereRadius, movementToProjectedAboveCollisionPlane, precision * precision, out endPosition, out hitInfo))
                {
                    //if we hit trying to move perpendicularly, stop there and our end position is the final spot we hit
                    return true;
                }
                //if not, try to move closer towards the true point to account for the fact that the movement along the normal of the hit could have moved you away from the surface
                else if (CollisionsSphereCast(movementToProjectedAboveCollisionPlane + firstPosition, sphereRadius, startPosition + movementVector - (movementToProjectedAboveCollisionPlane + firstPosition), precision * precision * precision, out endPosition, out hitInfo))
                {
                    //if we hit, then return the spot we hit
                    return true;
                }
                else
                {
                    //this shouldn't really happe, since this means that the sliding motion got you around some corner or something and let you get to your final point. back off because something strange happened, so just don't do the slide
                    endPosition = firstPosition;
                    return true;
                }
            }
            //as kind of a sanity check, try a smaller spherecast. this accounts for times when the original spherecast was already touching a surface so it didn't trigger correctly
            else if (CollisionsSphereCast(startPosition, sphereRadius * precision * 0.66f, movementVector.normalized * (movementVector.magnitude + sphereRadius * precision * 0.34f), precision * 0.66f, out endPosition, out hitInfo))
            {
                endPosition = startPosition;
                return true;
            } else
            {
                endPosition = Vector3.zero;
                return false;
            }
        }

        private bool CollisionsSphereCast(Vector3 startPosition, float sphereRadius, Vector3 movementVector, float precision, out Vector3 finalPosition, out RaycastHit hitInfo)
        {
            //kind of like a souped up spherecast. includes checks to make sure that the sphere we're using, if it touches a surface, is pushed away the correct distance (the original sphereradius distance). since you might
            //be pushing into sharp corners, this might not always be valid, so that's what the extra checks are for

            //initial spherecase
            RaycastHit innerHit;
            if (Physics.SphereCast(startPosition, sphereRadius * precision, movementVector, out hitInfo, movementVector.magnitude + sphereRadius * (1 - precision), locomotionEnabledLayers.value))
            {
                //if we hit, we're trying to move to a position a sphereradius distance from the normal
                finalPosition = hitInfo.point + hitInfo.normal * sphereRadius;

                //check a spherecase from the original position to the intended final position
                if (Physics.SphereCast(startPosition, sphereRadius * precision * precision, finalPosition - startPosition, out innerHit, (finalPosition - startPosition).magnitude + sphereRadius * (1 - precision * precision), locomotionEnabledLayers.value))
                {
                    finalPosition = startPosition + (finalPosition - startPosition).normalized * Mathf.Max(0, hitInfo.distance - sphereRadius * (1f - precision * precision));
                    hitInfo = innerHit;
                }
                //bonus raycast check to make sure that something odd didn't happen with the spherecast. helps prevent clipping through geometry
                else if (Physics.Raycast(startPosition, finalPosition - startPosition, out innerHit, (finalPosition - startPosition).magnitude + sphereRadius * precision * precision * 0.999f, locomotionEnabledLayers.value))
                {
                    finalPosition = startPosition;
                    hitInfo = innerHit;
                    return true;
                }
                return true;
            }
            //anti-clipping through geometry check
            else if (Physics.Raycast(startPosition, movementVector, out hitInfo, movementVector.magnitude + sphereRadius * precision * 0.999f, locomotionEnabledLayers.value))
            {
                finalPosition = startPosition;
                return true;
            }
            else
            {
                finalPosition = Vector3.zero;
                return false;
            }
        }

        public bool IsHandTouching(bool forLeftHand)
        {
            if (forLeftHand)
            {
                return wasLeftHandTouching;
            }
            else
            {
                return wasRightHandTouching;
            }
        }

        public void Turn(float degrees)
        {
            transform.RotateAround(headCollider.transform.position, transform.up, degrees);
            denormalizedVelocityAverage = Quaternion.Euler(0, degrees, 0) * denormalizedVelocityAverage;
            for (int i = 0; i < velocityHistory.Length; i++)
            {
                velocityHistory[i] = Quaternion.Euler(0, degrees, 0) * velocityHistory[i];
            }
        }

        private void StoreVelocities()
        {
            velocityIndex = (velocityIndex + 1) % velocityHistorySize;
            Vector3 oldestVelocity = velocityHistory[velocityIndex];
            currentVelocity = (transform.position - lastPosition) / Time.deltaTime;
            denormalizedVelocityAverage += (currentVelocity - oldestVelocity) / (float)velocityHistorySize;
            velocityHistory[velocityIndex] = currentVelocity;
            lastPosition = transform.position;
        }
    }
}
