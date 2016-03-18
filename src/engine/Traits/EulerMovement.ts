/// <reference path="../Interfaces/IActorTrait.ts" />

module ex.Traits {
   export class EulerMovement implements IActorTrait { 
      public update(actor: Actor, engine: Engine, delta: number) {
         if(actor.sleeping) return;
         
         // Update placements based on linear algebra
         var seconds = delta / 1000;
         
         
         actor.oldVel = actor.vel;
         actor.vel.addEquals(actor.acc.scale(seconds));
         
         actor.pos.addEquals(actor.vel.scale(seconds)).addEquals(actor.acc.scale(0.5 * seconds * seconds));
         
         actor.rx += actor.torque * (1.0 / actor.moi) * seconds;
         actor.rotation += actor.rx * seconds;
         
         /*
         actor.x += actor.dx * delta / 1000;
         actor.y += actor.dy * delta / 1000;

         actor.dx += actor.ax * delta / 1000;
         actor.dy += actor.ay * delta / 1000;

         actor.rotation += actor.rx * delta / 1000;
         */
        
         actor.scale.x += actor.sx * delta / 1000;
         actor.scale.y += actor.sy * delta / 1000;
         
      }
   }
}