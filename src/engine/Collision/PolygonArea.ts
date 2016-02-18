﻿module ex {
    export interface IPolygonAreaOptions {
        pos?: Vector;
        points?: Vector[];
        clockwiseWinding?: boolean;
        actor?: Actor;
    }

    /**
     * Polygon collision area for detecting collisions for actors, or independently
     */
    export class PolygonArea implements ICollisionArea {
        public pos: Vector;
        public points: Vector[];
        public actor: Actor;

        private _transformedPoints: Vector[] = [];
        
        constructor(options: IPolygonAreaOptions) {
            this.pos = options.pos || Vector.Zero.clone();
            var winding = !!options.clockwiseWinding;
            this.points = (winding ? options.points.reverse() : options.points) || [];
            this.actor = options.actor || null;

            // calculate initial transformation
            this._calculateTransformation();
        }

        /**
         * Get the center of the collision area in world coordinates
         */
        public getCenter(): Vector {
            if (this.actor) {
                return this.actor.pos.add(this.pos);
            }
            return this.pos;
        }

        /**
         * Calculates the underlying transformation from actor relative space to world space
         */
        private _calculateTransformation() {
            if (this.actor) {
                var len = this.points.length;
                this._transformedPoints.length = 0; // clear out old transform
                var pos = this.actor.pos;
                var angle = this.actor.rotation;
                for (var i = 0; i < len; i++) {
                    this._transformedPoints[i] = this.points[i].rotate(angle).add(pos);
                }
            } else {
                this._transformedPoints = this.points.concat([]);
            }
        }

        /**
         * Gets the points that make up the polygon in world space, from actor relative space (if specified)
         */
        public getTransformedPoints(): Vector[] {
            return this._transformedPoints;
        }

        /**
         * Gets the sides of the polygon in world space
         */
        public getSides(): Line[] {
            var lines = [];
            var points = this.getTransformedPoints();
            var len = points.length;
            for (var i = 0; i < len; i++) {
                lines.push(new Line(points[i], points[(i - 1 + len) % len]));
            }
            return lines;
        }

        /**
         * Tests if a point is contained in this collision area in world space
         */
        public contains(point: Vector): boolean {
            // Always cast to the right, as long as we cast in a consitent fixed direction we
            // will be fine
            var testRay = new Ray(point, new Vector(1, 0));
            var intersectCount = this.getSides().reduce(function (accum, side, i, arr) {
                if (testRay.intersect(side) >= 0) {
                    return accum + 1;
                }
                return accum;
            }, 0);


            if (intersectCount % 2 === 0) {
                return false;
            }
            return true;
        }
                
        public collide(area: ICollisionArea): CollisionContact {
            if (area instanceof CircleArea) {
                return CollisionJumpTable.CollideCirclePolygon(area, this);
            } else if (area instanceof PolygonArea) {
                return CollisionJumpTable.CollidePolygonPolygon(this, area);
            } else if (area instanceof EdgeArea) {
                return CollisionJumpTable.CollidePolygonEdge(this, area);
            } else {
                throw new Error(`Polygon could not collide with unknown ICollisionArea ${typeof area}`);
            }
        }

        /**
         * Find the point on the shape furthest in the direction specified
         */
        public getFurthestPoint(direction: Vector): Vector {
            var pts = this.getTransformedPoints();
            var furthestPoint = null;
            var maxDistance = -Number.MAX_VALUE;
            for (var i = 0; i < pts.length; i++) {
                var distance = direction.dot(pts[i]);
                if (distance > maxDistance) {
                    maxDistance = distance;
                    furthestPoint = pts[i];
                }
            }
            return furthestPoint;
        }

        /**
         * Get the axis aligned bounding box for the circle area
         */
        public getBounds(): BoundingBox {
            // todo there is a faster way to do this
            var points = this.getTransformedPoints();

            var minX = points.reduce(function (prev, curr) {
                return Math.min(prev, curr.x);
            }, Number.MAX_VALUE);
            var maxX = points.reduce(function (prev, curr) {
                return Math.max(prev, curr.x);
            }, -Number.MAX_VALUE);

            var minY = points.reduce(function (prev, curr) {
                return Math.min(prev, curr.y);
            }, Number.MAX_VALUE);
            var maxY = points.reduce(function (prev, curr) {
                return Math.max(prev, curr.y);
            }, -Number.MAX_VALUE);

            return new BoundingBox(minX, minY, maxY, maxX);
        }

        /**
         * Casts a ray into the polygon and returns a vector representing the point of contact (in world space) or null if no collision.
         */
        public castRay(ray: Ray) {
            // find the minimum contact time greater than 0
            // contact times less than 0 are behind the ray and we don't want those
            var sides = this.getSides();
            var len = sides.length;
            var minContactTime = Number.MAX_VALUE;
            var contactIndex = -1;
            for (var i = 0; i < len; i++) {
                var contactTime = ray.intersect(sides[i]);
                if (contactTime >= 0 && contactTime < minContactTime) {
                    minContactTime = contactTime;
                    contactIndex = i;
                }
            }

            // contact was found
            if (i >= 0) {
                return ray.getPoint(minContactTime);
            }

            // no contact found
            return null;
        }

        /**
         * Get the axis associated with the edge
         */
        public getAxes(): Vector[] {
            var axes = [];
            var points = this.getTransformedPoints();
            var len = points.length;
            for (var i = 0; i < len; i++) {
                axes.push(points[i].sub(points[(i + 1) % len]).normal());
            }
            return axes;
        }

        /**
         * Perform Separating Axis test against another polygon, returns null if no overlap in polys
         * Reference http://www.dyn4j.org/2010/01/sat/
         */
        public testSeparatingAxisTheorem(other: PolygonArea): Vector {
            var poly1 = this;
            var poly2 = other;
            var axes = poly1.getAxes().concat(poly2.getAxes());

            var minOverlap = Number.MAX_VALUE;
            var minAxis = null;
            var minIndex = -1;
            for (var i = 0; i < axes.length; i++) {
                var proj1 = poly1.project(axes[i]);
                var proj2 = poly2.project(axes[i]);
                var overlap = proj1.overlap(proj2);
                if (overlap <= 0) {
                    return null;
                } else {
                    if (overlap < minOverlap) {
                        minOverlap = overlap;
                        minAxis = axes[i];
                        minIndex = i;
                    }
                }
            }

            // Sanity check
            if (minIndex === -1) {
                return null;
            }

            return minAxis.normalize().scale(minOverlap);
        }

        /**
         * Project the edges of the polygon along a specified axis
         */
        public project(axis: Vector): Projection {
            var scalars = [];

            var points = this.getTransformedPoints();
            var len = points.length;
            for (var i = 0; i < len; i++) {
                scalars.push(points[i].dot(axis));
            }

            return new Projection(Math.min.apply(Math, scalars), Math.max.apply(Math, scalars));
        }
    }
}