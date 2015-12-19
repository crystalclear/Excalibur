/// <reference path="ICollisionResolver.ts"/>
/// <reference path="DynamicTree.ts"/>

module ex {
    
   export class DynamicTreeCollisionResolver implements ICollisionResolver {
      private _dynamicCollisionTree = new DynamicTree();
      
      /**
       * Register an actor with the current resolver for this collision group
       */
      public register(target: Actor): void {
         this._dynamicCollisionTree.registerActor(target);
      }

      /**
       * Remove an actor from the current resolver for the current group
       */ 
      public remove(target: Actor): void {
         this._dynamicCollisionTree.removeActor(target);
      }

      /**
       * For all actors in a group, evaluate the current DynamicAABB Collision try to generate a list of collision pairs
       */
      public evaluate(targets: Actor[]): CollisionPair[] {
         // Retrieve the list of potential colliders, exclude killed, prevented, and self
         var potentialColliders = targets.filter((other) => {
            return !other.isKilled() && other.collisionType !== CollisionType.PreventCollision;
         });

         var actor: Actor;
         var collisionPairs: CollisionPair[] = [];

         for (var j = 0, l = potentialColliders.length; j < l; j++) {

            actor = potentialColliders[j];

            // Query the collision tree for potential colliders for the current actor
            this._dynamicCollisionTree.query(actor, (other: Actor) => {
               if (other.collisionType === CollisionType.PreventCollision || other.isKilled()) { return false; }

               var minimumTranslationVector;
               // collides returns the minimum translation vector for a collision
               if (minimumTranslationVector = actor.collides(other)) {
                  var side = actor.getSideFromIntersect(minimumTranslationVector);
                  var collisionPair = new CollisionPair(actor, other, minimumTranslationVector, side);
                  if (!collisionPairs.some((cp) => {
                     return cp.equals(collisionPair);
                  })) {
                     collisionPairs.push(collisionPair);
                  }
                  return true;
               }
               return false;
            });
         }

         var i = 0, len = collisionPairs.length;
         for (i; i < len; i++) {
            // when collision pairs are evaluated, events are fired and actors positioned according to their ColllisionType
            collisionPairs[i].evaluate();
         }

         return collisionPairs;
      }

      /**
       * Update collision tree with new actor positions
       */
      public update(targets: Actor[]): number {
         var updated = 0, i = 0, len = targets.length;

         for (i; i < len; i++) {
            if (this._dynamicCollisionTree.updateActor(targets[i])) {
               updated++;
            }
         }
         
         return updated;
      }

      public debugDraw(ctx: CanvasRenderingContext2D, delta: number) {
         this._dynamicCollisionTree.debugDraw(ctx, delta);
      }
   }
 }