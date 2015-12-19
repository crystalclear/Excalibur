module ex {

   /**
    * Interface to implement for a new bounding physics body, like Polygon, Circles, Edges, etc.
    */
   export interface IShape {
      // Returns a AABB bounding box around the area
      getBounds(): BoundingBox;
      // Returns the time when the ray collides with the bounding area (returns -1 if no collision)
      rayCast(ray: Ray): number;
      // Returns the minimum translation vector if 2 bounding areas collide
      collides(area: IShape): CollisionPair;
      // Reference back to the actor who owns this shape
      actor: Actor;
      // Returns the transform for the current shape
      //getTransform(): Matrix;
   }

}